import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ImageInsertModal — modern 8-handle crop, upload / camera, max-size clamp
//
// Props:
//   onInsert(dataUrl)   – final image data URL
//   onClose()
//   maxW                – max output px width  (default 600)
//   maxH                – max output px height (default 450)
// ─────────────────────────────────────────────────────────────────────────────

const DISPLAY_W = 500;
const DISPLAY_H = 380;
const HANDLE_HIT = 16;   // px hit-box radius for handles
const MIN_CROP   = 20;   // min crop dimension

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export default function ImageInsertModal({ onInsert, onClose, maxW = 600, maxH = 450 }) {
  const [tab, setTab]             = useState("upload");
  // image loading pipeline
  const [rawSrc, setRawSrc]       = useState(null);
  const [imageReady, setImageReady] = useState(false);   // true only after img.onload
  // crop state
  const [crop, setCrop]           = useState(null);      // { x, y, w, h } in canvas-px
  const [dragState, setDragState] = useState(null);      // active drag descriptor
  // camera
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  // canvas
  const canvasRef  = useRef(null);
  const imgEl      = useRef(null);   // HTMLImageElement (set in onload)
  const canvasMeta = useRef({ dw: 0, dh: 0 });

  // ── Step 1: load image after rawSrc changes ───────────────────────────────
  useEffect(() => {
    if (!rawSrc) { setImageReady(false); imgEl.current = null; return; }
    setImageReady(false);
    const img = new window.Image();
    img.onload = () => {
      const r  = Math.min(DISPLAY_W / img.naturalWidth, DISPLAY_H / img.naturalHeight, 1);
      const dw = Math.round(img.naturalWidth  * r);
      const dh = Math.round(img.naturalHeight * r);
      imgEl.current        = img;
      canvasMeta.current   = { dw, dh };
      setCrop({ x: 0, y: 0, w: dw, h: dh });   // full-image default
      setImageReady(true);                        // THEN reveal canvas
    };
    img.src = rawSrc;
    return () => { img.onload = null; };
  }, [rawSrc]);

  // ── Step 2: draw — runs synchronously after DOM paint (useLayoutEffect) ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgEl.current;
    if (!canvas || !img) return;
    const { dw, dh } = canvasMeta.current;
    if (!dw || !dh) return;

    canvas.width  = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");

    // base image
    ctx.drawImage(img, 0, 0, dw, dh);
    if (!crop || crop.w < 1 || crop.h < 1) return;

    const { x, y, w, h } = crop;

    // dim outside crop (even-odd rule)
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.beginPath();
    ctx.rect(0, 0, dw, dh);
    ctx.rect(x, y, w, h);
    ctx.fill("evenodd");

    // re-draw bright crop area
    ctx.drawImage(
      img,
      (x / dw) * img.naturalWidth,  (y / dh) * img.naturalHeight,
      (w / dw) * img.naturalWidth,  (h / dh) * img.naturalHeight,
      x, y, w, h,
    );

    // rule-of-thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.30)";
    ctx.lineWidth   = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + w*i/3, y);   ctx.lineTo(x + w*i/3, y+h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h*i/3);   ctx.lineTo(x+w, y + h*i/3); ctx.stroke();
    }

    // border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);

    // 8 handles
    const hs = 10, hx = x + w/2 - hs/2, hy = y + h/2 - hs/2;
    const handlePts = [
      [x,       y      ], [hx,      y      ], [x+w-hs, y      ],
      [x+w-hs, hy      ],                     [x,       hy     ],
      [x,      y+h-hs  ], [hx,     y+h-hs  ], [x+w-hs, y+h-hs ],
    ];
    ctx.fillStyle = "#fff";
    handlePts.forEach(([px, py]) => { ctx.fillRect(px, py, hs, hs); });
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    handlePts.forEach(([px, py]) => { ctx.strokeRect(px, py, hs, hs); });
  }, [crop]);

  // Only draw when canvas is in DOM (imageReady gates its rendering)
  useLayoutEffect(() => { draw(); }, [draw, imageReady]);

  // ── Canvas interaction ────────────────────────────────────────────────────
  const getCanvasPos = (e) => {
    const r  = canvasRef.current.getBoundingClientRect();
    const sx = canvasRef.current.width  / r.width;
    const sy = canvasRef.current.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const hitTest = (pos) => {
    if (!crop) return null;
    const { x, y, w, h } = crop;
    const hx = x + w/2, hy = y + h/2;
    const pts = { nw:[x,y], n:[hx,y], ne:[x+w,y], e:[x+w,hy], se:[x+w,y+h], s:[hx,y+h], sw:[x,y+h], w:[x,hy] };
    for (const [name, [px, py]] of Object.entries(pts)) {
      if (Math.abs(pos.x-px) < HANDLE_HIT && Math.abs(pos.y-py) < HANDLE_HIT) return name;
    }
    if (pos.x > x && pos.x < x+w && pos.y > y && pos.y < y+h) return "move";
    return "_new";
  };

  const cursorFor = (hit) => ({
    nw:"nw-resize", n:"n-resize", ne:"ne-resize", e:"e-resize",
    se:"se-resize", s:"s-resize", sw:"sw-resize", w:"w-resize",
    move:"move", _new:"crosshair",
  }[hit] || "crosshair");

  const onMouseDown = (e) => {
    if (!imageReady) return;
    const pos = getCanvasPos(e);
    const hit = hitTest(pos);
    if (hit === "_new") {
      const { dw, dh } = canvasMeta.current;
      const px = clamp(pos.x, 0, dw), py = clamp(pos.y, 0, dh);
      setCrop({ x: px, y: py, w: 0, h: 0 });
      setDragState({ hit, startX: pos.x, startY: pos.y, orig: { x: px, y: py, w: 0, h: 0 } });
    } else if (hit) {
      setDragState({ hit, startX: pos.x, startY: pos.y, orig: { ...crop } });
    }
  };

  const onMouseMove = useCallback((e) => {
    if (!canvasRef.current || !imageReady) return;
    const pos = getCanvasPos(e);

    // Update cursor when not dragging
    if (!dragState) {
      canvasRef.current.style.cursor = cursorFor(hitTest(pos));
      return;
    }

    const dx = pos.x - dragState.startX;
    const dy = pos.y - dragState.startY;
    const { dw, dh } = canvasMeta.current;
    const oc = dragState.orig;

    if (dragState.hit === "_new") {
      const ox = dragState.startX, oy = dragState.startY;
      const ex = clamp(pos.x, 0, dw), ey = clamp(pos.y, 0, dh);
      setCrop({ x: Math.min(ox,ex), y: Math.min(oy,ey), w: Math.abs(ex-ox), h: Math.abs(ey-oy) });
      return;
    }
    if (dragState.hit === "move") {
      setCrop({ x: clamp(oc.x+dx, 0, dw-oc.w), y: clamp(oc.y+dy, 0, dh-oc.h), w: oc.w, h: oc.h });
      return;
    }

    // Corner / edge resize
    let { x, y, w, h } = oc;
    const hit = dragState.hit;
    if (hit.includes("e")) { w = clamp(oc.w+dx, MIN_CROP, dw-oc.x); }
    if (hit.includes("s")) { h = clamp(oc.h+dy, MIN_CROP, dh-oc.y); }
    if (hit.includes("w")) { const nx = clamp(oc.x+dx, 0, oc.x+oc.w-MIN_CROP); w = oc.w-(nx-oc.x); x = nx; }
    if (hit.includes("n")) { const ny = clamp(oc.y+dy, 0, oc.y+oc.h-MIN_CROP); h = oc.h-(ny-oc.y); y = ny; }
    setCrop({ x, y, w, h });
  }, [dragState, imageReady, crop]); // eslint-disable-line

  const onMouseUp = useCallback(() => setDragState(null), []);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [dragState, onMouseMove, onMouseUp]);

  // ── Insert helpers ────────────────────────────────────────────────────────
  const outputCanvas = (sx, sy, sw, sh) => {
    const img  = imgEl.current;
    const { dw, dh } = canvasMeta.current;
    let outW = Math.round(sw * (img.naturalWidth  / dw));
    let outH = Math.round(sh * (img.naturalHeight / dh));
    const scale = Math.min(maxW / outW, maxH / outH, 1);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
    const out = document.createElement("canvas");
    out.width = outW; out.height = outH;
    out.getContext("2d").drawImage(
      img,
      sx * (img.naturalWidth  / dw), sy * (img.naturalHeight / dh),
      sw * (img.naturalWidth  / dw), sh * (img.naturalHeight / dh),
      0, 0, outW, outH,
    );
    return out.toDataURL("image/jpeg", 0.92);
  };

  const applyCropAndInsert = () => {
    if (!crop || crop.w < 4 || crop.h < 4) return;
    onInsert(outputCanvas(crop.x, crop.y, crop.w, crop.h));
    closeModal();
  };

  const insertFullImage = () => {
    const { dw, dh } = canvasMeta.current;
    onInsert(outputCanvas(0, 0, dw, dh));
    closeModal();
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch { alert("Camera access denied or not available."); }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };
  const capturePhoto = () => {
    const v = videoRef.current;
    const out = document.createElement("canvas");
    out.width = v.videoWidth; out.height = v.videoHeight;
    out.getContext("2d").drawImage(v, 0, 0);
    stopCamera();
    setRawSrc(out.toDataURL("image/png"));
  };

  const closeModal = () => { stopCamera(); onClose(); };

  const cropHasArea = crop && crop.w > 4 && crop.h > 4;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full mx-4 flex flex-col overflow-hidden"
        style={{ maxWidth: 580, maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shrink-0">
          <div>
            <span className="font-bold text-base">Insert Image</span>
            <span className="ml-2 text-xs opacity-75">max output {maxW}×{maxH}px</span>
          </div>
          <button onClick={closeModal} title="Close"
            className="text-white/80 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition">✕</button>
        </div>

        {/* Tabs — only when no image yet */}
        {!rawSrc && (
          <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
            {["upload","camera"].map(t => (
              <button key={t} type="button"
                onClick={() => { setTab(t); t === "camera" ? startCamera() : stopCamera(); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  tab === t ? "border-b-2 border-emerald-500 text-emerald-700 bg-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {t === "upload" ? "📁 Upload File" : "📷 Camera"}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4">

          {/* ── Upload drop-zone ── */}
          {!rawSrc && tab === "upload" && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 rounded-xl w-full h-52 cursor-pointer hover:bg-emerald-50 transition-all group select-none">
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-sm font-semibold text-gray-600">Click to choose an image</span>
              <span className="text-xs text-gray-400 mt-1">PNG · JPG · WEBP · GIF</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setRawSrc(ev.target.result);
                  reader.readAsDataURL(file);
                }} />
            </label>
          )}

          {/* ── Camera view ── */}
          {!rawSrc && tab === "camera" && (
            <div className="flex flex-col items-center gap-3 w-full">
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full rounded-xl border border-gray-200 bg-black"
                style={{ maxHeight: 300 }} />
              {cameraActive
                ? <button type="button" onClick={capturePhoto}
                    className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition shadow">
                    📸 Capture Photo
                  </button>
                : <button type="button" onClick={startCamera}
                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition shadow">
                    Start Camera
                  </button>}
            </div>
          )}

          {/* ── Image selected: loading spinner ── */}
          {rawSrc && !imageReady && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading image…</span>
            </div>
          )}

          {/* ── Crop stage (only after image fully loaded) ── */}
          {rawSrc && imageReady && (
            <>
              <p className="text-xs text-gray-500 text-center select-none leading-relaxed">
                ✂️ Drag <strong>corner/edge handles</strong> to resize · Drag <strong>inside</strong> the selection to move it<br/>
                Draw on empty area to start a new selection
              </p>

              {/* Canvas */}
              <div
                className="relative rounded-xl overflow-hidden border border-gray-300 shadow-inner w-full"
                style={{ maxWidth: DISPLAY_W, background: "#e5e7eb" }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ display: "block", width: "100%", cursor: "crosshair", touchAction: "none" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={!dragState ? (e => {
                    if (!imageReady || !canvasRef.current) return;
                    const pos = getCanvasPos(e);
                    canvasRef.current.style.cursor = cursorFor(hitTest(pos));
                  }) : undefined}
                />
              </div>

              {/* Crop info badge */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {cropHasArea ? (
                  <span className="text-xs text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Selection: {Math.round(crop.w)} × {Math.round(crop.h)} px → output ≤ {maxW}×{maxH}px
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    Draw a selection or use "Insert Full Image"
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 justify-center w-full">
                <button type="button" onClick={applyCropAndInsert} disabled={!cropHasArea}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow">
                  ✅ Crop &amp; Insert
                </button>
                <button type="button" onClick={insertFullImage}
                  className="px-5 py-2 bg-gray-700 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition shadow">
                  Insert Full Image
                </button>
                <button type="button" onClick={() => { setRawSrc(null); setCrop(null); setImageReady(false); imgEl.current = null; }}
                  className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                  ← Change
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
