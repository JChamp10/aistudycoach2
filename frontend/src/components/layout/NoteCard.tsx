'use client';
import { Note, useAuthStore } from '@/lib/store';
import { FileText, Sparkles, Scan, GraduationCap, Flame, Trash2, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSFX } from '@/lib/useSFX';
import toast from 'react-hot-toast';

const sourceIcons = {
  scratch: FileText,
  scan: Scan,
  ai: Sparkles,
  lesson: GraduationCap,
};

const sourceColors = {
  scratch: 'text-blue-400',
  scan: 'text-purple-400',
  ai: 'text-brand-400',
  lesson: 'text-emerald-400',
};

export function NoteCard({ note }: { note: Note }) {
  const { deleteNote, transmuteNote } = useAuthStore();
  const { playSfx } = useSFX();
  const [isTransmuting, setIsTransmuting] = useState(false);
  const Icon = sourceIcons[note.source];

  const handleTransmute = async () => {
    setIsTransmuting(true);
    playSfx('success_major');
    toast.loading('Transmuting into Flashcards...', { id: `transmute-${note.id}` });
    
    try {
      await transmuteNote(note.id, note.title);
      toast.success('Note Transmuted! Check your Flashcards.', { id: `transmute-${note.id}` });
    } catch (err) {
      toast.error('Transmutation failed.', { id: `transmute-${note.id}` });
      setIsTransmuting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotate: -5 }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px -10px var(--surface-shadow)' }}
      className="card group relative overflow-hidden flex flex-col h-full bg-surface-card backdrop-blur-xl border-surface-border hover:border-brand-500/50 transition-all p-5"
    >
      {/* Transmuting Fire Glow */}
      {isTransmuting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-brand-500/10 pointer-events-none"
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-brand-600/20 to-transparent" />
        </motion.div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-xl bg-surface-muted/50 ${sourceColors[note.source]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); playSfx('pop'); deleteNote(note.id); }}
            className="p-2 rounded-lg hover:bg-red-500/10 text-ink-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2 text-ink line-clamp-1">{note.title}</h3>
      <p className="text-sm text-ink-light line-clamp-4 flex-1 mb-6 leading-relaxed">
        {note.content}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] font-mono text-ink-faint uppercase tracking-widest">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={handleTransmute}
          disabled={isTransmuting}
          className="btn-ghost !px-3 !py-1.5 text-[10px] font-bold gap-2 hover:bg-brand-500/10 hover:text-brand-400 group/btn !rounded-lg"
        >
          {isTransmuting ? (
            <Flame className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5 text-brand-500 group-hover/btn:rotate-180 transition-transform duration-500" />
              Transmute
            </>
          )}
        </button>
      </div>

      {/* Decorative Brand Accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-tl-full pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
    </motion.div>
  );
}
