import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from './types';

interface CardRowProps {
  card: Card;
  onSave: (id: string, q: string, a: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CardRow({ card, onSave, onDelete }: CardRowProps) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(card.question);
  const [a, setA] = useState(card.answer);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    await onSave(card.id, q, a);
    setEditing(false);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={clsx("card !p-5 space-y-3 transition-all", editing && "ring-2 ring-brand-500/20 border-brand-500/40")}>
      {editing ? (
        <>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Question</label>
              <input value={q} onChange={e => setQ(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Answer</label>
              <input value={a} onChange={e => setA(e.target.value)} className="input text-sm"
                onKeyDown={e => e.key === 'Enter' && save()} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Confirm'}
            </button>
            <button onClick={() => { setEditing(false); setQ(card.question); setA(card.answer); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-1">Knowledge Node</div>
            <div className="text-sm font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{card.question}</div>
            <div className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>{card.answer}</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 rounded-full overflow-hidden max-w-[120px]" style={{ backgroundColor: 'var(--bg-muted)' }}>
                <div className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(card.memory_strength || 0) * 100}%` }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Strength: {Math.round((card.memory_strength || 0) * 100)}%</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(true)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(card.id)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
