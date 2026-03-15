import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import katex from "katex";
import { InlineMath } from "react-katex";
import ImageInsertModal from "./ImageInsertModal";

// ── Register custom Font families ────────────────────────────────────
const Font = Quill.import("formats/font");
Font.whitelist = ["arial", "times-new-roman", "courier-new", "georgia", "verdana"];
Quill.register(Font, true);

// ── Register custom font Sizes ────────────────────────────────────────
const Size = Quill.import("attributors/style/size");
Size.whitelist = ["10px","12px","14px","16px","18px","20px","24px","28px","36px","48px"];
Quill.register(Size, true);

// ── Custom MathBlot (KaTeX inline embed) ──────────────────────────────
const Embed = Quill.import("blots/embed");
class MathBlot extends Embed {
  static create(latex) {
    const node = super.create();
    node.setAttribute("data-latex", latex);
    node.setAttribute("contenteditable", "false");
    node.className = "math-formula-blot";
    try {
      node.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch { node.textContent = latex; }
    return node;
  }
  static value(node) { return node.getAttribute("data-latex"); }
}
MathBlot.blotName = "mathformula";
MathBlot.tagName = "span";
MathBlot.className = "math-formula-blot";
if (!Quill.imports["formats/mathformula"]) Quill.register(MathBlot);

// ── RawTableBlot — opaque block embed that holds interactive table HTML ──
const BlockEmbed = Quill.import("blots/block/embed");
class RawTableBlot extends BlockEmbed {
  static create(html) {
    const wrapper = super.create();
    // The wrapper itself is NOT contenteditable=false; cells inside will be editable
    wrapper.setAttribute("contenteditable", "false");
    wrapper.className = "raw-table-blot";
    wrapper.innerHTML = html;
    return wrapper;
  }
  static value(node) {
    // Return the table HTML (inner)
    return node.innerHTML;
  }
}
RawTableBlot.blotName = "rawtable";
RawTableBlot.tagName = "div";
RawTableBlot.className = "raw-table-blot";
if (!Quill.imports["formats/rawtable"]) Quill.register(RawTableBlot);

// ── RawImageBlot — block embed storing a single <img> ─────────────────
const BlockEmbedImg = Quill.import("blots/block/embed");
class RawImageBlot extends BlockEmbedImg {
  static create(src) {
    const wrapper = super.create();
    wrapper.setAttribute("contenteditable", "false");
    wrapper.className = "raw-image-blot";
    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = "max-width:100%;display:block;border-radius:4px;";
    img.draggable = false;
    wrapper.appendChild(img);
    return wrapper;
  }
  static value(node) {
    return node.querySelector("img")?.src || "";
  }
}
RawImageBlot.blotName = "rawimage";
RawImageBlot.tagName = "div";
RawImageBlot.className = "raw-image-blot";
if (!Quill.imports["formats/rawimage"]) Quill.register(RawImageBlot);

// ── TablePicker sub-component (Word-style grid) ───────────────────────
const TablePicker = ({ onSelect, onClose }) => {
  const MAX = 8;
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  return (
    <div className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 top-full left-0 mt-1"
      onMouseLeave={() => setHovered({ r: 0, c: 0 })}>
      <p className="text-xs text-gray-500 mb-2 text-center font-medium">
        {hovered.r > 0 ? `${hovered.r} × ${hovered.c} Table` : "Select table size"}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MAX}, 1.5rem)` }}>
        {Array.from({ length: MAX * MAX }, (_, idx) => {
          const r = Math.floor(idx / MAX) + 1;
          const c = (idx % MAX) + 1;
          const active = r <= hovered.r && c <= hovered.c;
          return (
            <div key={idx} className={`w-6 h-6 border rounded-sm cursor-pointer transition-colors ${active ? "bg-emerald-400 border-emerald-500" : "bg-gray-100 border-gray-300 hover:bg-emerald-100"}`}
              onMouseEnter={() => setHovered({ r, c })}
              onClick={() => { onSelect(r, c); onClose(); }} />
          );
        })}
      </div>
    </div>
  );
};

// ── InteractiveTable — renders inside the Quill editor via a portal-like injection ──
// This component manages an actual editable table with move + col-resize
const InteractiveTable = ({ tableEl }) => {
  // We don't need React; the logic is applied directly on DOM nodes in useEffect below
  return null;
};

// ── Main MathEditor ───────────────────────────────────────────────────
const MathEditor = ({ value, onChange, placeholder, className = "", maxImageW = 600, maxImageH = 450 }) => {
  const quillRef = useRef(null);
  const uid = useId();
  const toolbarId = `math-toolbar-${uid.replace(/:/g, "")}`;
  const [showMathPanel, setShowMathPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState("greek");
  const [showLatexBuilder, setShowLatexBuilder] = useState(false);
  const [latexInput, setLatexInput] = useState("");
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const insertIndexRef = useRef(0);          // cursor index when image modal opened
  const editorContainerRef = useRef(null);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const Delta = quill.constructor.import("delta");
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      const ops = delta.ops.map(op =>
        op.insert && typeof op.insert === "string"
          ? { insert: op.insert, attributes: { ...op.attributes, align: undefined } }
          : op
      );
      return new Delta(ops);
    });
  }, []);

  // ── Make table cells editable, add move handle, col-resize, and DELETE ──
  const setupTableInteractivity = useCallback((container) => {
    if (!container) return;
    const blots = container.querySelectorAll(".raw-table-blot");

    blots.forEach((blot) => {
      if (blot.dataset.interactive) return;
      blot.dataset.interactive = "1";

      // ── 1. Make cells editable ──────────────────────────────────────
      blot.querySelectorAll("td, th").forEach(cell => {
        cell.setAttribute("contenteditable", "true");
        cell.style.position = "relative";
        cell.style.minWidth = "60px";
        cell.addEventListener("keydown", e => e.stopPropagation());
        cell.addEventListener("mousedown", e => e.stopPropagation());
      });

      blot.style.position = "relative";

      // ── 2. Toolbar row: Move + Delete ──────────────────────────────
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "position:absolute;top:4px;left:4px;display:flex;gap:4px;z-index:20;pointer-events:all;opacity:0;transition:opacity 0.18s;";
      blot.addEventListener("mouseenter", () => { toolbar.style.opacity = "1"; });
      blot.addEventListener("mouseleave", () => { toolbar.style.opacity = "0"; });

      const moveHandle = document.createElement("div");
      moveHandle.className = "table-move-handle";
      moveHandle.title = "Drag to move table";
      moveHandle.textContent = "⠿ Move";
      moveHandle.style.cssText = "padding:2px 7px;background:#1f2937;color:#f9fafb;font-size:11px;line-height:16px;border-radius:4px;cursor:grab;user-select:none;opacity:0.88;";

      const delBtn = document.createElement("div");
      delBtn.title = "Remove table";
      delBtn.textContent = "✕ Delete";
      delBtn.style.cssText = "padding:2px 7px;background:#dc2626;color:#fff;font-size:11px;line-height:16px;border-radius:4px;cursor:pointer;user-select:none;opacity:0.88;";
      delBtn.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
      delBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); blot.remove(); });
      delBtn.addEventListener("mouseover", () => { delBtn.style.background = "#b91c1c"; });
      delBtn.addEventListener("mouseout",  () => { delBtn.style.background = "#dc2626"; });

      toolbar.appendChild(moveHandle);
      toolbar.appendChild(delBtn);
      blot.prepend(toolbar);

      // ── Drag-to-move logic ─────────────────────────────────────────
      const startDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        const editorEl = blot.closest(".ql-editor") || blot.parentElement;
        editorEl.style.position = "relative";
        const eR = editorEl.getBoundingClientRect();
        const bR = blot.getBoundingClientRect();
        const iL = bR.left - eR.left + editorEl.scrollLeft;
        const iT = bR.top  - eR.top  + editorEl.scrollTop;
        blot.style.position = "absolute";
        blot.style.left = iL + "px"; blot.style.top = iT + "px";
        blot.style.width = bR.width + "px";
        blot.style.zIndex = "50"; blot.style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)";
        moveHandle.style.cursor = "grabbing";
        const sx = e.clientX, sy = e.clientY;
        const mv = (me) => { blot.style.left=(iL+me.clientX-sx)+"px"; blot.style.top=(iT+me.clientY-sy)+"px"; };
        const up = () => { moveHandle.style.cursor="grab"; blot.style.zIndex="1"; blot.style.boxShadow=""; document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
        document.addEventListener("mousemove", mv);
        document.addEventListener("mouseup", up);
      };
      moveHandle.addEventListener("mousedown", startDrag);

      // ── 3. Column resize handles ───────────────────────────────────
      blot.querySelectorAll("tr").forEach(row => {
        const cells = row.querySelectorAll("td, th");
        cells.forEach((cell, i) => {
          if (i === cells.length - 1) return;
          const resizer = document.createElement("div");
          resizer.className = "col-resizer";
          resizer.style.cssText = "position:absolute;right:-3px;top:0;width:6px;height:100%;cursor:col-resize;z-index:5;background:transparent;user-select:none;";
          resizer.addEventListener("mousedown", (e) => {
            e.preventDefault(); e.stopPropagation();
            const sx = e.clientX, sw = cell.offsetWidth, nw = cells[i+1].offsetWidth;
            const mv = (me) => { const dx=me.clientX-sx; cell.style.width=Math.max(40,sw+dx)+"px"; cells[i+1].style.width=Math.max(40,nw-dx)+"px"; };
            const up = () => { document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
            document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
          });
          resizer.addEventListener("mouseover", () => { resizer.style.background="rgba(16,185,129,0.5)"; });
          resizer.addEventListener("mouseout",  () => { resizer.style.background="transparent"; });
          cell.appendChild(resizer);
        });
      });

      // ── 4. Table-level resize handles (8 — corners + edges) ───────
      const TABLE_HANDLES = [
        { id:"nw", style:"top:-5px;left:-5px",                              cursor:"nw-resize" },
        { id:"ne", style:"top:-5px;right:-5px",                             cursor:"ne-resize" },
        { id:"se", style:"bottom:-5px;right:-5px",                          cursor:"se-resize" },
        { id:"sw", style:"bottom:-5px;left:-5px",                           cursor:"sw-resize" },
        { id:"n",  style:"top:-5px;left:50%;transform:translateX(-50%)",    cursor:"n-resize"  },
        { id:"s",  style:"bottom:-5px;left:50%;transform:translateX(-50%)", cursor:"s-resize"  },
        { id:"e",  style:"right:-5px;top:50%;transform:translateY(-50%)",   cursor:"e-resize"  },
        { id:"w",  style:"left:-5px;top:50%;transform:translateY(-50%)",    cursor:"w-resize"  },
      ];

      TABLE_HANDLES.forEach(({ id, style, cursor }) => {
        const h = document.createElement("div");
        h.style.cssText = `position:absolute;${style};width:10px;height:10px;background:#10b981;border:2px solid #fff;border-radius:2px;cursor:${cursor};z-index:22;user-select:none;opacity:0;transition:opacity 0.15s;`;
        blot.appendChild(h);

