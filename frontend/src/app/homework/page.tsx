'use client';
import { useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { homeworkApi } from '@/lib/api';
import { HelpCircle, Send, Upload, X, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
}

export default function HomeworkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setInput('');
    setLoading(true);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('question', input || 'Please explain and help me with this document');
        res = await homeworkApi.askPdf(formData);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      } else {
        res = await homeworkApi.ask({ question: input });
      }
      const answer = res.data.answer || res.data.explanation || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get answer');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex-shrink-0 pb-4 border-b border-surface-border mb-4">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-blue-400" />
            </div>
            Homework Helper
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Ask any question or upload a PDF for AI-powered help.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="text-6xl">🧠</div>
              <h2 className="text-xl font-bold">Ask me anything!</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">Type a question, paste a problem, or upload a PDF and I'll explain it step by step.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  'Explain the Pythagorean theorem',
                  'How does photosynthesis work?',
                  'What caused World War I?',
                  'Solve: 2x + 5 = 13',
                ].map(q => (
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

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader className="w-4 h-4 text-brand-400 animate-spin" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 pt-4 border-t border-surface-border space-y-2">
          {/* File preview */}
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
              className="w-10 h-10 rounded-xl border border-surface-border flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all flex-shrink-0"
              title="Upload PDF">
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={file ? 'Ask about this PDF...' : 'Ask a question...'}
              className="input flex-1"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || (!input.trim() && !file)}
              className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 flex items-center justify-center text-white disabled:opacity-50 transition-all flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
