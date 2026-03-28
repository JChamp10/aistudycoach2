'use client';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Calculator, LineChart, Trash2, RotateCcw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

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
    if (isNaN(val)) return;
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

  const s = { 
    num: 'rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 border border-surface-border bg-surface-card hover:bg-surface-muted text-ink', 
    op: 'rounded-xl py-3 font-semibold text-sm transition-all active:scale-95 border border-brand-200 bg-brand-50/20 text-brand-500 hover:bg-brand-50/40', 
    fn: 'rounded-xl py-2.5 font-medium text-xs transition-all active:scale-95 border border-surface-border bg-surface-muted text-ink-light hover:text-ink hover:bg-surface-border' 
  };

  const nb = (l: string) => <button onClick={() => append(l)} className={s.num}>{l}</button>;
  const ob = (l: string, v?: string) => <button onClick={() => append(v || l)} className={s.op}>{l}</button>;
  const fb = (l: string, fn: string) => <button onClick={() => applyFn(fn)} className={s.fn}>{l}</button>;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Display Screen */}
      <div className="card !p-5 space-y-2 bg-gradient-to-br from-surface-card to-surface-muted">
        <div className="flex items-center justify-between">
          <div className="text-xs truncate flex-1 text-ink-faint font-mono">{expression || '0'}</div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
              className="text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all bg-brand-50/10 border-brand-200 text-brand-500 uppercase tracking-tighter">
              {angleMode}
            </button>
            <button onClick={() => { setMemory(parseFloat(display)); toast.success('Saved to memory'); }}
              className="text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all border-surface-border text-ink-muted hover:bg-surface-muted">M+</button>
            <button onClick={() => { setDisplay(memory.toString()); setExpression(memory.toString()); }}
              className="text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all border-surface-border text-ink-muted hover:bg-surface-muted">MR</button>
          </div>
        </div>
        <div className="text-4xl font-bold text-right truncate text-ink tracking-tight drop-shadow-sm">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 p-1 bg-surface-muted/30 rounded-2xl">
        {fb('sin','sin')} {fb('cos','cos')} {fb('tan','tan')} {fb('π','π')}
        {fb('sin⁻¹','asin')} {fb('cos⁻¹','acos')} {fb('tan⁻¹','atan')} {fb('e','e')}
        {fb('log₁₀','log')} {fb('ln','ln')} {fb('log₂','log2')} {fb('eˣ','exp')}
        {fb('√','sqrt')} {fb('∛','cbrt')} {fb('x²','sq')} {fb('x³','cube')}
        {fb('|x|','abs')} {fb('x!','fact')} {fb('1/x','inv')} {fb('+/-','neg')}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className="rounded-xl py-3 font-bold text-sm transition-all active:scale-95 border bg-red-50/10 border-red-500/20 text-red-500 hover:bg-red-50/20">AC</button>
        <button onClick={backspace} className={s.fn}>⌫</button>
        {ob('(')} {ob(')')}
        {nb('7')} {nb('8')} {nb('9')} {ob('÷','/')}
        {nb('4')} {nb('5')} {nb('6')} {ob('×','*')}
        {nb('1')} {nb('2')} {nb('3')} {ob('-')}
        {nb('0')} {nb('.')} {ob('^','**')} {ob('+')}
        <button onClick={calculate} className="col-span-4 btn-primary text-base !py-3">
          =
        </button>
      </div>

      {history.length > 0 && (
        <div className="card !p-4 space-y-1 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">History</p>
            <button onClick={() => setHistory([])} className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase">Clear</button>
          </div>
          {history.map((h, i) => (
            <button key={i} onClick={() => { setDisplay(h.result); setExpression(h.result); }}
              className="w-full text-right text-xs py-2 px-3 rounded-xl transition-all hover:bg-surface-muted group border border-transparent hover:border-surface-border mb-1">
              <span className="text-ink-muted group-hover:text-ink transition-colors font-mono">{h.expr} = </span>
              <span className="font-bold text-ink" >{h.result}</span>
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
  const darkMode = useAuthStore(state => state.darkMode);

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
        backgroundColor: darkMode ? '#0a0e1a' : '#ffffff',
        invertedColors: darkMode,
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
  }, [darkMode]); // Re-init on theme change to update colors

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
    { label: 'Sine', eq: 'y = \\sin(x)' },
    { label: 'Expon.', eq: 'y = e^x' },
    { label: 'Circle', eq: 'x^2 + y^2 = 25' },
    { label: 'Logistic', eq: 'y = \\frac{1}{1+e^{-x}}' },
  ];

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-widest text-ink-muted">Active Equations</h3>
        {equations.map((eq, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: ['#ff6b1a', '#dc2626', '#16a34a', '#d97706', '#a855f7', '#0891b2'][i % 6] }} />
            <input value={eq} onChange={e => updateEquation(i, e.target.value)}
              placeholder={`Equation ${i + 1}`}
              className="input flex-1 !py-2 !px-3 text-sm font-mono bg-surface-muted/50" />
            {equations.length > 1 && (
              <button onClick={() => removeEquation(i)}
                className="text-ink-faint hover:text-red-500 transition-colors flex-shrink-0 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-widest text-ink-faint">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.label} onClick={() => {
              const eq = p.eq;
              const idx = equations.findIndex(e => !e.trim());
              const targetIdx = idx === -1 ? equations.length : idx;
              const newEqs = [...equations];
              if (idx === -1) newEqs.push(eq); else newEqs[idx] = eq;
              if (newEqs[newEqs.length - 1].trim()) newEqs.push('');
              setEquations(newEqs);
              if (calculatorRef.current) calculatorRef.current.setExpression({ id: `eq${targetIdx}`, latex: eq });
            }}
              className="btn-ghost !px-3 !py-1.5 text-[10px] font-bold uppercase tracking-wider">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-inner" style={{ height: '480px' }}>
        {!loaded && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-brand-500" />
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
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
      <div className="max-w-3xl mx-auto space-y-8 py-4 px-4 md:px-0 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-brand-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Math Helper</h1>
            </div>
            <p className="text-ink-muted text-sm">Empower your logic with Phoenix-powered tools.</p>
          </div>
          
          <div className="flex gap-1 p-1 bg-surface-muted rounded-2xl border border-surface-border/50">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as Tab)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t.key 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-ink-light hover:text-ink hover:bg-surface-border'
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={tab} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'calculator' && <ScientificCalculator />}
            {tab === 'graphing' && <DesmosGraphing />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

