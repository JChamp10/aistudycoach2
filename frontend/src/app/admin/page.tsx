'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Shield, Zap, Flame, Crown, RotateCcw, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
      toast.success(res.data.message || 'Done!');
      await loadData();
      // Refresh the global user state
      const me = await userApi.profile();
      if (me.data) setUser({ ...user!, ...me.data });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-text-primary">Access Denied</h2>
            <p className="text-text-muted text-sm">This page is only available to the app owner.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary">Debug Panel</h1>
            <p className="text-sm text-text-muted font-bold">Owner-only controls for jchamp101</p>
          </div>
          <button onClick={loadData} className="ml-auto p-2 rounded-xl border-2 border-surface-border hover:border-brand-500 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Current Status */}
        <div className="card border-2 border-surface-border !rounded-2xl">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Your Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-muted rounded-xl p-3 text-center">
              <div className="text-xs text-text-muted font-bold mb-1">Plan</div>
              <div className={`font-extrabold text-lg ${usage?.plan === 'legend' ? 'text-amber-400' : 'text-text-primary'}`}>
                {(usage?.plan || user?.plan || 'free').toUpperCase()}
              </div>
            </div>
            <div className="bg-surface-muted rounded-xl p-3 text-center">
              <div className="text-xs text-text-muted font-bold mb-1">AI Used</div>
              <div className="font-extrabold text-lg text-brand-500">{usage?.ai_calls_today ?? '?'}</div>
            </div>
            <div className="bg-surface-muted rounded-xl p-3 text-center">
              <div className="text-xs text-text-muted font-bold mb-1">XP</div>
              <div className="font-extrabold text-lg text-purple-400">{user?.xp?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-surface-muted rounded-xl p-3 text-center">
              <div className="text-xs text-text-muted font-bold mb-1">Streak</div>
              <div className="font-extrabold text-lg text-orange-400">{user?.streak || 0}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card border-2 border-surface-border !rounded-2xl">
          <h2 className="font-extrabold text-lg mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reset AI */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => doAction('reset-ai', userApi.adminResetAI)}
              disabled={actionLoading === 'reset-ai'}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-surface-border hover:border-brand-500 hover:bg-brand-50 transition-all text-left"
            >
              <RotateCcw className={`w-5 h-5 text-brand-500 ${actionLoading === 'reset-ai' ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold text-sm text-text-primary">Reset AI Usage</div>
                <div className="text-xs text-text-muted">Set calls back to 0</div>
              </div>
            </motion.button>

            {/* Set Legend */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => doAction('set-legend', () => userApi.adminSetPlan('legend'))}
              disabled={actionLoading === 'set-legend'}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
            >
              <Crown className={`w-5 h-5 text-amber-500 ${actionLoading === 'set-legend' ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold text-sm text-text-primary">Activate Legend</div>
                <div className="text-xs text-text-muted">Unlimited AI forever</div>
              </div>
            </motion.button>

            {/* Set Free */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => doAction('set-free', () => userApi.adminSetPlan('free'))}
              disabled={actionLoading === 'set-free'}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-surface-border hover:border-red-500 hover:bg-red-50 transition-all text-left"
            >
              <Shield className={`w-5 h-5 text-red-400 ${actionLoading === 'set-free' ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold text-sm text-text-primary">Downgrade to Free</div>
                <div className="text-xs text-text-muted">Test free user experience</div>
              </div>
            </motion.button>

            {/* Set Pro */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => doAction('set-pro', () => userApi.adminSetPlan('pro'))}
              disabled={actionLoading === 'set-pro'}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <Zap className={`w-5 h-5 text-blue-500 ${actionLoading === 'set-pro' ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold text-sm text-text-primary">Set Pro Plan</div>
                <div className="text-xs text-text-muted">Unlimited AI (Pro)</div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* XP & Streak Controls */}
        <div className="card border-2 border-surface-border !rounded-2xl">
          <h2 className="font-extrabold text-lg mb-4">🎮 Stats Controls</h2>
          <div className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-text-muted mb-1 block">Add XP</label>
                <input type="number" value={xpAmount} onChange={e => setXpAmount(parseInt(e.target.value) || 0)}
                  className="input w-full !h-10" />
              </div>
              <button onClick={() => doAction('add-xp', () => userApi.adminAddXP(xpAmount))}
                disabled={actionLoading === 'add-xp'}
                className="btn-primary !h-10 px-6 text-sm">
                {actionLoading === 'add-xp' ? '...' : '+XP'}
              </button>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-text-muted mb-1 block">Set Streak</label>
                <input type="number" value={streakVal} onChange={e => setStreakVal(parseInt(e.target.value) || 0)}
                  className="input w-full !h-10" />
              </div>
              <button onClick={() => doAction('set-streak', () => userApi.adminSetStreak(streakVal))}
                disabled={actionLoading === 'set-streak'}
                className="btn-primary !h-10 px-6 text-sm">
                {actionLoading === 'set-streak' ? '...' : 'Set'}
              </button>
            </div>
          </div>
        </div>

        {/* All Users Table */}
        {allUsers.length > 0 && (
          <div className="card border-2 border-surface-border !rounded-2xl">
            <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> All Users ({allUsers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-surface-border">
                    <th className="text-left py-2 px-2 text-text-muted font-bold text-xs">User</th>
                    <th className="text-right py-2 px-2 text-text-muted font-bold text-xs">XP</th>
                    <th className="text-right py-2 px-2 text-text-muted font-bold text-xs">Streak</th>
                    <th className="text-right py-2 px-2 text-text-muted font-bold text-xs">Plan</th>
                    <th className="text-right py-2 px-2 text-text-muted font-bold text-xs">AI Today</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} className={`border-b border-surface-border ${u.username === 'jchamp101' ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-2 px-2 font-bold text-text-primary">
                        {u.username}
                        {u.username === 'jchamp101' && <span className="ml-1 text-[10px] text-amber-400">👑</span>}
                      </td>
                      <td className="py-2 px-2 text-right text-brand-500 font-bold">{u.xp?.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-orange-400 font-bold">{u.streak || 0}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          u.plan === 'legend' ? 'bg-amber-500/20 text-amber-400' :
                          u.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-surface-muted text-text-muted'
                        }`}>{u.plan || 'free'}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-text-muted">{u.ai_calls_today || 0}</td>
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