        blot.addEventListener("mouseenter", () => { h.style.opacity = "1"; });
        blot.addEventListener("mouseleave", () => { h.style.opacity = "0"; });

        h.addEventListener("mousedown", (e) => {
          e.preventDefault(); e.stopPropagation();
          // Make sure blot is absolutely positioned so width/height change is visual
          if (blot.style.position !== "absolute") {
            const editorEl = blot.closest(".ql-editor") || blot.parentElement;
            editorEl.style.position = "relative";
            const eR = editorEl.getBoundingClientRect();
            const bR = blot.getBoundingClientRect();
            blot.style.position = "absolute";
            blot.style.left = (bR.left - eR.left + editorEl.scrollLeft) + "px";
            blot.style.top  = (bR.top  - eR.top  + editorEl.scrollTop)  + "px";
          }
          const startX = e.clientX, startY = e.clientY;
          const startW = blot.offsetWidth, startH = blot.offsetHeight;
          const startL = blot.offsetLeft,  startT = blot.offsetTop;

          const mv = (me) => {
            const dx = me.clientX - startX;
            const dy = me.clientY - startY;
            let newW = startW, newH = startH, newL = startL, newT = startT;

            if (id.includes("e"))  newW = Math.max(80, startW + dx);
            if (id.includes("s"))  newH = Math.max(40, startH + dy);
            if (id.includes("w")) { newW = Math.max(80, startW - dx); newL = startL + startW - newW; }
            if (id.includes("n")) { newH = Math.max(40, startH - dy); newT = startT + startH - newH; }

            blot.style.width  = newW + "px";
            blot.style.height = newH + "px";
            if (id.includes("w")) blot.style.left = newL + "px";
            if (id.includes("n")) blot.style.top  = newT + "px";
          };
          const up = () => { document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
          document.addEventListener("mousemove", mv);
          document.addEventListener("mouseup", up);
        });
      });
    });
  }, []);

  // ── Move + 8-handle resize + delete for inserted images ───────────────────
  const setupImageInteractivity = useCallback((container) => {
    if (!container) return;
    container.querySelectorAll(".raw-image-blot").forEach((blot) => {
      if (blot.dataset.imgInteractive) return;
      blot.dataset.imgInteractive = "1";
      blot.style.position = "relative";
      blot.style.display  = "inline-block";

      const img = blot.querySelector("img");
      if (!img) return;

      // ── Toolbar (move + delete) ──────────────────────────────────────
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "position:absolute;top:4px;left:4px;display:flex;gap:4px;z-index:25;pointer-events:all;opacity:0;transition:opacity 0.18s;";
      blot.addEventListener("mouseenter", () => { toolbar.style.opacity = "1"; });
      blot.addEventListener("mouseleave", () => { toolbar.style.opacity = "0"; });

      const mh = document.createElement("div");
      mh.textContent = "⠿ Move";
      mh.title = "Drag to move image";
      mh.style.cssText = "padding:2px 7px;background:#1f2937;color:#f9fafb;font-size:11px;line-height:16px;border-radius:4px;cursor:grab;user-select:none;opacity:0.88;";

      const delBtn = document.createElement("div");
      delBtn.textContent = "✕ Delete";
      delBtn.title = "Remove image";
      delBtn.style.cssText = "padding:2px 7px;background:#dc2626;color:#fff;font-size:11px;line-height:16px;border-radius:4px;cursor:pointer;user-select:none;opacity:0.88;";
      delBtn.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
      delBtn.addEventListener("click",     (e) => { e.preventDefault(); e.stopPropagation(); blot.remove(); });
      delBtn.addEventListener("mouseover", () => { delBtn.style.background = "#b91c1c"; });
      delBtn.addEventListener("mouseout",  () => { delBtn.style.background = "#dc2626"; });

      toolbar.appendChild(mh);
      toolbar.appendChild(delBtn);
      blot.appendChild(toolbar);

      // ── Move (drag entire blot) ──────────────────────────────────────
      mh.addEventListener("mousedown", (e) => {
        e.preventDefault(); e.stopPropagation();
        const editorEl = blot.closest(".ql-editor") || blot.parentElement;
        editorEl.style.position = "relative";
        const eR = editorEl.getBoundingClientRect();
        const bR = blot.getBoundingClientRect();
        const iL = bR.left - eR.left + editorEl.scrollLeft;
        const iT = bR.top  - eR.top  + editorEl.scrollTop;
        blot.style.position = "absolute";
        blot.style.left = iL + "px"; blot.style.top = iT + "px";
        blot.style.zIndex = "50";
        mh.style.cursor = "grabbing";
        const sx = e.clientX, sy = e.clientY;
        const mv = (me) => { blot.style.left=(iL+me.clientX-sx)+"px"; blot.style.top=(iT+me.clientY-sy)+"px"; };
        const up = () => { mh.style.cursor="grab"; blot.style.zIndex="1"; document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
        document.addEventListener("mousemove", mv);
        document.addEventListener("mouseup", up);
      });

      // ── 8 resize handles (corners + edges) ──────────────────────────
      const HANDLES = [
        // corner handles
        { id:"nw", style:"top:-5px;left:-5px",               cursor:"nw-resize" },
        { id:"ne", style:"top:-5px;right:-5px",              cursor:"ne-resize" },
        { id:"se", style:"bottom:-5px;right:-5px",           cursor:"se-resize" },
        { id:"sw", style:"bottom:-5px;left:-5px",            cursor:"sw-resize" },
        // edge handles
        { id:"n",  style:"top:-5px;left:50%;transform:translateX(-50%)",          cursor:"n-resize" },
        { id:"s",  style:"bottom:-5px;left:50%;transform:translateX(-50%)",       cursor:"s-resize" },
        { id:"e",  style:"right:-5px;top:50%;transform:translateY(-50%)",         cursor:"e-resize" },
        { id:"w",  style:"left:-5px;top:50%;transform:translateY(-50%)",          cursor:"w-resize" },
      ];

      HANDLES.forEach(({ id, style, cursor }) => {
        const h = document.createElement("div");
        h.style.cssText = `position:absolute;${style};width:10px;height:10px;background:#10b981;border:2px solid #fff;border-radius:2px;cursor:${cursor};z-index:22;user-select:none;opacity:0;transition:opacity 0.15s;`;
        h.dataset.resizeHandle = id;
        blot.appendChild(h);

        // Show handles on blot hover
        blot.addEventListener("mouseenter", () => { h.style.opacity = "1"; });
        blot.addEventListener("mouseleave", () => { h.style.opacity = "0"; });

        h.addEventListener("mousedown", (e) => {
          e.preventDefault(); e.stopPropagation();
          const startX = e.clientX, startY = e.clientY;
          const startW = img.offsetWidth,  startH = img.offsetHeight;
          const startL = blot.offsetLeft,  startT = blot.offsetTop;

          const mv = (me) => {
            const dx = me.clientX - startX;
            const dy = me.clientY - startY;
            let newW = startW, newH = startH, newL = startL, newT = startT;

            if (id.includes("e"))  newW = Math.max(40, startW + dx);
            if (id.includes("s"))  newH = Math.max(40, startH + dy);
            if (id.includes("w")) { newW = Math.max(40, startW - dx); newL = startL + startW - newW; }
            if (id.includes("n")) { newH = Math.max(40, startH - dy); newT = startT + startH - newH; }

            img.style.width  = newW + "px";
            img.style.height = newH + "px";
            // When resizing from left/top, adjust blot position too
            if (id.includes("w") || id.includes("n")) {
              blot.style.position = "absolute";
              if (id.includes("w")) blot.style.left = newL + "px";
              if (id.includes("n")) blot.style.top  = newT + "px";
            }
          };
          const up = () => { document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); };
          document.addEventListener("mousemove", mv);
          document.addEventListener("mouseup", up);
        });
      });
    });
  }, []);

  // Observe the editor for new tables AND images being inserted
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const editorRoot = quill.root;

    setupTableInteractivity(editorRoot);
    setupImageInteractivity(editorRoot);

    const observer = new MutationObserver(() => {
      setupTableInteractivity(editorRoot);
      setupImageInteractivity(editorRoot);
    });
    observer.observe(editorRoot, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [setupTableInteractivity, setupImageInteractivity]);

  // ── Insert helpers ──────────────────────────────────────────────────
  const getIndex = () => {
    const q = quillRef.current?.getEditor();
    return q ? (q.getSelection()?.index ?? q.getLength() - 1) : 0;
  };

  const insertSymbol = (text) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const idx = getIndex();
    q.insertText(idx, text);
    q.setSelection(idx + text.length);
  };

  const insertMathBlot = (latex) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const idx = getIndex();
    q.insertEmbed(idx, "mathformula", latex, "user");
    q.insertText(idx + 1, " ");
    q.setSelection(idx + 2);
  };

  const insertTable = useCallback((rows, cols) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;

    // Equal width columns as %
    const colW = Math.floor(100 / cols);

    const cellStyle = [
      "border:1px solid #374151",
      "padding:8px 10px",
      `width:${colW}%`,
      "min-width:60px",
      "box-sizing:border-box",
      "vertical-align:top",
      "background:#ffffff",
    ].join(";");

    const tableRows = Array.from({ length: rows }, () =>
      `<tr>${Array.from({ length: cols }, () =>
        `<td style="${cellStyle}">&nbsp;</td>`
      ).join("")}</tr>`
    ).join("");

    const tableHTML = `<table style="border-collapse:collapse;width:100%;table-layout:fixed;">${tableRows}</table>`;

    const range = q.getSelection() || { index: q.getLength() - 1 };
    q.insertEmbed(range.index, "rawtable", tableHTML, "user");
    q.insertText(range.index + 1, "\n", "user");
    q.setSelection(range.index + 2);
    setShowTablePicker(false);
  }, []);

  const insertCustomLatex = () => {
    if (latexInput.trim()) { insertMathBlot(latexInput.trim()); setLatexInput(""); }
  };

  // ── Insert image from modal ─────────────────────────────────────────
  const insertImage = useCallback((dataUrl) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const idx = insertIndexRef.current;
    q.insertEmbed(idx, "rawimage", dataUrl, "user");
    q.insertText(idx + 1, "\n", "user");
    q.setSelection(idx + 2);
  }, []);

  // ── Quill toolbar & formats ─────────────────────────────────────────
  const modules = {
    toolbar: {
      container: `#${toolbarId}`,
    },
    history: { delay: 500, maxStack: 100 },
  };

  const formats = [
    "font","size","bold","italic","underline","strike",
    "color","background","align",
    "script","list","bullet","indent",
    "link","image","blockquote","code-block",
    "mathformula","rawtable","rawimage",
  ];

  // ── Symbol Library ──────────────────────────────────────────────────
  const mathSymbols = {
    greek: { label:"Greek", icon:"α", symbols:[
      {d:"α",v:"α",n:"Alpha"},{d:"β",v:"β",n:"Beta"},{d:"γ",v:"γ",n:"Gamma"},
      {d:"δ",v:"δ",n:"Delta"},{d:"ε",v:"ε",n:"Epsilon"},{d:"ζ",v:"ζ",n:"Zeta"},
      {d:"η",v:"η",n:"Eta"},{d:"θ",v:"θ",n:"Theta"},{d:"ι",v:"ι",n:"Iota"},
      {d:"κ",v:"κ",n:"Kappa"},{d:"λ",v:"λ",n:"Lambda"},{d:"μ",v:"μ",n:"Mu"},
      {d:"ν",v:"ν",n:"Nu"},{d:"ξ",v:"ξ",n:"Xi"},{d:"π",v:"π",n:"Pi"},
      {d:"ρ",v:"ρ",n:"Rho"},{d:"σ",v:"σ",n:"Sigma"},{d:"τ",v:"τ",n:"Tau"},
      {d:"υ",v:"υ",n:"Upsilon"},{d:"φ",v:"φ",n:"Phi"},{d:"χ",v:"χ",n:"Chi"},
      {d:"ψ",v:"ψ",n:"Psi"},{d:"ω",v:"ω",n:"Omega"},
      {d:"Γ",v:"Γ",n:"Γ"},{d:"Δ",v:"Δ",n:"Δ"},{d:"Θ",v:"Θ",n:"Θ"},
      {d:"Λ",v:"Λ",n:"Λ"},{d:"Π",v:"Π",n:"Π"},{d:"Σ",v:"Σ",n:"Σ"},
      {d:"Φ",v:"Φ",n:"Φ"},{d:"Ψ",v:"Ψ",n:"Ψ"},{d:"Ω",v:"Ω",n:"Ω"},
    ]},
    operators: { label:"Operators", icon:"±", symbols:[
      {d:"±",v:"±",n:"Plus-minus"},{d:"∓",v:"∓",n:"Minus-plus"},
      {d:"×",v:"×",n:"Multiply"},{d:"÷",v:"÷",n:"Divide"},
      {d:"·",v:"·",n:"Dot"},{d:"∘",v:"∘",n:"Compose"},
      {d:"∞",v:"∞",n:"Infinity"},{d:"∝",v:"∝",n:"Proportional"},
      {d:"∴",v:"∴",n:"Therefore"},{d:"∵",v:"∵",n:"Because"},
    ]},
    relations: { label:"Relations", icon:"≤", symbols:[
      {d:"≠",v:"≠",n:"Not equal"},{d:"≡",v:"≡",n:"Identical"},
      {d:"≈",v:"≈",n:"Approx"},{d:"≅",v:"≅",n:"Congruent"},
      {d:"∼",v:"∼",n:"Similar"},{d:"≤",v:"≤",n:"≤"},
      {d:"≥",v:"≥",n:"≥"},{d:"≪",v:"≪",n:"≪"},{d:"≫",v:"≫",n:"≫"},
    ]},
    calculus: { label:"Calculus", icon:"∫", symbols:[
      {d:"∫",v:"∫",n:"Integral"},{d:"∬",v:"∬",n:"Double"},{d:"∭",v:"∭",n:"Triple"},
      {d:"∮",v:"∮",n:"Contour"},{d:"∂",v:"∂",n:"Partial"},{d:"∇",v:"∇",n:"Nabla"},
      {d:"∆",v:"∆",n:"Delta"},{d:"∑",v:"∑",n:"Sum"},{d:"∏",v:"∏",n:"Product"},
    ]},
    sets: { label:"Sets", icon:"∈", symbols:[
      {d:"∈",v:"∈",n:"In"},{d:"∉",v:"∉",n:"Not in"},{d:"⊂",v:"⊂",n:"Subset"},
      {d:"∪",v:"∪",n:"Union"},{d:"∩",v:"∩",n:"Intersect"},{d:"∅",v:"∅",n:"Empty"},
      {d:"ℕ",v:"ℕ",n:"ℕ"},{d:"ℤ",v:"ℤ",n:"ℤ"},{d:"ℝ",v:"ℝ",n:"ℝ"},{d:"ℂ",v:"ℂ",n:"ℂ"},
      {d:"∀",v:"∀",n:"For all"},{d:"∃",v:"∃",n:"Exists"},
      {d:"¬",v:"¬",n:"NOT"},{d:"∧",v:"∧",n:"AND"},{d:"∨",v:"∨",n:"OR"},
    ]},
    geometry: { label:"Geometry", icon:"∠", symbols:[
      {d:"°",v:"°",n:"Degree"},{d:"∠",v:"∠",n:"Angle"},{d:"⊥",v:"⊥",n:"Perp"},
      {d:"∥",v:"∥",n:"Parallel"},{d:"△",v:"△",n:"Triangle"},
      {d:"→",v:"→",n:"→"},{d:"←",v:"←",n:"←"},{d:"↔",v:"↔",n:"↔"},
      {d:"⇒",v:"⇒",n:"⇒"},{d:"⇔",v:"⇔",n:"⇔"},
    ]},
  };

  const latexTemplates = [
    {label:"a/b",latex:"\\frac{a}{b}",name:"Fraction"},
    {label:"√",latex:"\\sqrt{\\square}",name:"Square Root"},
    {label:"ⁿ√",latex:"\\sqrt[n]{\\square}",name:"Nth Root"},
    {label:"x²",latex:"x^{2}",name:"Power"},
    {label:"xₙ",latex:"x_{n}",name:"Subscript"},
    {label:"|x|",latex:"\\left|\\square\\right|",name:"Absolute Value"},
    {label:"d/dx",latex:"\\frac{d}{dx}\\,\\square",name:"Derivative"},
    {label:"d²/dx²",latex:"\\frac{d^2}{dx^2}\\,\\square",name:"2nd Derivative"},
    {label:"∂/∂x",latex:"\\frac{\\partial}{\\partial x}\\,\\square",name:"Partial"},
    {label:"∫dx",latex:"\\int \\square\\,dx",name:"Indefinite Integral"},
    {label:"∫_a^b",latex:"\\int_{a}^{b} \\square\\,dx",name:"Definite Integral"},
    {label:"∬",latex:"\\iint_{D} \\square\\,dA",name:"Double Integral"},
    {label:"∭",latex:"\\iiint_{V} \\square\\,dV",name:"Triple Integral"},
    {label:"∮",latex:"\\oint_{C} \\square\\,dr",name:"Contour Integral"},
    {label:"∑",latex:"\\sum_{i=1}^{n} \\square",name:"Summation"},
    {label:"∏",latex:"\\prod_{i=1}^{n} \\square",name:"Product"},
    {label:"lim",latex:"\\lim_{x \\to \\infty} \\square",name:"Limit"},
    {label:"lim₀",latex:"\\lim_{x \\to 0} \\square",name:"Limit → 0"},
    {label:"eˣ",latex:"e^{\\square}",name:"Exponential"},
    {label:"ln",latex:"\\ln(\\square)",name:"Natural Log"},
    {label:"log",latex:"\\log_{a}(\\square)",name:"Log base a"},
    {label:"sin",latex:"\\sin(\\square)",name:"Sine"},
    {label:"cos",latex:"\\cos(\\square)",name:"Cosine"},
    {label:"tan",latex:"\\tan(\\square)",name:"Tangent"},
    {label:"matrix",latex:"\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",name:"Matrix"},
    {label:"vec",latex:"\\vec{\\square}",name:"Vector"},
    {label:"hat",latex:"\\hat{\\square}",name:"Hat"},
    {label:"π",latex:"\\pi",name:"Pi"},
    {label:"∞",latex:"\\infty",name:"Infinity"},
  ];

  return (
    <div className={`relative ${className}`} ref={editorContainerRef}>
      {/* Custom Toolbar — stop mousedown so buttons don't submit form or scroll */}
      <div
        id={toolbarId}
        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
        className="border border-gray-300 border-b-0 rounded-t-lg bg-gray-50 px-2 py-1 flex flex-wrap items-center gap-0.5"
      >
        {/* Font family */}
        <select className="ql-font border border-gray-300 rounded px-1 py-0.5 text-xs bg-white mr-1" defaultValue="">
          <option value="">Sans-serif</option>
          <option value="arial">Arial</option>
          <option value="times-new-roman">Times New Roman</option>
          <option value="courier-new">Courier New</option>
          <option value="georgia">Georgia</option>
          <option value="verdana">Verdana</option>
        </select>

        {/* Font size */}
        <select className="ql-size border border-gray-300 rounded px-1 py-0.5 text-xs bg-white mr-1" defaultValue="14px">
          <option value="10px">10</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="36px">36</option>
          <option value="48px">48</option>
        </select>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Bold, Italic, Underline, Strike */}
        <button type="button" className="ql-bold w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm font-bold" title="Bold">B</button>
        <button type="button" className="ql-italic w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm italic" title="Italic">I</button>
        <button type="button" className="ql-underline w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm underline" title="Underline">U</button>
        <button type="button" className="ql-strike w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm line-through" title="Strikethrough">S</button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Text color & Background */}
        <select className="ql-color" title="Text Color" />
        <select className="ql-background" title="Highlight Color" />

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button type="button" className="ql-align w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="" title="Align Left">⬛</button>
        <button type="button" className="ql-align w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="center" title="Center">≡</button>
        <button type="button" className="ql-align w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="right" title="Align Right">☰</button>
        <button type="button" className="ql-align w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="justify" title="Justify">⊟</button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Subscript / Superscript */}
        <button type="button" className="ql-script w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="sub" title="Subscript">x₂</button>
        <button type="button" className="ql-script w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="super" title="Superscript">x²</button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Lists */}
        <button type="button" className="ql-list w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="ordered" title="Numbered List">1.</button>
        <button type="button" className="ql-list w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="bullet" title="Bullet List">•</button>
        <button type="button" className="ql-indent w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="-1" title="Decrease Indent">←</button>
        <button type="button" className="ql-indent w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" value="+1" title="Increase Indent">→</button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Blockquote, Code, Image */}
        <button type="button" className="ql-blockquote w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-sm" title="Blockquote">"</button>
        <button type="button" className="ql-code-block w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs font-mono" title="Code Block">{`</>`}</button>
        <button type="button" className="ql-image w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" title="Image"
          onClick={(e) => {
            e.preventDefault();
            const q = quillRef.current?.getEditor();
            insertIndexRef.current = q ? (q.getSelection()?.index ?? q.getLength() - 1) : 0;
            setShowImageModal(true);
          }}>🖼</button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {/* Table picker */}
        <div className="relative">
          <button type="button" onClick={() => setShowTablePicker(p => !p)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" title="Insert Table">
            ⊞
          </button>
          {showTablePicker && (
            <TablePicker onSelect={insertTable} onClose={() => setShowTablePicker(false)} />
          )}
        </div>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button type="button" className="ql-clean w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs ml-1" title="Remove Formatting">✕</button>
      </div>

      {/* Math Tools Strip — separate row below toolbar */}
      <div
        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
        className="border border-gray-300 border-t-0 bg-white px-3 py-2 flex items-center gap-3"
      >
        <span className="text-xs text-gray-400 font-medium mr-1">Math:</span>
        <button type="button"
          onClick={() => { setShowMathPanel(p => !p); setShowLatexBuilder(false); }}
          className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg border-2 transition-all ${
            showMathPanel
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-white text-emerald-700 border-emerald-500 hover:bg-emerald-50"
          }`}>
          <span className="text-lg leading-none">Σ</span>
          <span>Symbols</span>
        </button>
        <button type="button"
          onClick={() => { setShowLatexBuilder(p => !p); setShowMathPanel(false); }}
          className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg border-2 transition-all ${
            showLatexBuilder
              ? "bg-violet-600 text-white border-violet-700"
              : "bg-white text-violet-700 border-violet-500 hover:bg-violet-50"
          }`}>
          <span className="text-lg leading-none">∫</span>
          <span>LaTeX Builder</span>
        </button>
      </div>

      {/* Symbol Panel */}
      {showMathPanel && (
        <div className="bg-white border border-t-0 border-gray-300 overflow-hidden">
          <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200">
            {Object.keys(mathSymbols).map(key => (
              <button key={key} type="button" onClick={() => setActiveCategory(key)}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeCategory === key ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}>
                <span className="mr-1">{mathSymbols[key].icon}</span>{mathSymbols[key].label}
              </button>
            ))}
          </div>
          <div className="p-2 max-h-36 overflow-y-auto">
            <div className="grid grid-cols-12 sm:grid-cols-16 gap-1">
              {mathSymbols[activeCategory].symbols.map((item, i) => (
                <button key={i} type="button" onClick={() => insertSymbol(item.v)} title={item.n}
                  className="p-1.5 text-base font-serif border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-400 transition-all active:scale-95 text-center leading-none">
                  {item.d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LaTeX Builder Panel */}
      {showLatexBuilder && (
        <div className="bg-white border border-t-0 border-gray-300 overflow-hidden">
          <div className="p-3 bg-violet-50 border-b border-violet-200">
            <p className="text-xs font-semibold text-violet-700 mb-1">Click template → edit → Insert</p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {latexTemplates.map((t, i) => (
                <button key={i} type="button"
                  onClick={() => setLatexInput(t.latex)}
                  title={t.name}
                  className="px-2 py-1 bg-white border border-violet-300 rounded text-xs text-violet-700 hover:bg-violet-100 transition-all active:scale-95 font-mono">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div className="flex gap-2">
              <input type="text" value={latexInput}
                onChange={e => setLatexInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); insertCustomLatex(); } }}
                placeholder="\frac{a}{b}  or  \int_{0}^{\infty} e^{-x}\,dx"
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <button type="button" onClick={insertCustomLatex} disabled={!latexInput.trim()}
                className="px-4 py-1.5 bg-violet-600 text-white rounded text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                Insert ↑
              </button>
            </div>
            {latexInput.trim() && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">Preview:</span>
                <div className="text-lg overflow-x-auto">
                  {(() => { try { return <InlineMath math={latexInput} />; } catch { return <span className="text-red-500 text-xs">Invalid LaTeX</span>; } })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quill Editor */}
      <div className={`border border-gray-300 ${(!showMathPanel && !showLatexBuilder) ? "rounded-b-lg border-t-0" : "border-t-0"} overflow-hidden bg-white`}>
        <ReactQuill ref={quillRef} value={value}
          onChange={v => onChange(v)}
          modules={modules} formats={formats}
          placeholder={placeholder}
          className="word-style-editor"
          theme="snow" />
      </div>

      {/* Image Insert Modal */}
      {showImageModal && (
        <ImageInsertModal
          onInsert={(dataUrl) => { insertImage(dataUrl); setShowImageModal(false); }}
          onClose={() => setShowImageModal(false)}
          maxW={maxImageW}
          maxH={maxImageH}
        />
      )}

      <style>{`
        /* ── Math blot ── */
        .math-formula-blot { display:inline-block; vertical-align:middle; padding:1px 4px; margin:0 2px; background:#f0fdf4; border:1px solid #a7f3d0; border-radius:4px; cursor:default; user-select:none; }
        .math-formula-blot:hover { background:#d1fae5; border-color:#10b981; }

        /* ── Raw table blot wrapper ── */
        .raw-table-blot {
          display: block !important;
          width: fit-content;
          max-width: 100%;
          margin: 20px 0 12px 0;
          overflow: visible;
          position: relative;
        }

        /* ── Table itself ── */
        .raw-table-blot table {
          border-collapse: collapse !important;
          width: 100% !important;
          table-layout: fixed;
        }

        /* ── All cells — uniform color, editable ── */
        .raw-table-blot td,
        .raw-table-blot th {
          border: 1px solid #374151 !important;
          padding: 8px 10px !important;
          min-width: 60px !important;
          vertical-align: top !important;
          background: #ffffff !important;
          font-weight: normal !important;
          position: relative;
          box-sizing: border-box;
          cursor: text;
        }

        .raw-table-blot td:focus,
        .raw-table-blot th:focus {
          outline: 2px solid #10b981;
          outline-offset: -2px;
          background: #f0fdf4 !important;
        }

        /* ── Move handle — always visible inside the table ── */
        .table-move-handle {
          opacity: 0.75;
          transition: opacity 0.15s, background 0.15s;
        }
        .table-move-handle:hover {
          opacity: 1;
          background: #374151 !important;
        }

        /* ── Column resize handle ── */
        .col-resizer {
          position: absolute;
          right: -3px;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          z-index: 5;
          background: transparent;
        }
        .col-resizer:hover {
          background: rgba(16,185,129,0.5) !important;
        }

        /* ── Editor area ── */
        .word-style-editor .ql-container { border:none !important; font-size:14px !important; }
        .word-style-editor .ql-editor { min-height:200px; padding:16px; line-height:1.7; }
        .word-style-editor .ql-editor.ql-blank::before { font-style:italic; color:#9ca3af; left:16px; }
        .word-style-editor .ql-toolbar { display:none !important; }

        /* ── Quill color pickers ── */
        .ql-color .ql-picker-label svg, .ql-background .ql-picker-label svg { display:none; }
        .ql-color .ql-picker-label::after { content:"A"; font-weight:bold; font-size:14px; color:#374151; }
        .ql-background .ql-picker-label::after { content:"🖊"; font-size:12px; }

        /* ── Font whitelist CSS ── */
        .ql-font-arial { font-family: Arial, sans-serif; }
        .ql-font-times-new-roman { font-family: 'Times New Roman', Times, serif; }
        .ql-font-courier-new { font-family: 'Courier New', Courier, monospace; }
        .ql-font-georgia { font-family: Georgia, serif; }
        .ql-font-verdana { font-family: Verdana, Geneva, sans-serif; }

        /* ── Raw image blot ── */
        .raw-image-blot {
          display: inline-block !important;
          position: relative;
          margin: 8px 0;
          line-height: 0;
          border-radius: 4px;
          box-shadow: 0 0 0 1px #d1d5db;
        }
        .raw-image-blot img {
          display: block;
          max-width: 100%;
          border-radius: 4px;
        }
        .raw-image-blot:hover {
          box-shadow: 0 0 0 2px #10b981;
        }
      `}</style>
    </div>
  );
};

export default MathEditor;
