'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Zap, Brain, Calendar, Calculator, Trophy,
  ArrowRight, CheckCircle2, Sparkles, ChevronRight, Star,
  Menu, X, MessageSquare, Flame, Target, Clock
} from 'lucide-react';

// ─── Animated Typewriter ─────────────────────────────────────────────────────
function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timeout: NodeJS.Timeout;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 50);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 25);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % texts.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx, texts]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse text-cyan-400">|</span>
    </span>
  );
}

// ─── Section Reveal ───────────────────────────────────────────────────────────
function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Demo Chat ────────────────────────────────────────────────────────────────
const DEMO_RESPONSES: Record<string, string> = {
  default: "I'll break this down step by step for you! First, let me identify the core concept... Based on my analysis, here's a clear explanation with examples so you actually understand it — not just memorize it. 🎯",
  math: "Let's solve this! Step 1: Identify the variables. Step 2: Apply the quadratic formula x = (-b ± √(b²-4ac))/2a. Step 3: Substitute your values... The answer is x = 3 or x = -1. Need me to graph this? 📊",
  history: "Great question! The key causes were: (1) Economic tensions post-WWI — the Great Depression devastated Germany's economy. (2) Political instability of the Weimar Republic. (3) Rise of nationalist sentiment... Want a timeline to memorize for your exam? 🗓️",
  bio: "Let's break down photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Think of it as the plant's way of cooking food using sunlight as the stove! The chlorophyll in leaves acts like a solar panel... Want a memory trick for this? 🌱",
};

function getResponse(q: string) {
  const lower = q.toLowerCase();
  if (lower.includes('math') || lower.includes('equation') || lower.includes('solve') || lower.includes('x=')) return DEMO_RESPONSES.math;
  if (lower.includes('history') || lower.includes('war') || lower.includes('ww') || lower.includes('cause')) return DEMO_RESPONSES.history;
  if (lower.includes('bio') || lower.includes('photo') || lower.includes('cell') || lower.includes('plant')) return DEMO_RESPONSES.bio;
  return DEMO_RESPONSES.default;
}

function DemoChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [typing, setTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim() || typing) return;
    const q = input.trim();
    setMessages(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: getResponse(q) }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl" style={{ background: '#0D1B35' }}>
      {/* Terminal bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/60" style={{ background: '#0A1428' }}>
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">StudyCafe AI Assistant</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Message thread */}
      <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400/50" />
            <p className="text-slate-500 text-sm font-bold">Ask me anything about your coursework</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {['Help me with photosynthesis', 'Solve x² - 2x - 3 = 0', 'Why did WW1 start?'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm font-medium leading-relaxed ${
              m.role === 'user'
                ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/20'
                : 'bg-slate-700/60 text-slate-200 border border-slate-600/40'
            }`}>
              {m.role === 'ai' && <Sparkles className="w-3 h-3 text-cyan-400 inline mr-1.5 mb-0.5" />}
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-slate-700/60 border border-slate-600/40 px-4 py-3 rounded-xl flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/50 transition-colors" />
        <button onClick={handleSend} disabled={!input.trim() || typing}
          className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center text-slate-900 hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: Brain, title: 'AI Homework Helper', desc: 'Ask any question. Get a clear, step-by-step explanation — not just an answer.' },
    { icon: BookOpen, title: 'Smart Flashcards', desc: 'Auto-generate decks from your notes. Space-repetition keeps the right cards front-of-mind.' },
    { icon: Zap, title: 'Practice Quizzes', desc: 'AI-powered quizzes that target your weak spots so you study what actually matters.' },
    { icon: Calendar, title: 'Academic Calendar', desc: 'Track tests and assignments in one place. Sync directly to Google or Apple Calendar.' },
    { icon: Calculator, title: 'Math Suite', desc: 'Graph any equation instantly with a live Desmos engine. Solve step-by-step beside it.' },
    { icon: Trophy, title: 'Global Leaderboard', desc: 'Compete with students worldwide. Climb ranks, earn XP, and keep your streak alive.' },
  ];

  const steps = [
    { n: '01', icon: MessageSquare, title: 'Ask or upload', desc: 'Type your question, paste your notes, or upload a PDF of your homework.' },
    { n: '02', icon: Sparkles, title: 'AI explains it', desc: 'Get a crystal-clear breakdown, flashcards, and a quiz — generated in seconds.' },
    { n: '03', icon: Target, title: 'Ace the test', desc: 'Daily study sessions, weak-link targeting, and streak tracking keep you sharp.' },
  ];

  const testimonials = [
    { name: 'Maya R.', school: 'Grade 11 · Vancouver', rating: 5, text: 'I went from a C+ to an A in Chemistry in 3 weeks. The AI explains things the way my brain actually works.' },
    { name: 'Jordan P.', school: 'Grade 12 · Toronto', rating: 5, text: 'The flashcard generator is insane. I dumped my notes in and had a full study deck in 30 seconds.' },
    { name: 'Aaliyah S.', school: 'Grade 10 · Atlanta', rating: 5, text: 'Finals were terrifying until I found this. The weak-link quiz mode is a total game changer.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#060E1C', color: '#E0EEFF', fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}>
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5"
        style={{ background: 'rgba(6, 14, 28, 0.85)', backdropFilter: 'blur(24px)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-slate-900" />
          </div>
          <span className="font-black text-white tracking-tight text-sm uppercase">StudyCafe</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#how" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest px-4 py-2">Sign In</Link>
          <Link href="/register" className="text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-900 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-400/20">
            Start Free
          </Link>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-400 hover:text-white transition-colors">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-40 w-3/4 max-w-xs border-l border-white/10 flex flex-col pt-20 px-8 gap-8"
            style={{ background: '#0A1428', backdropFilter: 'blur(24px)' }}>
            {['Features', 'Demo', 'How It Works', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
                {l}
              </a>
            ))}
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}
              className="mt-4 text-center font-black uppercase tracking-widest px-6 py-4 rounded-xl bg-cyan-400 text-slate-900 text-sm">
              Start Free
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: '#0EA5E9' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-10" style={{ background: '#38BDF8' }} />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-10" style={{ background: '#7DD3FC' }} />
        </div>

        {/* Social proof strip */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 mb-8"
          style={{ background: 'rgba(14,165,233,0.08)' }}>
          <div className="flex">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border-2 border-slate-900 bg-gradient-to-br ${['from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-green-400 to-emerald-500'][i]}`} style={{ marginLeft: i > 0 ? -8 : 0 }} />
            ))}
          </div>
          <span className="text-[11px] font-bold text-cyan-300">10,000+ students studying smarter</span>
          <Flame className="w-3.5 h-3.5 text-orange-400" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mb-6"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          <span className="text-white">Study smarter.</span><br />
          <span style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9, #7DD3FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <Typewriter texts={['Ace every test.', 'Actually understand it.', 'Finish faster.', 'Stress less.']} />
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium">
          Your AI study companion that explains homework, generates flashcards, and targets your weak spots — built specifically for high school students who want real results.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/register"
            className="flex items-center gap-2 px-8 py-4 rounded-xl text-slate-900 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-400/25"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }}>
            Start Studying Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#demo"
            className="flex items-center gap-2 px-8 py-4 rounded-xl text-slate-300 font-bold text-sm uppercase tracking-widest border border-white/10 hover:border-white/20 hover:text-white transition-all">
            See How It Works <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Product preview */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
          className="mt-20 w-full max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: '#0A1428', boxShadow: '0 40px 120px -30px rgba(14, 165, 233, 0.25)' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5" style={{ background: '#080F1E' }}>
              {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, opacity: 0.7 }} />)}
              <div className="flex-1 mx-4 h-6 rounded-lg flex items-center px-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-[10px] font-mono text-slate-500">studycafe.app/dashboard</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-0 divide-x divide-white/5" style={{ minHeight: 200 }}>
              {[{ label: 'Streak', value: '🔥 12 Days', sub: 'Personal Best' }, { label: 'XP Today', value: '840 XP', sub: 'Level 14' }, { label: 'Cards Due', value: '24 Cards', sub: 'Review Now' }].map(s => (
                <div key={s.label} className="p-6 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{s.label}</div>
                  <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-[10px] text-cyan-400 font-bold">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Problem / Solution ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <Section className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 px-4 py-2 rounded-full border border-cyan-400/20" style={{ background: 'rgba(14,165,233,0.08)' }}>
              The Transformation
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Sound familiar?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="rounded-2xl p-8 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
              <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" /> Without StudyCafe
              </div>
              <div className="space-y-4">
                {[
                  { icon: Clock, text: '3 hours studying the wrong chapters for an exam' },
                  { icon: Brain, text: 'Rereading the same paragraph and still not getting it' },
                  { icon: Zap, text: 'Making flashcards by hand at midnight the night before' },
                  { icon: Target, text: 'Blanking on stuff you definitely studied' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3 p-4 rounded-xl border border-red-500/10" style={{ background: 'rgba(239,68,68,0.03)' }}>
                    <Icon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-400">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* With */}
            <div className="rounded-2xl p-8 border border-cyan-400/20" style={{ background: 'rgba(14,165,233,0.05)' }}>
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" /> With StudyCafe
              </div>
              <div className="space-y-4">
                {[
                  { text: 'AI identifies exactly what you need to review' },
                  { text: 'Any concept explained clearly in seconds' },
                  { text: 'Flashcards generated from your notes instantly' },
                  { text: 'Spaced repetition targets your weak links' },
                ].map(({ text }) => (
                  <div key={text} className="flex items-start gap-3 p-4 rounded-xl border border-cyan-400/10" style={{ background: 'rgba(14,165,233,0.03)' }}>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 md:px-12" style={{ background: 'rgba(14,165,233,0.03)' }}>
        <Section className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 px-4 py-2 rounded-full border border-cyan-400/20" style={{ background: 'rgba(14,165,233,0.08)' }}>
              What's Inside
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Everything you need.<br /><span className="text-slate-400">Nothing you don't.</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <Section key={title} delay={i * 0.07}>
                <div className="group h-full rounded-2xl p-6 border border-white/5 transition-all duration-300 hover:border-cyan-400/30 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: 'rgba(13,27,53,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border border-cyan-400/20 group-hover:border-cyan-400/40 transition-colors"
                    style={{ background: 'rgba(14,165,233,0.1)' }}>
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-black text-white text-base mb-2 tracking-tight uppercase">{title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </section>

      {/* ── Demo ──────────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-24 px-6 md:px-12">
        <Section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 px-4 py-2 rounded-full border border-cyan-400/20" style={{ background: 'rgba(14,165,233,0.08)' }}>
              Live Demo
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-4">Try it right now.</h2>
            <p className="text-slate-400 font-medium mb-6 leading-relaxed">Don't take our word for it. Type any homework question below. Our AI will explain exactly what's going on — clearly, step by step.</p>
            <ul className="space-y-2 text-sm font-bold text-slate-500">
              {['Answer any subject — Math, Science, History, English', 'Step-by-step explanations, not copy-paste answers', 'Upload PDFs or images for full homework analysis'].map(l => (
                <li key={l} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />{l}</li>
              ))}
            </ul>
          </div>
          <DemoChat />
        </Section>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: 'rgba(14,165,233,0.03)' }}>
        <Section className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white tracking-tight">Students who get it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map(({ name, school, rating, text }, i) => (
              <Section key={name} delay={i * 0.1}>
                <div className="rounded-2xl p-6 border border-white/5 h-full flex flex-col"
                  style={{ background: 'rgba(13,27,53,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                  <div className="flex mb-4">
                    {[...Array(rating)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-slate-300 font-medium text-sm leading-relaxed flex-1 mb-4">&ldquo;{text}&rdquo;</p>
                  <div>
                    <div className="text-white font-black text-sm">{name}</div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{school}</div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6 md:px-12">
        <Section className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 px-4 py-2 rounded-full border border-cyan-400/20" style={{ background: 'rgba(14,165,233,0.08)' }}>
              3 Steps
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">It's stupidly simple.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ n, icon: Icon, title, desc }, i) => (
              <Section key={n} delay={i * 0.12}>
                <div className="relative text-center px-6 py-8 rounded-2xl border border-white/5" style={{ background: 'rgba(13,27,53,0.8)' }}>
                  <div className="text-[80px] font-black opacity-5 absolute top-0 right-4 leading-none select-none" style={{ color: '#38BDF8' }}>{n}</div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl border border-cyan-400/20 flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'rgba(14,165,233,0.1)' }}>
                      <Icon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h3 className="font-black text-white text-lg mb-2 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </Section>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 md:px-12" style={{ background: 'rgba(14,165,233,0.03)' }}>
        <Section className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white tracking-tight">Start free. Upgrade when you're ready.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl p-8 border border-white/5" style={{ background: 'rgba(13,27,53,0.8)' }}>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Free Forever</div>
              <div className="text-5xl font-black text-white mb-1">$0</div>
              <div className="text-slate-500 text-sm mb-8">No credit card needed.</div>
              <ul className="space-y-3 mb-8">
                {['10 AI questions per day', 'Unlimited flashcard decks', 'Practice quizzes', 'Academic Calendar', 'Global leaderboard'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-3.5 rounded-xl border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-colors">
                Get Started Free
              </Link>
            </div>
            {/* Legend */}
            <div className="rounded-2xl p-8 border border-cyan-400/30 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(13,27,53,0.95))' }}>
              <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-cyan-400 text-slate-900">
                Most Popular
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">Legend</div>
              <div className="text-5xl font-black text-white mb-1">Promo</div>
              <div className="text-slate-400 text-sm mb-8">Redeem an access code for lifetime Legend status.</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited AI questions', 'Everything in Free', 'Priority response speed', 'Legend badge on Leaderboard', 'Early access to new features'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-slate-900 transition-all hover:scale-105 shadow-lg shadow-cyan-400/20"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }}>
                Claim Your Access
              </Link>
            </div>
          </div>
        </Section>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[100px] opacity-25" style={{ background: '#0EA5E9' }} />
        </div>
        <Section className="relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
            Your next exam<br /><span style={{ background: 'linear-gradient(135deg, #38BDF8, #7DD3FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>starts here.</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 font-medium max-w-xl mx-auto">Join thousands of students who stopped grinding harder and started studying smarter.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-slate-900 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-400/30 text-base"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }}>
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-slate-600 font-bold">No credit card. No commitment. Just results.</p>
        </Section>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6 md:px-12" style={{ background: '#040A14' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-400 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <span className="font-black text-white tracking-tight text-sm uppercase">StudyCafe</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {['Features', 'Pricing', 'Login', 'Register'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-slate-300 transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">© 2025 StudyCafe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
