'use client';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Calculator, LineChart, Delete } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type Tab = 'calculator' | 'graphing';

// ─── Scientific Calculator ────────────────────────────────────────────────────
function ScientificCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [justCalculated, setJustCalculated] = useState(false);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [memory, setMemory] = useState(0);

  const toRad = (x: number) => angleMode === 'deg' ? x * Math.PI / 180 : x;

  const append = (val: string) => {
    if (justCalculated && /[\d.(]/.test(val)) {
      setDisplay(val); setExpression(val); setJustCalculated(false); return;
    }
    if (justCalculated) setJustCalculated(false);
    const newExpr = display === '0' && /[\d.(]/.test(val) ? val : display + val;
    setDisplay(newExpr);
    setExpression(newExpr);
  };

  const clear = () => { setDisplay('0'); setExpression(''); setJustCalculated(false); };

  const backspace = () => {
    if (display.length <= 1 || justCalculated) { setDisplay('0'); setExpression(''); return; }
    const next = display.slice(0, -1);
    setDisplay(next); setExpression(next);
  };

  const applyFn = (fn: string) => {
    const val = parseFloat(display);
    let result: number;
    switch (fn) {
      case 'sin': result = Math.sin(toRad(val)); break;
      case 'cos': result = Math.cos(toRad(val)); break;
      case 'tan': result = Math.tan(toRad(val)); break;
      case 'asin': result = angleMode === 'deg' ? Math.asin(val) * 180 / Math.PI : Math.asin(val); break;
      case 'acos': result = angleMode === 'deg' ? Math.acos(val) * 180 / Math.PI : Math.acos(val); break;
      case 'atan': result = angleMode === 'deg' ? Math.atan(val) * 180 / Math.PI : Math.atan(val); break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case 'log2': result = Math.log2(val); break;
      case 'sqrt': result = Math.sqrt(val); break;
      case 'cbrt': result = Math.cbrt(val); break;
      case 'sq': result = val * val; break;
      case 'cube': result = val * val * val; break;
      case 'inv': result = 1 / val; break;
      case 'abs': result = Math.abs(val); break;
      case 'fact': { let f = 1; for (let i = 2; i <= val; i++) f *= i; result = f; break; }
      case 'neg': result = -val; break;
      case 'exp': result = Math.exp(val); break;
      default: result = val;
    }
    const r = parseFloat(result.toPrecision(10)).toString();
    setHistory(h => [{ expr: `${fn}(${display})`, result: r }, ...h.slice(0, 19)]);
    setDisplay(r); setExpression(r); setJustCalculated(true);
  };

  const calculate = () => {
    try {
      const expr = expression
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString())
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      const r = parseFloat(result.toPrecision(10)).toString();
      setHistory(h => [{ expr: expression, result: r }, ...h.slice(0, 19)]);
      setDisplay(r); setExpression(r); setJustCalculated(true);
    } catch {
      setDisplay('Error'); setJustCalculated(true);
    }
  };

  const s = { num: 'rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 border border-surface-border hover:brightness-95', op: 'rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 border border-brand-200 text-brand-600 hover:brightness-95', fn: 'rounded-xl py-2.5 font-medium text-xs transition-all active:scale-95 border border-warm-200 hover:brightness-95' };

  const numStyle = { background: '#fffcf9', color: '#2d1f0e' };
  const opStyle = { background: 'rgba(255,107,26,0.08)', color: '#e85500' };
  const fnStyle = { background: '#f5ede3', color: '#5c4030' };

  const nb = (l: string) => <button onClick={() => append(l)} className={s.num} style={numStyle}>{l}</button>;
  const ob = (l: string, v?: string) => <button onClick={() => append(v || l)} className={s.op} style={opStyle}>{l}</button>;
  const fb = (l: string, fn: string) => <button onClick={() => applyFn(fn)} className={s.fn} style={fnStyle}>{l}</button>;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="rounded-2xl p-5 space-y-2" style={{ background: 'linear-gradient(135deg, #fffcf9, #fdf8f3)', border: '1.5px solid #e8ddd0', boxShadow: '0 2px 12px rgba(139,90,60,0.08)' }}>
        <div className="flex items-center justify-between">
          <div className="text-xs truncate flex-1" style={{ color: '#b8a090' }}>{expression || '0'}</div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
              className="text-xs px-2 py-0.5 rounded-lg border font-medium transition-all"
              style={{ background: 'rgba(255,107,26,0.1)', borderColor: 'rgba(255,107,26,0.3)', color: '#e85500' }}>
              {angleMode.toUpperCase()}
            </button>
            <button onClick={() => { setMemory(parseFloat(display)); toast.success('Saved to memory'); }}
              className="text-xs px-2 py-0.5 rounded-lg border font-medium transition-all"
              style={{ borderColor: '#e8ddd0', color: '#8b6f5a' }}>M+</button>
            <button onClick={() => { setDisplay(memory.toString()); setExpression(memory.toString()); }}
              className="text-xs px-2 py-0.5 rounded-lg border font-medium transition-all"
              style={{ borderColor: '#e8ddd0', color: '#8b6f5a' }}>MR</button>
          </div>
        </div>
        <div className="text-4xl font-bold text-right truncate" style={{ color: '#2d1f0e' }}>{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {fb('sin','sin')} {fb('cos','cos')} {fb('tan','tan')} {fb('π','π')}
        {fb('sin⁻¹','asin')} {fb('cos⁻¹','acos')} {fb('tan⁻¹','atan')} {fb('e','e')}
        {fb('log₁₀','log')} {fb('ln','ln')} {fb('log₂','log2')} {fb('eˣ','exp')}
        {fb('√','sqrt')} {fb('∛','cbrt')} {fb('x²','sq')} {fb('x³','cube')}
        {fb('|x|','abs')} {fb('x!','fact')} {fb('1/x','inv')} {fb('+/-','neg')}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={clear} className="rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 border"
          style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}>AC</button>
        <button onClick={backspace} className={s.fn} style={fnStyle}>⌫</button>
        {ob('(')} {ob(')')}
        {nb('7')} {nb('8')} {nb('9')} {ob('÷','/')}
        {nb('4')} {nb('5')} {nb('6')} {ob('×','*')}
        {nb('1')} {nb('2')} {nb('3')} {ob('-')}
        {nb('0')} {nb('.')} {ob('^','**')} {ob('+')}
        <button onClick={calculate} className="col-span-4 rounded-xl py-3 font-bold text-base transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff6b1a, #e85500)', color: 'white', boxShadow: '0 4px 14px rgba(255,107,26,0.35)' }}>
          =
        </button>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl p-4 space-y-1 max-h-40 overflow-y-auto" style={{ background: '#fffcf9', border: '1.5px solid #e8ddd0' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#b8a090' }}>History</p>
            <button onClick={() => setHistory([])} className="text-xs transition-colors" style={{ color: '#b8a090' }}>Clear</button>
          </div>
          {history.map((h, i) => (
            <button key={i} onClick={() => { setDisplay(h.result); setExpression(h.result); }}
              className="w-full text-right text-xs py-1 px-2 rounded-lg transition-colors hover:bg-warm-100">
              <span style={{ color: '#b8a090' }}>{h.expr} = </span>
              <span className="font-semibold" style={{ color: '#2d1f0e' }}>{h.result}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Desmos Graphing ──────────────────────────────────────────────────────────
function DesmosGraphing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);
  const [equations, setEquations] = useState(['y = x^2', 'y = sin(x)', '']);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initDesmos = () => {
      if (!containerRef.current) return;
      const Desmos = (window as any).Desmos;
      calculatorRef.current = Desmos.GraphingCalculator(containerRef.current, {
        keypad: false,
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsTopbar: true,
        border: false,
        backgroundColor: '#fffcf9',
        invertedColors: false,
        fontSize: 14,
      });
      equations.filter(e => e.trim()).forEach((eq, i) => {
        calculatorRef.current.setExpression({ id: `eq${i}`, latex: eq });
      });
      setLoaded(true);
    };

    const loadDesmos = () => {
      if ((window as any).Desmos) { initDesmos(); return; }
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.onload = initDesmos;
      document.head.appendChild(script);
    };

    loadDesmos();
    return () => { calculatorRef.current?.destroy(); };
  }, []);

  const updateEquation = (idx: number, val: string) => {
    const newEqs = [...equations];
    newEqs[idx] = val;
    if (idx === equations.length - 1 && val.trim()) newEqs.push('');
    setEquations(newEqs);
    if (calculatorRef.current) calculatorRef.current.setExpression({ id: `eq${idx}`, latex: val });
  };

  const removeEquation = (idx: number) => {
    if (equations.length <= 1) return;
    const newEqs = equations.filter((_, i) => i !== idx);
    setEquations(newEqs);
    if (calculatorRef.current) calculatorRef.current.removeExpression({ id: `eq${idx}` });
  };

  const presets = [
    { label: 'Quadratic', eq: 'y = x^2' },
    { label: 'Cubic', eq: 'y = x^3' },
    { label: 'Sine', eq: 'y = \\sin(x)' },
    { label: 'Cosine', eq: 'y = \\cos(x)' },
    { label: 'Tangent', eq: 'y = \\tan(x)' },
    { label: 'Natural Log', eq: 'y = \\ln(x)' },
    { label: 'Exponential', eq: 'y = e^x' },
    { label: 'Absolute', eq: 'y = |x|' },
    { label: 'Circle', eq: 'x^2 + y^2 = 25' },
    { label: 'Hyperbola', eq: 'x^2 - y^2 = 1' },
    { label: 'Line', eq: 'y = 2x + 1' },
    { label: 'Logistic', eq: 'y = \\frac{1}{1+e^{-x}}' },
  ];

  const loadPreset = (eq: string) => {
    const idx = equations.findIndex(e => !e.trim());
    const targetIdx = idx === -1 ? equations.length : idx;
    const newEqs = [...equations];
    if (idx === -1) newEqs.push(eq);
    else newEqs[idx] = eq;
    if (newEqs[newEqs.length - 1].trim()) newEqs.push('');
    setEquations(newEqs);
    if (calculatorRef.current) calculatorRef.current.setExpression({ id: `eq${targetIdx}`, latex: eq });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-3" style={{ background: '#fffcf9', border: '1.5px solid #e8ddd0' }}>
        <h3 className="font-bold text-sm" style={{ color: '#2d1f0e' }}>Equations</h3>
        {equations.map((eq, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: ['#ff6b1a', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2'][i % 6] }} />
            <input value={eq} onChange={e => updateEquation(i, e.target.value)}
              placeholder={`Equation ${i + 1} (e.g. y = x^2)`}
              className="input flex-1 text-sm font-mono" />
            {equations.length > 1 && (
              <button onClick={() => removeEquation(i)}
                className="transition-colors flex-shrink-0" style={{ color: '#b8a090' }}>
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 space-y-3" style={{ background: '#fffcf9', border: '1.5px solid #e8ddd0' }}>
        <h3 className="font-bold text-sm" style={{ color: '#8b6f5a' }}>Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.label} onClick={() => loadPreset(p.eq)}
              className="px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
              style={{ borderColor: '#e8ddd0', color: '#5c4030', background: '#f5ede3' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ height: '480px', border: '1.5px solid #e8ddd0', background: '#fffcf9' }}>
        {!loaded && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#ff6b1a', borderTopColor: 'transparent' }} />
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <p className="text-xs text-center" style={{ color: '#b8a090' }}>
        Use ^ for powers, sqrt() for square root, sin/cos/tan for trig. Pan and zoom with mouse.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MathPage() {
  const [tab, setTab] = useState<Tab>('calculator');

  const tabs = [
    { key: 'calculator', label: 'Calculator', icon: Calculator },
    { key: 'graphing', label: 'Graphing', icon: LineChart },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: '#2d1f0e' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,26,0.1)' }}>
              <Calculator className="w-6 h-6" style={{ color: '#ff6b1a' }} />
            </div>
            Math Helper
          </h1>
          <p className="mt-2" style={{ color: '#8b6f5a' }}>Scientific calculator and function graphing.</p>
        </div>

        <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#f5ede3' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={tab === t.key
                ? { background: 'linear-gradient(135deg, #ff6b1a, #e85500)', color: 'white' }
                : { color: '#8b6f5a', background: 'transparent' }}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {tab === 'calculator' && <ScientificCalculator />}
          {tab === 'graphing' && <DesmosGraphing />}
        </motion.div>
      </div>
    </AppLayout>
  );
}
