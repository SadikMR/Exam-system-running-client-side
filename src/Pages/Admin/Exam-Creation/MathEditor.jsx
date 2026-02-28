import React, { useState, useRef, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import katex from "katex";
import { InlineMath } from "react-katex";

// ── Custom Quill Embed Blot for rendered math ─────────────────────────
const Embed = Quill.import("blots/embed");

class MathBlot extends Embed {
  static create(latex) {
    const node = super.create();
    node.setAttribute("data-latex", latex);
    node.setAttribute("contenteditable", "false");
    node.className = "math-formula-blot";
    try {
      node.innerHTML = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      node.textContent = latex;
    }
    return node;
  }

  static value(node) {
    return node.getAttribute("data-latex");
  }
}

MathBlot.blotName = "mathformula";
MathBlot.tagName = "span";
MathBlot.className = "math-formula-blot";

// Only register once
if (!Quill.imports["formats/mathformula"]) {
  Quill.register(MathBlot);
}

// ── MathEditor Component ──────────────────────────────────────────────
const MathEditor = ({ value, onChange, placeholder, className = "" }) => {
  const quillRef = useRef(null);
  const [showMathPanel, setShowMathPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState("greek");
  const [showLatexBuilder, setShowLatexBuilder] = useState(false);
  const [latexInput, setLatexInput] = useState("");

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    quill.format("align", false);
    quill.format("direction", "ltr");
    const Delta = quill.constructor.import("delta");
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      const ops = [];
      delta.ops.forEach((op) => {
        if (op.insert && typeof op.insert === "string") {
          ops.push({ insert: op.insert, attributes: { ...op.attributes, align: false } });
        } else { ops.push(op); }
      });
      return new Delta(ops);
    });
    quill.on("text-change", () => {
      const range = quill.getSelection();
      if (range) {
        const fmt = quill.getFormat(range);
        if (fmt.align === "center" || fmt.align === "right") quill.format("align", false);
      }
    });
  }, []);

  // ── Symbol Library ────────────────────────────────────────────────
  const mathSymbols = {
    greek: {
      label: "Greek", icon: "α",
      symbols: [
        { d: "α", v: "α", n: "Alpha" }, { d: "β", v: "β", n: "Beta" }, { d: "γ", v: "γ", n: "Gamma" },
        { d: "δ", v: "δ", n: "Delta" }, { d: "ε", v: "ε", n: "Epsilon" }, { d: "ζ", v: "ζ", n: "Zeta" },
        { d: "η", v: "η", n: "Eta" }, { d: "θ", v: "θ", n: "Theta" }, { d: "ι", v: "ι", n: "Iota" },
        { d: "κ", v: "κ", n: "Kappa" }, { d: "λ", v: "λ", n: "Lambda" }, { d: "μ", v: "μ", n: "Mu" },
        { d: "ν", v: "ν", n: "Nu" }, { d: "ξ", v: "ξ", n: "Xi" }, { d: "π", v: "π", n: "Pi" },
        { d: "ρ", v: "ρ", n: "Rho" }, { d: "σ", v: "σ", n: "Sigma" }, { d: "τ", v: "τ", n: "Tau" },
        { d: "υ", v: "υ", n: "Upsilon" }, { d: "φ", v: "φ", n: "Phi" }, { d: "χ", v: "χ", n: "Chi" },
        { d: "ψ", v: "ψ", n: "Psi" }, { d: "ω", v: "ω", n: "Omega" },
        { d: "Γ", v: "Γ", n: "Gamma (U)" }, { d: "Δ", v: "Δ", n: "Delta (U)" }, { d: "Θ", v: "Θ", n: "Theta (U)" },
        { d: "Λ", v: "Λ", n: "Lambda (U)" }, { d: "Π", v: "Π", n: "Pi (U)" }, { d: "Σ", v: "Σ", n: "Sigma (U)" },
        { d: "Φ", v: "Φ", n: "Phi (U)" }, { d: "Ψ", v: "Ψ", n: "Psi (U)" }, { d: "Ω", v: "Ω", n: "Omega (U)" },
      ],
    },
    operators: {
      label: "Operators", icon: "±",
      symbols: [
        { d: "±", v: "±", n: "Plus-minus" }, { d: "∓", v: "∓", n: "Minus-plus" },
        { d: "×", v: "×", n: "Multiplication" }, { d: "÷", v: "÷", n: "Division" },
        { d: "·", v: "·", n: "Dot product" }, { d: "∘", v: "∘", n: "Composition" },
        { d: "⊕", v: "⊕", n: "Direct sum" }, { d: "⊗", v: "⊗", n: "Tensor product" },
        { d: "∞", v: "∞", n: "Infinity" }, { d: "∝", v: "∝", n: "Proportional" },
        { d: "∴", v: "∴", n: "Therefore" }, { d: "∵", v: "∵", n: "Because" },
      ],
    },
    relations: {
      label: "Relations", icon: "≤",
      symbols: [
        { d: "≠", v: "≠", n: "Not equal" }, { d: "≡", v: "≡", n: "Identical" },
        { d: "≈", v: "≈", n: "Approximately" }, { d: "≅", v: "≅", n: "Congruent" },
        { d: "∼", v: "∼", n: "Similar" }, { d: "≤", v: "≤", n: "Less or equal" },
        { d: "≥", v: "≥", n: "Greater or equal" }, { d: "≪", v: "≪", n: "Much less" },
        { d: "≫", v: "≫", n: "Much greater" }, { d: "∝", v: "∝", n: "Proportional" },
      ],
    },
    calculus: {
      label: "Calculus", icon: "∫",
      symbols: [
        { d: "∫", v: "∫", n: "Integral" }, { d: "∬", v: "∬", n: "Double integral" },
        { d: "∭", v: "∭", n: "Triple integral" }, { d: "∮", v: "∮", n: "Contour integral" },
        { d: "∂", v: "∂", n: "Partial derivative" }, { d: "∇", v: "∇", n: "Nabla" },
        { d: "∆", v: "∆", n: "Laplacian" }, { d: "∑", v: "∑", n: "Summation" },
        { d: "∏", v: "∏", n: "Product" },
      ],
    },
    sets: {
      label: "Sets & Logic", icon: "∈",
      symbols: [
        { d: "∈", v: "∈", n: "Element of" }, { d: "∉", v: "∉", n: "Not element of" },
        { d: "⊂", v: "⊂", n: "Subset" }, { d: "⊃", v: "⊃", n: "Superset" },
        { d: "∪", v: "∪", n: "Union" }, { d: "∩", v: "∩", n: "Intersection" },
        { d: "∅", v: "∅", n: "Empty set" }, { d: "ℕ", v: "ℕ", n: "Naturals" },
        { d: "ℤ", v: "ℤ", n: "Integers" }, { d: "ℝ", v: "ℝ", n: "Reals" },
        { d: "ℂ", v: "ℂ", n: "Complex" }, { d: "∀", v: "∀", n: "For all" },
        { d: "∃", v: "∃", n: "There exists" }, { d: "¬", v: "¬", n: "NOT" },
        { d: "∧", v: "∧", n: "AND" }, { d: "∨", v: "∨", n: "OR" },
      ],
    },
    geometry: {
      label: "Geometry", icon: "∠",
      symbols: [
        { d: "°", v: "°", n: "Degree" }, { d: "∠", v: "∠", n: "Angle" },
        { d: "⊥", v: "⊥", n: "Perpendicular" }, { d: "∥", v: "∥", n: "Parallel" },
        { d: "△", v: "△", n: "Triangle" }, { d: "→", v: "→", n: "Arrow right" },
        { d: "←", v: "←", n: "Arrow left" }, { d: "↔", v: "↔", n: "Bidirectional" },
        { d: "⇒", v: "⇒", n: "Implies" }, { d: "⇔", v: "⇔", n: "Iff" },
      ],
    },
  };

  // LaTeX templates — these will render as actual KaTeX, not raw text
  const latexTemplates = [
    // Structure / brackets
    { label: "a/b", latex: "\\frac{a}{b}", name: "Fraction" },
    { label: "√x", latex: "\\sqrt{\\square}", name: "Square Root" },
    { label: "ⁿ√x", latex: "\\sqrt[n]{\\square}", name: "Nth Root" },
    { label: "x²", latex: "x^{2}", name: "Power / Superscript" },
    { label: "xₙ", latex: "x_{n}", name: "Subscript" },
    { label: "x^n", latex: "x^{n}", name: "General Power" },
    { label: "|x|", latex: "\\left|\\square\\right|", name: "Absolute Value" },
    { label: "‖x‖", latex: "\\left\\|\\square\\right\\|", name: "Norm" },
    // Derivatives
    { label: "d/dx", latex: "\\frac{d}{dx}\\,\\square", name: "Derivative (d/dx)" },
    { label: "d²/dx²", latex: "\\frac{d^2}{dx^2}\\,\\square", name: "2nd Derivative" },
    { label: "∂/∂x", latex: "\\frac{\\partial}{\\partial x}\\,\\square", name: "Partial Derivative" },
    { label: "∂²/∂x²", latex: "\\frac{\\partial^2}{\\partial x^2}\\,\\square", name: "2nd Partial" },
    // Integrals
    { label: "∫dx", latex: "\\int \\square\\,dx", name: "Indefinite Integral" },
    { label: "∫_a^b dx", latex: "\\int_{a}^{b} \\square\\,dx", name: "Definite Integral (limits)" },
    { label: "∬dA", latex: "\\iint_{D} \\square\\,dA", name: "Double Integral" },
    { label: "∭dV", latex: "\\iiint_{V} \\square\\,dV", name: "Triple Integral" },
    { label: "∮dr", latex: "\\oint_{C} \\square\\,dr", name: "Line / Contour Integral" },
    // Sums & products
    { label: "∑", latex: "\\sum_{i=1}^{n} \\square", name: "Summation" },
    { label: "∏", latex: "\\prod_{i=1}^{n} \\square", name: "Product" },
    { label: "lim", latex: "\\lim_{x \\to \\infty} \\square", name: "Limit" },
    { label: "lim₀", latex: "\\lim_{x \\to 0} \\square", name: "Limit → 0" },
    // Functions
    { label: "eˣ", latex: "e^{\\square}", name: "Exponential" },
    { label: "ln", latex: "\\ln(\\square)", name: "Natural Log" },
    { label: "log", latex: "\\log_{a}(\\square)", name: "Logarithm base a" },
    { label: "sin", latex: "\\sin(\\square)", name: "Sine" },
    { label: "cos", latex: "\\cos(\\square)", name: "Cosine" },
    { label: "tan", latex: "\\tan(\\square)", name: "Tangent" },
    // Matrix / misc
    { label: "matrix", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", name: "2×2 Matrix" },
    { label: "x̄", latex: "\\bar{\\square}", name: "Bar / Mean" },
    { label: "vec", latex: "\\vec{\\square}", name: "Vector arrow" },
    { label: "hat", latex: "\\hat{\\square}", name: "Hat / Unit vector" },
    { label: "π", latex: "\\pi", name: "Pi constant" },
    { label: "∞", latex: "\\infty", name: "Infinity" },
    { label: "±", latex: "\\pm", name: "Plus-minus" },
    { label: "≈", latex: "\\approx", name: "Approximately" },
    { label: "≠", latex: "\\neq", name: "Not equal" },
  ];

  // Insert plain Unicode symbol into Quill
  const insertSymbol = (text) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 };
    quill.insertText(range.index, text);
    quill.setSelection(range.index + text.length);
  };

  // Insert a rendered KaTeX blot into Quill (NOT raw text)
  const insertMathBlot = (latex) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 };
    quill.insertEmbed(range.index, "mathformula", latex, "user");
    quill.insertText(range.index + 1, " "); // space after formula
    quill.setSelection(range.index + 2);
  };

  const insertCustomLatex = () => {
    if (latexInput.trim()) {
      insertMathBlot(latexInput.trim());
      setLatexInput("");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["image", "clean"],
    ],
  };

  const formats = ["header", "bold", "italic", "underline", "strike", "script", "list", "bullet", "indent", "image", "mathformula"];

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-t-lg p-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { setShowMathPanel(!showMathPanel); setShowLatexBuilder(false); }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${showMathPanel ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"}`}>
          {showMathPanel ? "🔽 Symbols" : "Σ Symbols"}
        </button>
        <button type="button" onClick={() => { setShowLatexBuilder(!showLatexBuilder); setShowMathPanel(false); }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${showLatexBuilder ? "bg-violet-600 text-white border-violet-700" : "bg-white text-violet-700 border-violet-300 hover:bg-violet-50"}`}>
          {showLatexBuilder ? "🔽 LaTeX" : "∫ LaTeX"}
        </button>
      </div>

      {/* Symbol Panel */}
      {showMathPanel && (
        <div className="mb-4 bg-white border-2 border-emerald-200 rounded-lg shadow overflow-hidden">
          <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200">
            {Object.keys(mathSymbols).map((key) => (
              <button key={key} type="button" onClick={() => setActiveCategory(key)}
                className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${activeCategory === key ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}>
                <span className="mr-1">{mathSymbols[key].icon}</span>{mathSymbols[key].label}
              </button>
            ))}
          </div>
          <div className="p-3 max-h-44 overflow-y-auto">
            <div className="grid grid-cols-10 sm:grid-cols-12 gap-1">
              {mathSymbols[activeCategory].symbols.map((item, i) => (
                <button key={i} type="button" onClick={() => insertSymbol(item.v)} title={item.n}
                  className="p-2 text-base font-serif border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-all active:scale-95 text-center leading-none">
                  {item.d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LaTeX Builder Panel */}
      {showLatexBuilder && (
        <div className="mb-4 bg-white border-2 border-violet-200 rounded-lg shadow overflow-hidden">
          {/* Templates */}
          <div className="p-3 bg-violet-50 border-b border-violet-200">
            <p className="text-xs font-semibold text-violet-700 mb-1">Click a template to load it below → edit → Insert</p>
            <p className="text-xs text-violet-500 mb-2">Replace <code className="bg-violet-100 px-1 rounded">\square</code>, <code className="bg-violet-100 px-1 rounded">a</code>, <code className="bg-violet-100 px-1 rounded">b</code> with your values in the box below</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {latexTemplates.map((t, i) => (
                <button key={i} type="button"
                  onClick={() => {
                    setLatexInput(t.latex);
                    // ensure builder panel is shown
                  }}
                  title={`Load: ${t.name}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-violet-300 rounded text-xs text-violet-700 hover:bg-violet-100 hover:border-violet-500 transition-all active:scale-95">
                  <span className="font-mono">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom LaTeX input */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Edit formula below, then click Insert ↓</p>
            <div className="flex gap-2">
              <input type="text" value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertCustomLatex(); } }}
                placeholder="e.g. \frac{a}{b}  or  x^{2n}  or  \int_0^\infty"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400" />
              <button type="button" onClick={insertCustomLatex} disabled={!latexInput.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                Insert
              </button>
            </div>
            {/* Live preview */}
            {latexInput.trim() && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                <span className="text-xs text-gray-500 shrink-0">Preview:</span>
                <div className="text-lg overflow-x-auto">
                  {(() => { try { return <InlineMath math={latexInput} />; } catch { return <span className="text-red-500 text-sm">Invalid LaTeX</span>; } })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quill Editor */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <ReactQuill ref={quillRef} value={value}
          onChange={(v) => { onChange(v); setTimeout(() => { const q = quillRef.current?.getEditor(); if (q) { const r = q.getSelection(); if (r) q.formatText(0, q.getLength(), "align", false); } }, 10); }}
          modules={modules} formats={formats} placeholder={placeholder}
          className="left-aligned-editor" theme="snow" />
      </div>

      <style>{`
        /* Math formula blot styling */
        .math-formula-blot {
          display: inline-block;
          vertical-align: middle;
          padding: 1px 4px;
          margin: 0 2px;
          background: #f0fdf4;
          border: 1px solid #a7f3d0;
          border-radius: 4px;
          cursor: default;
          user-select: none;
        }
        .math-formula-blot:hover { background: #d1fae5; border-color: #10b981; }
        .left-aligned-editor .ql-editor { text-align: left !important; direction: ltr !important; min-height: 120px !important; font-size: 16px !important; line-height: 1.6 !important; padding: 16px !important; }
        .left-aligned-editor .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background-color: #f8fafc !important; padding: 10px !important; display: flex !important; flex-wrap: wrap !important; gap: 6px !important; position: relative !important; overflow: visible !important; }
        .left-aligned-editor .ql-toolbar .ql-picker-options { position: absolute !important; top: 100% !important; left: 0 !important; z-index: 9999 !important; background: white !important; border: 2px solid #e5e7eb !important; border-radius: 8px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,.1) !important; max-height: 280px !important; overflow-y: auto !important; min-width: 140px !important; margin-top: 4px !important; }
        .left-aligned-editor .ql-toolbar .ql-picker-item { padding: 10px 14px !important; cursor: pointer !important; font-size: 13px !important; color: #374151 !important; }
        .left-aligned-editor .ql-toolbar .ql-picker-item:hover { background: #f0fdf4 !important; }
        .left-aligned-editor .ql-container { border: none !important; font-size: 16px !important; }
        .left-aligned-editor .ql-editor.ql-blank::before { font-style: italic !important; color: #9ca3af !important; left: 16px !important; }
        .left-aligned-editor .ql-snow .ql-tooltip { z-index: 10000 !important; }
      `}</style>
    </div>
  );
};

export default MathEditor;
