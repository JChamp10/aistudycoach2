'use client';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Calculator, LineChart, Brain, Delete } from 'lucide-react';
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
      setDisplay(val);
      setExpression(val);
      setJustCalculated(false);
      return;
    }
    if (justCalculated) {
      setJustCalculated(false);
    }
    const newExpr = display === '0' && /[\d.(]/.test(val) ? val : display + val;
    setDisplay(newExpr);
    setExpression(newExpr);
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
    setJustCalculated(false);
  };

  const backspace = () => {
    if (display.length <= 1 || justCalculated) { setDisplay('0'); setExpression(''); return; }
    const next = display.slice(0, -1);
    setDisplay(next);
    setExpression(next);
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
      case 'fact': {
        let f = 1;
        for (let i = 2; i <= val; i++) f *= i;
        result = f;
        break;
      }
      case 'neg': result = -val; break;
      case 'exp': result = Math.exp(val); break;
      default: result = val;
    }
    const r = parseFloat(result.toPrecision(10)).toString();
    setHistory(h => [{ expr: `${fn}(${display})`, result: r }, ...h.slice(0, 19)]);
    setDisplay(r);
    setExpression(r);
    setJustCalculated(true);
  };

  const calculate = () => {
    try {
      let expr = expression
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString())
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      const r = parseFloat(result.toPrecision(10)).toString();
      setHistory(h => [{ expr: expression, result: r }, ...h.slice(0, 19)]);
      setDisplay(r);
      setExpression(r);
      setJustCalculated(true);
    } catch {
      setDisplay('Error');
      setJustCalculated(true);
    }
  };

  const btn = (label: string, action: () => void, className = '') => (
    <button onClick={action}
      className={`rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 hover:brightness-110 ${className}`}>
      {label}
    </button>
  );

  const numBtn = (label: string) => btn(label, () => append(label),
    'bg-surface-card border border-surface-border text-white hover:bg-surface-muted');
  const opBtn = (label: string, val?: string) => btn(label, () => append(val || label),
    'bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:bg-brand-500/30');
  const fnBtn = (label: string, fn: string) => btn(label, () => applyFn(fn),
    'bg-surface-muted border border-surface-border text-slate-300 hover:bg-surface-card text-xs');

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Display */}
      <div className="card border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-500 truncate flex-1">{expression || '0'}</div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
              className={`text-xs px-2 py-0.5 rounded-lg border font-medium transition-all ${angleMode === 'deg' ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-surface-border text-slate-500'}`}>
              {angleMode.toUpperCase()}
            </button>
            <button onClick={() => { setMemory(parseFloat(display)); toast.success('Saved to memory'); }}
              className="text-xs px-2 py-0.5 rounded-lg border border-surface-border text-slate-500 hover:text-white transition-all">
              M+
            </button>
            <button onClick={() => { setDisplay(memory.toString()); setExpression(memory.toString()); }}
              className="text-xs px-2 py-0.5 rounded-lg border border-surface-border text-slate-500 hover:text-white transition-all">
              MR
            </button>
          </div>
        </div>
        <div className="text-4xl font-bold text-right truncate">{display}</div>
      </div>

      {/* Function buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {fnBtn('sin', 'sin')} {fnBtn('cos', 'cos')} {fnBtn('tan', 'tan')} {fnBtn('π', 'π')}
        {fnBtn('sin⁻¹', 'asin')} {fnBtn('cos⁻¹', 'acos')} {fnBtn('tan⁻¹', 'atan')} {fnBtn('e', 'e')}
        {fnBtn('log₁₀', 'log')} {fnBtn('ln', 'ln')} {fnBtn('log₂', 'log2')} {fnBtn('eˣ', 'exp')}
        {fnBtn('√', 'sqrt')} {fnBtn('∛', 'cbrt')} {fnBtn('x²', 'sq')} {fnBtn('x³', 'cube')}
        {fnBtn('|x|', 'abs')} {fnBtn('x!', 'fact')} {fnBtn('1/x', 'inv')} {fnBtn('+/-', 'neg')}
      </div>

      {/* Main keypad */}
      <div className="grid grid-cols-4 gap-1.5">
        {btn('AC', clear, 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30')}
        {btn('⌫', backspace, 'bg-surface-muted border border-surface-border text-slate-300')}
        {opBtn('(', '(')}
        {opBtn(')', ')')}

        {numBtn('7')} {numBtn('8')} {numBtn('9')}
        {opBtn('÷', '/')}

        {numBtn('4')} {numBtn('5')} {numBtn('6')}
        {opBtn('×', '*')}

        {numBtn('1')} {numBtn('2')} {numBtn('3')}
        {opBtn('-')}

        {numBtn('0')} {numBtn('.')}
        {opBtn('^', '**')}
        {opBtn('+')}

        <button onClick={calculate}
          className="col-span-4 rounded-xl py-3 font-bold text-base bg-brand-500 hover:bg-brand-400 text-white transition-all active:scale-95">
          =
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card space-y-1 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">History</p>
            <button onClick={() => setHistory([])} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Clear</button>
          </div>
          {history.map((h, i) => (
            <button key={i} onClick={() => { setDisplay(h.result); setExpression(h.result); }}
              className="w-full text-right text-xs py-1 px-2 rounded-lg hover:bg-surface-muted transition-colors">
              <span className="text-slate-500">{h.expr} = </span>
              <span className="text-white font-semibold">{h.result}</span>
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

    const loadDesmos = () => {
      if ((window as any).Desmos) {
        initDesmos();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.onload = initDesmos;
      document.head.appendChild(script);
    };

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
        backgroundColor: '#0f1117',
      });
      equations.filter(e => e.trim()).forEach((eq, i) => {
        calculatorRef.current.setExpression({ id: `eq${i}`, latex: eq });
      });
      setLoaded(true);
    };

    loadDesmos();
    return () => { calculatorRef.current?.destroy(); };
  }, []);

  const updateEquation = (idx: number, val: string) => {
    const newEqs = [...equations];
    newEqs[idx] = val;
    if (idx === equations.length - 1 && val.trim()) newEqs.push('');
    setEquations(newEqs);
    if (calculatorRef.current) {
      calculatorRef.current.setExpression({ id: `eq${idx}`, latex: val });
    }
  };

  const removeEquation = (idx: number) => {
    if (equations.length <= 1) return;
    const newEqs = equations.filter((_, i) => i !== idx);
    setEquations(newEqs);
    if (calculatorRef.current) {
      calculatorRef.current.removeExpression({ id: `eq${idx}` });
    }
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
    if (calculatorRef.current) {
      calculatorRef.current.setExpression({ id: `eq${targetIdx}`, latex: eq });
    }
  };

  return (
    <div className="space-y-4">
      {/* Equation inputs */}
      <div className="card space-y-3">
        <h3 className="font-bold text-sm">Equations</h3>
        {equations.map((eq, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: ['#5558ff', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'][i % 6] }} />
            <input
              value={eq}
              onChange={e => updateEquation(i, e.target.value)}
              placeholder={`Equation ${i + 1} (e.g. y = x^2)`}
              className="input flex-1 text-sm font-mono"
            />
            {equations.length > 1 && (
              <button onClick={() => removeEquation(i)}
                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="card space-y-2">
        <h3 className="font-bold text-sm text-slate-400">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.label} onClick={() => loadPreset(p.eq)}
              className="px-3 py-1.5 rounded-xl border border-surface-border text-xs text-slate-400 hover:text-white hover:border-brand-500/40 transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="card !p-0 overflow-hidden border-brand-500/20" style={{ height: '480px' }}>
        {!loaded && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <p className="text-xs text-slate-600 text-center">
        Use ^ for powers, sqrt() for square root, sin/cos/tan for trig. Pan and zoom with mouse.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// Need to import toast

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
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-brand-400" />
            </div>
            Math Helper
          </h1>
          <p className="text-slate-400 mt-2">Scientific calculator and function graphing.</p>
        </div>

        <div className="flex gap-2 p-1 bg-surface-muted rounded-xl">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tab === t.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}>
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
