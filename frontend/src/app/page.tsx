'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain, Zap, BookOpen, Trophy, BarChart2, ShoppingBag,
  ArrowRight, FlaskConical, Calendar
} from 'lucide-react';

const features = [
  { icon: Brain,        title: 'AI Homework Helper',    desc: 'Get step-by-step explanations that help you understand, not just copy.' },
  { icon: BookOpen,     title: 'Spaced Repetition',     desc: 'Flashcards with scientifically optimized review schedules.' },
  { icon: FlaskConical, title: 'Free Recall Mode',      desc: 'Write what you remember – the most powerful study technique.' },
  { icon: Zap,          title: 'Mixed Practice Quizzes',desc: 'Multi-topic quizzes that scale with your ability.' },
  { icon: Calendar,     title: 'Smart Study Planner',   desc: 'Input your exams, get an auto-generated schedule.' },
  { icon: Trophy,       title: 'Gamification',          desc: 'XP, streaks, achievements, and leaderboards.' },
  { icon: BarChart2,    title: 'Progress Dashboard',    desc: 'Visualize your mastery with heatmaps and subject scores.' },
  { icon: ShoppingBag,  title: 'Marketplace',           desc: 'Buy and sell flashcard packs and study guides.' },
];

const stats = [
  { value: '50K+', label: 'Active students' },
  { value: '2M+',  label: 'Flashcards created' },
  { value: '94%',  label: 'Improved grades' },
  { value: '4.9★', label: 'Student rating' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      <nav className="fixed top-0 w-full z-50 border-b border-surface-border/50 backdrop-blur-xl bg-surface/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">StudyCoach</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2">Log in</Link>
            <Link href="/register" className="btn-primary text-sm py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" /> Powered by AI + proven learning science
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Study smarter,{' '}
              <span className="glow-text">not harder.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              AI Study Coach combines artificial intelligence with the most effective study techniques so you actually learn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-base py-3 px-8 flex items-center gap-2 justify-center">
                Start learning free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-ghost text-base py-3 px-8">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 border-y border-surface-border">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Everything you need to ace your studies</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Built on the science of learning.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="card hover:border-brand-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-purple-500/10">
            <h2 className="text-4xl font-extrabold mb-4">Ready to transform how you study?</h2>
            <p className="text-slate-400 mb-8">Join 50,000+ students who improved their grades.</p>
            <Link href="/register" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
              Get started – it's free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border py-12 px-6 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white">StudyCoach</span>
            <span>© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
