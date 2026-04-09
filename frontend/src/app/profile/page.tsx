'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { Zap, Flame, Trophy, BookOpen, Gift, Crown, Sparkles } from 'lucide-react';
import { getLevelFromXP } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    Promise.all([userApi.profile(), userApi.achievements()])
      .then(([p, a]) => { setProfile(p.data); setAchievements(a.data.achievements); })
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await userApi.redeemCode(promoCode.trim());
      toast.success(res.data.message || 'Code redeemed!');
      setRedeemed(true);
      setPromoCode('');
      // Refresh user data to reflect new plan
      if (user) {
        setUser({ ...user, plan: 'legend' });
      }
      // Also refresh profile
      const p = await userApi.profile();
      setProfile(p.data);
      // Confetti!
      import('canvas-confetti').then((confetti) => {
        confetti.default({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#f59e0b', '#d97706', '#fbbf24', '#b45309'] });
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div></AppLayout>;

  const level = profile ? getLevelFromXP(profile.xp) : null;
  const earnedAchievements = achievements.filter(a => a.earned);
  const pendingAchievements = achievements.filter(a => !a.earned);
  const isLegend = profile?.plan === 'legend' || user?.plan === 'legend';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold">My Profile</h1>

        {profile && (
          <div className="card">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold ${
                isLegend 
                  ? 'bg-gradient-to-br from-amber-400/30 to-amber-600/30 border-2 border-amber-400/60 text-amber-400' 
                  : 'bg-brand-500/20 border-2 border-brand-500/40 text-brand-400'
              }`}>
                {isLegend ? <Crown className="w-10 h-10" /> : profile.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold">{profile.username}</h2>
                  {isLegend && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold text-amber-900 bg-gradient-to-r from-amber-300 to-amber-500 shadow-sm">
                      <Sparkles className="w-3 h-3" /> LEGEND
                    </span>
                  )}
                </div>
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

        {/* ─── Promo Code Redemption ─────────────────────────────────────── */}
        <div className="card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" /> Redeem Promo Code
            </h2>

            {isLegend && !redeemed ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Crown className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-amber-400 text-sm">You're already a Legend!</div>
                  <div className="text-xs text-slate-400">You have infinite AI usage.</div>
                </div>
              </div>
            ) : redeemed ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <Sparkles className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-green-400 text-sm">🎉 Legend Activated!</div>
                  <div className="text-xs text-slate-400">You now have infinite AI usage across all features.</div>
                </div>
              </motion.div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                  placeholder="Enter your code..."
                  className="input flex-1 h-12 font-mono tracking-widest text-center uppercase"
                  maxLength={30}
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || !promoCode.trim()}
                  className="px-6 h-12 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  {redeeming ? 'Redeeming...' : 'Redeem'}
                </button>
              </div>
            )}
          </div>
        </div>

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
