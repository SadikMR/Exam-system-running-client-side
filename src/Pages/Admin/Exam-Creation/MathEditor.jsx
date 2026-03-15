import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import katex from "katex";
import { InlineMath } from "react-katex";

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

// ── RawTableBlot — an opaque block embed that holds raw table HTML ────
const BlockEmbed = Quill.import("blots/block/embed");
class RawTableBlot extends BlockEmbed {
  static create(html) {
    const node = super.create();
    node.innerHTML = html;
    node.setAttribute("contenteditable", "false");
    node.className = "raw-table-blot";
    node.style.cssText = "display:inline-block;width:100%;resize:both;overflow:auto;min-width:120px;min-height:40px;";
    return node;
  }
  static value(node) { return node.innerHTML; }
}
RawTableBlot.blotName = "rawtable";
RawTableBlot.tagName = "div";
RawTableBlot.className = "raw-table-blot";
if (!Quill.imports["formats/rawtable"]) Quill.register(RawTableBlot);

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

// ── Main MathEditor ───────────────────────────────────────────────────
const MathEditor = ({ value, onChange, placeholder, className = "" }) => {
  const quillRef = useRef(null);
  const uid = useId();                          // unique per instance
  const toolbarId = `math-toolbar-${uid.replace(/:/g, "")}`;
  const [showMathPanel, setShowMathPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState("greek");
  const [showLatexBuilder, setShowLatexBuilder] = useState(false);
  const [latexInput, setLatexInput] = useState("");
  const [showTablePicker, setShowTablePicker] = useState(false);

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

    const cellStyle = [
      "border:1px solid #374151",
      "padding:8px 10px",
      "min-width:60px",
      "box-sizing:border-box",
      "vertical-align:top",
    ].join(";");

    const tableRows = Array.from({ length: rows }, () =>
      `<tr>${Array.from({ length: cols }, () =>
        `<td style="${cellStyle}">&nbsp;</td>`
      ).join("")}</tr>`
    ).join("");

    const tableHTML = `<table style="border-collapse:collapse;width:100%;">${tableRows}</table>`;

    const range = q.getSelection() || { index: q.getLength() - 1 };
    q.insertEmbed(range.index, "rawtable", tableHTML, "user");
    q.insertText(range.index + 1, "\n", "user");
    q.setSelection(range.index + 2);
    setShowTablePicker(false);
  }, []);

  const insertCustomLatex = () => {
    if (latexInput.trim()) { insertMathBlot(latexInput.trim()); setLatexInput(""); }
  };

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
    "mathformula","rawtable",
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
    <div className={`relative ${className}`}>
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
        <button type="button" className="ql-image w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-xs" title="Image">🖼</button>

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

      <style>{`
        /* ── Math blot ── */
        .math-formula-blot { display:inline-block; vertical-align:middle; padding:1px 4px; margin:0 2px; background:#f0fdf4; border:1px solid #a7f3d0; border-radius:4px; cursor:default; user-select:none; }
        .math-formula-blot:hover { background:#d1fae5; border-color:#10b981; }

        /* ── Raw table blot ── */
        .raw-table-blot { display:inline-block !important; width:100%; margin:12px 0; resize:both; overflow:auto; min-width:120px; min-height:40px; box-shadow:0 0 0 1px #d1d5db; border-radius:4px; }
        .raw-table-blot table { border-collapse:collapse !important; width:100% !important; }
        .raw-table-blot td { border:1px solid #374151 !important; padding:8px 10px !important; min-width:60px !important; vertical-align:top !important; }

        /* ── Editor area ── */
        .word-style-editor .ql-container { border:none !important; font-size:14px !important; }
        .word-style-editor .ql-editor { min-height:200px; padding:16px; line-height:1.7; }
        .word-style-editor .ql-editor.ql-blank::before { font-style:italic; color:#9ca3af; left:16px; }
        .word-style-editor .ql-toolbar { display:none !important; } /* hidden — replaced by custom */

        /* ── Table styling ── */
        .word-style-editor .ql-editor table { border-collapse:collapse !important; width:100% !important; margin:12px 0 !important; border:1px solid #374151 !important; }
        .word-style-editor .ql-editor td { border:1px solid #374151 !important; padding:8px 12px !important; min-width:80px !important; }
        .word-style-editor .ql-editor tr:first-child td { background:#e5e7eb !important; font-weight:600 !important; }

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
      `}</style>
    </div>
  );
};

export default MathEditor;
