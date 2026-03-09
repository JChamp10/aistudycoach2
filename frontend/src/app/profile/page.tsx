'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { Zap, Flame, Trophy, BookOpen } from 'lucide-react';
import { getLevelFromXP } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.profile(), userApi.achievements()])
      .then(([p, a]) => { setProfile(p.data); setAchievements(a.data.achievements); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div></AppLayout>;

  const level = profile ? getLevelFromXP(profile.xp) : null;
  const earnedAchievements = achievements.filter(a => a.earned);
  const pendingAchievements = achievements.filter(a => !a.earned);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold">My Profile</h1>

        {profile && (
          <div className="card">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center text-3xl font-extrabold text-brand-400">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold">{profile.username}</h2>
                <p className="text-slate-400 text-sm">{profile.email}</p>
                {level && <div className="badge bg-brand-500/20 text-brand-400 border-brand-500/30 mt-2">Level {level.level}</div>}
              </div>
            </div>

            {level && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Level {level.level}</span>
                  <span>{profile.xp} / {level.nextLevelXP} XP</span>
                </div>
                <div className="xp-bar h-3"><div className="xp-bar-fill" style={{ width: `${level.progress * 100}%` }} /></div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { icon: Zap,      label: 'Total XP',    value: profile.xp?.toLocaleString(), color: 'text-brand-400' },
                { icon: Flame,    label: 'Streak',      value: `${profile.streak || 0} days`, color: 'text-amber-400' },
                { icon: BookOpen, label: 'Sessions',    value: profile.total_sessions,        color: 'text-purple-400' },
                { icon: Trophy,   label: 'Achievements',value: earnedAchievements.length,     color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-surface-muted rounded-xl p-3 text-center">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Achievements ({earnedAchievements.length})</h2>
          {earnedAchievements.length === 0 ? (
            <p className="text-slate-500 text-sm">Start studying to earn achievements!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earnedAchievements.map(a => (
                <div key={a.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <div className="text-xs font-semibold text-amber-400">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>
                  <div className="text-xs text-brand-400 mt-1">+{a.xp_reward} XP</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pendingAchievements.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-4 text-slate-400">Locked Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pendingAchievements.map(a => (
                <div key={a.id} className="p-3 rounded-xl bg-surface-muted border border-surface-border opacity-60">
                  <div className="text-2xl mb-1 grayscale">{a.icon}</div>
                  <div className="text-xs font-semibold text-slate-400">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>
                  <div className="text-xs text-slate-600 mt-1">+{a.xp_reward} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
