'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { calendarApi } from '@/lib/api';
import api from '@/lib/api';
import { Calendar, Plus, Trash2, CalendarDays, BookOpen, AlertCircle, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncToken, setSyncToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // New Event State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('assignment');
  const [date, setDate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await calendarApi.getEvents();
      setEvents(res.data.events || []);
    } catch {
      toast.error('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !date) return toast.error('Title and Date are required.');
    setCreating(true);
    try {
      await calendarApi.createEvent({ title, description: desc, event_type: type, event_date: date });
      toast.success('Event scheduled.');
      setTitle('');
      setDesc('');
      setDate('');
      loadEvents();
    } catch {
      toast.error('Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await calendarApi.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event removed.');
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await calendarApi.getToken();
      setSyncToken(res.data.token);
    } catch {
      toast.error('Failed to generate sync link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const syncUrl = syncToken ? `${api.defaults.baseURL || 'http://localhost:4000/api'}/calendar/ical/${syncToken}` : '';

  const copyToClipboard = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-10 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-1 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-brand-500" /> Academic Calendar
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Track & Sync your upcoming Assignments and Tests.</p>
          </div>
          
          {/* Sync Block */}
          <div className="card !p-4 border-brand-500/30 bg-brand-500/5 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-brand-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-400">External Sync (iCal)</span>
            </div>
            {syncToken ? (
              <div className="flex items-center gap-2">
                <input readOnly value={syncUrl} className="input flex-1 !h-10 !text-xs !px-3 font-mono opacity-70" />
                <button onClick={copyToClipboard} className="btn-primary !p-0 w-10 h-10 flex items-center justify-center flex-shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button disabled={generatingLink} onClick={handleGenerateLink} className="btn-primary w-full text-[10px] h-10">
                {generatingLink ? 'Generating...' : 'Generate Sync Link'}
              </button>
            )}
            <p className="text-[9px] font-bold text-slate-500 mt-2 tracking-widest text-center uppercase">Paste this link into Google Calendar or Apple Calendar</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Form */}
          <div className="md:col-span-1 space-y-6">
            <div className="card !p-6">
               <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Plus className="w-4 h-4 text-brand-500" /> Schedule Event
               </h2>
               
               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Title</label>
                   <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. History Essay" className="input" />
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                   <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input uppercase" />
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setType('assignment')} className={clsx("py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", type === 'assignment' ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500")}>Assignment</button>
                     <button onClick={() => setType('test')} className={clsx("py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", type === 'test' ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500")}>Test/Exam</button>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes (Optional)</label>
                   <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input h-20 resize-none" placeholder="Chapters 4-6..." />
                 </div>
                 
                 <button onClick={handleCreate} disabled={creating || !title || !date} className="btn-primary w-full mt-4">
                   {creating ? 'Scheduling...' : 'Add to Schedule'}
                 </button>
               </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="md:col-span-2 space-y-4">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 pl-2">
               <CalendarDays className="w-4 h-4 text-brand-500" /> Upcoming Timeline
             </h2>

             {loading ? (
                <div className="card !p-12 text-center text-slate-400 text-sm font-bold animate-pulse">Loading schedule...</div>
             ) : events.length === 0 ? (
                <div className="card !p-12 text-center flex flex-col items-center justify-center border-dashed">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Schedule Clear</h3>
                  <p className="text-xs text-slate-500 font-bold">You have no upcoming assignments or tests.</p>
                </div>
             ) : (
                <div className="space-y-4">
                  {events.map(ev => {
                    const d = new Date(ev.event_date);
                    // Standardizing date output visually
                    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const isPassed = new Date(ev.event_date).getTime() < new Date().setHours(0,0,0,0);

                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={ev.id} className={clsx("card !p-0 overflow-hidden flex", isPassed && "opacity-50 grayscale")}>
                         <div className={clsx("w-20 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800", ev.event_type === 'test' ? 'bg-red-500/10 text-red-600' : 'bg-brand-500/10 text-brand-600')}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{d.toLocaleString('en-US', { month: 'short' })}</span>
                            <span className="text-2xl font-black">{d.getDate()}</span>
                         </div>
                         <div className="p-4 sm:p-5 flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    {ev.event_type === 'test' ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <BookOpen className="w-3.5 h-3.5 text-brand-500" />}
                                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: ev.event_type === 'test' ? 'var(--color-danger, #ef4444)' : 'var(--brand-500)' }}>
                                      {ev.event_type}
                                    </span>
                                 </div>
                                 <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{ev.title}</h3>
                                 {ev.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>}
                              </div>
                              <button onClick={() => handleDelete(ev.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex-shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                         </div>
                      </motion.div>
                    )
                  })}
                </div>
             )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
