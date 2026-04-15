'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Shield, Zap, Flame, Crown, RotateCcw, Users, RefreshCw, Terminal, Activity, Database, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function AdminPage() {
  const { user, setUser } = useAuthStore();
  const [usage, setUsage] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [xpAmount, setXpAmount] = useState(100);
  const [streakVal, setStreakVal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const isAdmin = user?.username === 'jchamp101';

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, users] = await Promise.all([
        userApi.usage(),
        userApi.adminGetUsers().catch(() => ({ data: { users: [] } })),
      ]);
      setUsage(u.data);
      setAllUsers(users.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const doAction = async (name: string, fn: () => Promise<any>) => {
    setActionLoading(name);
    try {
      const res = await fn();
      toast.success(res.data.message || 'Execution Successful');
      await loadData();
      const me = await userApi.profile();
      if (me.data) setUser({ ...user!, ...me.data });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Execution Failure');
    } finally {
      setActionLoading('');
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Security Violation</h2>
            <p className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--text-muted)' }}>Administrative privileges required for this sector.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 pb-24 pt-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl">
                <Terminal className="w-7 h-7 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">System console</h1>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Administrative override controls for jchamp101</p>
              </div>
           </div>
           <button onClick={loadData} className="p-3 rounded-xl border transition-all shadow-sm" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-faint)' }} />
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Tier Status */}
           <div className="lg:col-span-2 card !p-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" /> Administrative Identity
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Access Tier', value: (usage?.plan || user?.plan || 'Free').toUpperCase(), color: usage?.plan === 'legend' ? 'text-brand-500' : 'text-slate-900 dark:text-white' },
                  { label: 'AI Utilization', value: usage?.ai_calls_today ?? '0', color: 'text-brand-500' },
                  { label: 'Knowledge XP', value: user?.xp?.toLocaleString() || 0, color: 'text-slate-900 dark:text-white' },
                  { label: 'Cycle Streak', value: user?.streak || 0, color: 'text-orange-500' },
                ].map(stat => (
                  <div key={stat.label} className="border rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border-primary)' }}>
                    <div className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>{stat.label}</div>
                    <div className={`text-lg font-black tabular-nums transition-colors ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
           </div>

           {/* Stats Tweaks */}
           <div className="card !p-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-500" /> Parameter Injection
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>XP Increment</div>
                  <div className="flex gap-2">
                    <input type="number" value={xpAmount} onChange={e => setXpAmount(parseInt(e.target.value) || 0)} className="input !h-11 flex-1 !text-sm font-mono" />
                    <button onClick={() => doAction('add-xp', () => userApi.adminAddXP(xpAmount))} disabled={actionLoading === 'add-xp'} className="btn-primary !px-5 !h-11 text-[10px] uppercase font-black tracking-widest">Inject</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Set Cycle Streak</div>
                  <div className="flex gap-2">
                    <input type="number" value={streakVal} onChange={e => setStreakVal(parseInt(e.target.value) || 0)} className="input !h-11 flex-1 !text-sm font-mono" />
                    <button onClick={() => doAction('set-streak', () => userApi.adminSetStreak(streakVal))} disabled={actionLoading === 'set-streak'} className="btn-primary !px-5 !h-11 text-[10px] uppercase font-black tracking-widest">Commit</button>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Global Overrides */}
        <div className="card !p-8">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8">System Overrides</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'reset-ai', icon: RotateCcw, label: 'Bypass AI Limit', desc: 'Clear daily usage counters.', fn: userApi.adminResetAI, theme: 'brand' },
                { id: 'set-legend', icon: Crown, label: 'Elevate to Elite', desc: 'Grant infinite systemic resource.', fn: () => userApi.adminSetPlan('legend'), theme: 'brand' },
                { id: 'set-pro', icon: Zap, label: 'Assign Professional', desc: 'Apply professional tier status.', fn: () => userApi.adminSetPlan('pro'), theme: 'slate' },
                { id: 'set-free', icon: Shield, label: 'Revert to Basic', desc: 'Reset to standard permissions.', fn: () => userApi.adminSetPlan('free'), theme: 'slate' },
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => doAction(action.id, action.fn)}
                  disabled={!!actionLoading}
                  className="p-6 rounded-2xl border transition-all flex flex-col gap-4 group"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}
                >
                  <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border", action.theme === 'brand' ? 'bg-brand-500/5 border-brand-500/20 text-brand-500' : '')}
                    style={action.theme !== 'brand' ? { backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' } : {}}>
                     <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>{action.label}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{action.desc}</div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  if (confirm('CRITICAL: Purge ALL LEADERBOARD data? This reset is final and affects all nodes.')) {
                    doAction('clear-leaderboard', userApi.adminClearLeaderboard);
                  }
                }}
                disabled={!!actionLoading}
                className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-left hover:border-red-500 transition-all flex flex-col gap-4 group lg:col-span-2"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-xl">
                   <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-tight text-red-600 mb-1">Global Database Purge</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execute complete reset of global learning metrics across all member protocols.</div>
                </div>
              </button>
           </div>
        </div>

        {/* Node Registry */}
        {allUsers.length > 0 && (
          <div className="card !p-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" /> Member Registry ({allUsers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left font-black uppercase tracking-widest py-4 px-2 text-slate-400">Node Identifier</th>
                    <th className="text-right font-black uppercase tracking-widest py-4 px-2 text-slate-400">Accumulated XP</th>
                    <th className="text-right font-black uppercase tracking-widest py-4 px-2 text-slate-400">Consistency</th>
                    <th className="text-right font-black uppercase tracking-widest py-4 px-2 text-slate-400">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-950">
                  {allUsers.map(u => (
                    <tr key={u.id} className={clsx("group transition-colors", u.username === 'jchamp101' ? "bg-brand-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-900")}>
                      <td className="py-4 px-2 font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {u.username}
                        {u.username === 'jchamp101' && <span className="ml-3 text-[8px] font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded uppercase tracking-widest">System Owner</span>}
                      </td>
                      <td className="py-4 px-2 text-right text-brand-500 font-black tabular-nums">{u.xp?.toLocaleString()}</td>
                      <td className="py-4 px-2 text-right text-orange-500 font-black tabular-nums">{u.streak || 0} Cycles</td>
                      <td className="py-4 px-2 text-right">
                        <span className={clsx(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          u.plan === 'legend' ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" :
                          u.plan === 'pro' ? "shadow-sm" :
                          "bg-transparent border"
                        )} style={u.plan !== 'legend' ? { backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-primary)' } : {}}>
                           {u.plan === 'legend' ? 'Elite' : u.plan === 'pro' ? 'Professional' : 'Basic'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
