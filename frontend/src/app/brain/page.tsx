'use client';
import { useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Note, useAuthStore } from '@/lib/store';
import { NoteCard } from '@/components/layout/NoteCard';
import { ScanningOverlay } from '@/components/layout/ScanningOverlay';
import { StaggerContainer, StaggerItem } from '@/components/layout/StaggerContainer';
import { Brain, Plus, Search, Scan, Sparkles, GraduationCap, X, FileText, Filter, Send, ArrowLeft, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSFX } from '@/lib/useSFX';
import toast from 'react-hot-toast';

type ForgeView = 'options' | 'manual' | 'ai' | 'scan' | 'lesson';

export default function BrainPage() {
  const { notes, addNote } = useAuthStore();
  const { playSfx } = useSFX();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Note['source']>('all');
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [forgeView, setForgeView] = useState<ForgeView>('options');
  const [isScanning, setIsScanning] = useState(false);
  
  // Form States
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || n.source === filter;
    return matchesSearch && matchesFilter;
  });

  const forgeOptions = [
    { id: 'scan',    icon: Scan,         label: 'Scan Note',   color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'OCR from paper' },
    { id: 'ai',      icon: Sparkles,     label: 'AI Compose',  color: 'text-brand-400',  bg: 'bg-brand-500/10', desc: 'Gen from topic' },
    { id: 'lesson',  icon: GraduationCap, label: 'Lesson Plan', color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: 'Extract key info' },
    { id: 'scratch', icon: FileText,      label: 'New Blank',   color: 'text-blue-400',   bg: 'bg-blue-500/10', desc: 'Start from 0' },
  ];

  const handleForge = (id: string) => {
    playSfx('click');
    if (id === 'scratch') {
      setForgeView('manual');
    } else {
      setForgeView(id as ForgeView);
    }
  };

  const closeForge = () => {
    setIsForgeOpen(false);
    setTimeout(() => {
      setForgeView('options');
      setManualTitle('');
      setManualContent('');
      setAiTopic('');
    }, 300);
  };

  const startSynthesis = (type: Note['source'], title: string, contentPrefix: string) => {
    setIsForgeOpen(false);
    setIsScanning(true);
    setIsProcessing(true);
    
    // Simulate multi-stage synthesis
    setTimeout(() => {
      const finalContent = type === 'ai' 
        ? `Comprehensive summary of ${aiTopic}. This Phoenix-generated synthesis covers key components, historical context, and modern applications of the subject matter.`
        : contentPrefix;

      addNote({
        title: title || (type === 'ai' ? `AI: ${aiTopic}` : 'New Note'),
        content: finalContent,
        source: type
      });
      
      setIsScanning(false);
      setIsProcessing(false);
      playSfx('success');
      toast.success('Phoenix synthesized your note! 🔥');
      setForgeView('options');
    }, 3500);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 md:px-8 pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-lg shadow-brand-500/5">
                <Brain className="w-6 h-6 text-brand-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">The Study Brain</h1>
            </div>
            <p className="text-ink-muted text-sm">Capture, synthesize, and transmute your knowledge.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search your brain..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input !pl-10 !py-2 text-sm w-full md:w-64"
              />
            </div>
            <button
              onClick={() => { setIsForgeOpen(true); playSfx('pop'); }}
              className="btn-primary gap-2 px-4 py-2 !rounded-xl text-sm font-bold shadow-lg shadow-brand-500/10"
            >
              <Plus className="w-4 h-4" />
              Forge
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-faint bg-surface-muted/50 rounded-lg border border-surface-border/50 mr-2">
            <Filter className="w-3 h-3" />
            Filter
          </div>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === 'all' ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/15' : 'bg-surface-card border-surface-border text-ink-muted hover:border-brand-500/30'}`}
          >
            All Notes
          </button>
          {forgeOptions.map((opt) => (
            <button 
              key={opt.id}
              onClick={() => setFilter(opt.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${filter === opt.id ? 'bg-surface-elevated border-brand-500/50 text-ink shadow-sm' : 'bg-surface-card border-surface-border text-ink-muted hover:border-brand-500/30'}`}
            >
              <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Forge Modal / Drawer Overlay */}
        <AnimatePresence>
          {isForgeOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeForge}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 100 }}
                className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[51] w-full max-w-lg p-4 md:p-6"
              >
                <div className="bg-surface-card border border-surface-border rounded-t-3xl md:rounded-3xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                  {/* Close Handle (Mobile) */}
                  <div className="md:hidden flex justify-center py-3">
                    <div className="w-12 h-1.5 bg-surface-border rounded-full" />
                  </div>
                  
                  <div className="p-6 md:p-8">
                    <div className="absolute top-4 right-4 hidden md:block">
                      <button onClick={closeForge} className="text-ink-faint hover:text-ink"><X className="w-5 h-5" /></button>
                    </div>

                    <AnimatePresence mode="wait">
                      {forgeView === 'options' && (
                        <motion.div key="options" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                          <h2 className="text-2xl font-bold text-ink mb-2">Phoenix Forge</h2>
                          <p className="text-ink-muted text-sm mb-8">Choose how to bring your notes to life.</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {forgeOptions.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => handleForge(opt.id)}
                                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface-muted/50 border border-surface-border/50 hover:border-brand-500/40 hover:bg-surface-muted transition-all group text-center"
                              >
                                <div className={`p-3 rounded-xl ${opt.bg} ${opt.color} group-hover:scale-110 transition-transform duration-300`}>
                                  <opt.icon className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-ink mb-1">{opt.label}</div>
                                  <div className="text-[10px] text-ink-faint font-medium">{opt.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {forgeView === 'manual' && (
                        <motion.div key="manual" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <button onClick={() => setForgeView('options')} className="text-xs font-bold text-brand-500 flex items-center gap-1 mb-4 hover:underline">
                            <ArrowLeft className="w-3 h-3" /> Back to options
                          </button>
                          <h2 className="text-2xl font-bold text-ink mb-6">New Blank Note</h2>
                          <div className="space-y-4">
                            <input 
                              type="text" placeholder="Note Title" 
                              value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                              className="input font-bold text-lg !py-3 bg-surface-muted/30" 
                            />
                            <textarea 
                              placeholder="Write your study notes here..." 
                              value={manualContent} onChange={e => setManualContent(e.target.value)}
                              className="input min-h-[200px] text-sm resize-none bg-surface-muted/30" 
                            />
                            <button 
                              onClick={() => {
                                if (!manualTitle) return toast.error('Add a title');
                                addNote({ title: manualTitle, content: manualContent, source: 'scratch' });
                                playSfx('pop');
                                toast.success('Note forged!');
                                closeForge();
                              }}
                              className="btn-primary w-full !py-3 flex items-center justify-center gap-2"
                            >
                              <Save className="w-5 h-5" /> Forge Now
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {forgeView === 'ai' && (
                        <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <button onClick={() => setForgeView('options')} className="text-xs font-bold text-brand-500 flex items-center gap-1 mb-4 hover:underline">
                            <ArrowLeft className="w-3 h-3" /> Back
                          </button>
                          <h2 className="text-2xl font-bold text-ink mb-2">AI Alchemist</h2>
                          <p className="text-ink-muted text-sm mb-6">Enter a topic and let the Phoenix synthesize deep-dive notes for you.</p>
                          <div className="space-y-4">
                            <div className="relative">
                              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                              <input 
                                type="text" placeholder="Topic: e.g. Quantum Entanglement" 
                                value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                                className="input !pl-12 !py-4 font-semibold bg-surface-muted/30" 
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (!aiTopic) return toast.error('Enter a topic');
                                startSynthesis('ai', `Analysis: ${aiTopic}`, '');
                              }}
                              className="btn-primary w-full !py-4 flex items-center justify-center gap-3 animate-phoenix"
                            >
                              <Plus className="w-5 h-5" /> Begin Synthesis
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {(forgeView === 'scan' || forgeView === 'lesson') && (
                        <motion.div key="scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                          <button onClick={() => setForgeView('options')} className="text-xs font-bold text-brand-500 flex items-center gap-1 mb-4 hover:underline">
                            <ArrowLeft className="w-3 h-3" /> Back
                          </button>
                          <h2 className="text-2xl font-bold text-ink mb-2">Upload Material</h2>
                          <p className="text-ink-muted text-sm mb-8">Upload a picture of your notes or a lesson plan PDF.</p>
                          
                          <div className="border-2 border-dashed border-surface-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-surface-muted/20 hover:bg-surface-muted/40 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Scan className="w-8 h-8 text-brand-500" />
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-ink">Click to upload file</div>
                              <div className="text-xs text-ink-faint">PNG, JPG or PDF up to 10MB</div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => startSynthesis(forgeView as any, 'Extracted Note', 'Content successfully extracted from visual media. The Phoenix has identified key formulas and definitions.')}
                            className="btn-primary w-full !py-4 mt-6 flex items-center justify-center gap-3"
                          >
                            <Plus className="w-5 h-5" /> Forge from File
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Fire Glow Effect behind modal */}
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-500/5 blur-[80px] rounded-full pointer-events-none" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map(note => (
              <StaggerItem key={note.id}>
                <NoteCard note={note} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed">
            <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-ink-faint" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">No brain data yet</h3>
            <p className="text-ink-muted text-sm max-w-sm">Use the Phoenix Forge to capture notes from your paper, lesson plans, or AI.</p>
          </div>
        )}

        {/* Scanning Animation */}
        <ScanningOverlay isVisible={isScanning} onComplete={() => {}} />
      </div>
    </AppLayout>
  );
}

