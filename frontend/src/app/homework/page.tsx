'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { homeworkApi } from '@/lib/api';
import { HelpCircle, Send, Upload, X, FileText, Loader, Clock, ChevronLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
}

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  created_at: string;
}

export default function HomeworkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await homeworkApi.history();
      setHistory(r.data.history || []);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') return toast.error('Only PDF files are supported');
    if (f.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB');
    setFile(f);
    toast.success(`${f.name} attached!`);
  };

  const removeFile = () => {
    setFile(null);
    setPdfProgress('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendMessage = async () => {
    if (!input.trim() && !file) return;
    const userMsg: Message = {
      role: 'user',
      content: input || `Please help me with this PDF: ${file?.name}`,
      fileName: file?.name,
    };
    setMessages(prev => [...prev, userMsg]);
    const sentInput = input;
    setInput('');
    setLoading(true);

    try {
      let res;
      if (file) {
        setPdfProgress('Reading PDF...');
        await new Promise(r => setTimeout(r, 400));
        setPdfProgress('Extracting text...');
        await new Promise(r => setTimeout(r, 400));
        setPdfProgress('AI is thinking...');
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('question', sentInput || 'Please explain and help me understand this document');
        res = await homeworkApi.askPdf(formData);
        setFile(null);
        setPdfProgress('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        res = await homeworkApi.ask({ question: sentInput });
      }
      const answer = res.data.answer || res.data.explanation || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      loadHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get answer');
      setMessages(prev => prev.slice(0, -1));
      setPdfProgress('');
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setMessages([
      { role: 'user', content: item.question },
      { role: 'assistant', content: item.answer },
    ]);
    setHistoryOpen(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    setFile(null);
    setPdfProgress('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const suggestions = [
    'Explain the Pythagorean theorem',
    'How does photosynthesis work?',
    'What caused World War I?',
    'Solve: 2x + 5 = 13',
  ];

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex gap-0 h-[calc(100vh-4rem)] relative">

        {/* History panel */}
        <AnimatePresence>
          {historyOpen && (
            <>
              {/* Backdrop on mobile */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-20 md:hidden"
                onClick={() => setHistoryOpen(false)} />

              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-72 flex-shrink-0 flex flex-col border-r border-surface-border bg-surface-card z-30 absolute md:relative h-full rounded-l-2xl overflow-hidden">

                <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border">
                  <h2 className="font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-400" /> History
                    {history.length > 0 && (
                      <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </h2>
                  <button onClick={() => setHistoryOpen(false)}
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-muted">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {historyLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14" />)}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No history yet. Ask your first question!
                    </div>
                  ) : (
                    history.map(item => (
                      <button key={item.id} onClick={() => loadFromHistory(item)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-muted border border-transparent hover:border-surface-border transition-all group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate transition-colors">
                              {item.question.replace('[PDF] ', '').slice(0, 60)}
                              {item.question.length > 60 ? '...' : ''}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.question.startsWith('[PDF]') && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" /> PDF
                                </span>
                              )}
                              {item.subject && (
                                <span className="text-xs text-slate-600">{item.subject}</span>
                              )}
                              <span className="text-xs text-slate-600 ml-auto">{formatTime(item.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex-shrink-0 pb-4 border-b border-surface-border mb-4 flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                historyOpen
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30'
              }`}>
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>

            <div className="flex-1">
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                Homework Helper
              </h1>
            </div>

            {messages.length > 0 && (
              <button onClick={newChat}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30 text-sm transition-all">
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="text-6xl">🧠</div>
                <h2 className="text-xl font-bold">Ask me anything!</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Type a question, paste a problem, or upload a PDF and I'll explain it step by step.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {suggestions.map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="px-3 py-1.5 rounded-xl border border-surface-border text-sm text-slate-400 hover:text-white hover:border-brand-500/40 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-tr-sm'
                      : 'bg-surface-card border border-surface-border text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.fileName && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20 text-xs opacity-80">
                        <FileText className="w-3 h-3" /> {msg.fileName}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* PDF progress */}
            <AnimatePresence>
              {loading && pdfProgress && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin flex-shrink-0" />
                    <span className="text-sm text-blue-300">{pdfProgress}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Regular thinking indicator */}
            <AnimatePresence>
              {loading && !pdfProgress && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader className="w-4 h-4 text-brand-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 pt-4 border-t border-surface-border space-y-2">
            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-blue-300 truncate flex-1">{file.name}</span>
                  <span className="text-slate-500 text-xs">{(file.size / 1024).toFixed(0)}KB</span>
                  <button onClick={removeFile} className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                title="Upload PDF"
                className="w-10 h-10 rounded-xl border border-surface-border flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all flex-shrink-0">
                <Upload className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={file ? 'Ask about this PDF... (or leave blank)' : 'Ask a question...'}
                className="input flex-1"
                disabled={loading}
              />
              <button onClick={sendMessage}
                disabled={loading || (!input.trim() && !file)}
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 flex items-center justify-center text-white disabled:opacity-50 transition-all flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 text-center">Press Enter to send · Upload PDF for document help</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
