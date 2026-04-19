import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Brain, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from './types';
import { flashcardApi } from '@/lib/api';

interface HardQuizProps {
  cards: Card[];
  onDone: () => void;
}

export function HardQuiz({ cards, onDone }: HardQuizProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options] = useState(() => cards.map(card => {
    const otherAnswers = Array.from(new Set(
      cards.filter(c => c.id !== card.id && c.answer !== card.answer).map(c => c.answer)
    ));
    const wrong = otherAnswers.sort(() => Math.random() - 0.5).slice(0, 3);
    return [...wrong, card.answer].sort(() => Math.random() - 0.5);
  }));

  const card = cards[idx];
  const handleAnswer = (opt: string) => {
    if (confirmed) return;
    setSelected(opt);
    setConfirmed(true);

    if (opt === card.answer) {
      setScore(s => s + 1);
      flashcardApi.reviewCard(card.id, 'easy').catch(() => {});
    } else {
      flashcardApi.reviewCard(card.id, 'hard').catch(() => {});
    }

    setTimeout(() => {
      setIdx(prevIdx => {
        if (prevIdx + 1 >= cards.length) {
          setFinished(true);
          return prevIdx;
        }
        setSelected(null);
        setConfirmed(false);
        return prevIdx + 1;
      });
    }, 1200);
  };

  if (finished) return (
    <div className="text-center space-y-8 py-10">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
          <Trophy className="w-10 h-10 text-brand-500" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Quiz Complete!</h3>
        <p className="mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>Here's how you did.</p>
      </div>
      <div className="card max-w-xs mx-auto">
        <div className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-faint)' }}>Final Accuracy</div>
        <div className="text-5xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{Math.round((score/cards.length)*100)}%</div>
        <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{score} of {cards.length} correct</div>
      </div>
      <button onClick={onDone} className="btn-primary !px-12">Back to Flashcards</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: 'var(--color-danger, #ef4444)' }}>
           <Brain className="w-4 h-4" />
           <span className="text-[11px] font-black uppercase tracking-widest">Practice Quiz</span>
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{idx + 1} / {cards.length}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((idx + 1) / cards.length) * 100}%`, backgroundColor: 'var(--color-danger, #ef4444)' }} />
      </div>
      <div className="card !p-12 text-center" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-70" style={{ color: 'var(--text-faint)' }}>Question</div>
        <p className="font-black text-2xl tracking-tight leading-relaxed" style={{ color: 'var(--text-primary)' }}>{card.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options[idx]?.map((opt) => {
          // Dynamic classes logic utilizing CSS variables where possible
          let style: React.CSSProperties = {
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            opacity: 1
          };
          let cls = `rounded-xl p-4 text-sm font-bold text-left transition-all hover:border-brand-500/40`;
          
          if (confirmed) {
            cls = `rounded-xl p-4 text-sm font-black text-left`;
            if (opt === card.answer) {
              style = {
                border: '2px solid var(--color-success, #22c55e)',
                backgroundColor: 'var(--color-success-alpha-light, rgba(34,197,94,0.05))',
                color: 'var(--color-success, #22c55e)'
              };
            } else if (opt === selected) {
              style = {
                border: '2px solid var(--color-danger, #ef4444)',
                backgroundColor: 'var(--color-danger-alpha-light, rgba(239,68,68,0.05))',
                color: 'var(--color-danger, #ef4444)',
                opacity: 0.6
              };
            } else {
              style = {
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-faint)',
                opacity: 0.3
              };
            }
          }
          return (
            <button key={opt} style={style} onClick={() => handleAnswer(opt)} disabled={confirmed} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>
      {confirmed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 pt-6">
          <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs" 
               style={{ color: selected === card.answer ? 'var(--color-success, #22c55e)' : 'var(--color-danger, #ef4444)' }}>
            {selected === card.answer ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {selected === card.answer ? 'Correct!' : `Answer: ${card.answer}`}
          </div>
        </motion.div>
      )}
    </div>
  );
}
