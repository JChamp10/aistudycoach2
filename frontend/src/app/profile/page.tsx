'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Zap, Flame, Trophy, BookOpen, Gift, Crown, Sparkles, Users, Upload, Trash2, ArrowRight, ShieldCheck, Mail, Database, Terminal, Settings, User } from 'lucide-react';
import { getLevelFromXP } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import api, { userApi, socialApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { clsx } from 'clsx';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([userApi.profile(), userApi.achievements(), socialApi.following()])
      .then(([p, a, s]) => { 
        setProfile(p.data); 
        setAchievements(a.data.achievements);
        setFollowing(s.data.following || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-brand-500 animate-spin" /></div></AppLayout>;

  const level = profile ? getLevelFromXP(profile.xp) : null;
  const earnedAchievements = achievements.filter(a => a.earned);
  const pendingAchievements = achievements.filter(a => !a.earned);
  const isLegend = profile?.plan === 'legend' || user?.plan === 'legend';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <header className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-black uppercase tracking-tight mb-1">Student Dossier</h1>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global ranking and academic progression status.</p>
            </div>
            <Link href="/settings" className="btn-ghost !px-6 !py-3 !text-[10px] !rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
               <Settings className="w-3.5 h-3.5" /> Configure System
            </Link>
        </header>

        {profile && (
          <div className="card !p-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500/50 via-brand-500 to-brand-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              <div className="relative">
                <Avatar
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  className={clsx(
                    "w-32 h-32 rounded-3xl border-4 transition-all duration-500 shadow-2xl",
                    isLegend ? "border-brand-500" : "border-slate-100 dark:border-slate-800"
                  )}
                  fallbackClassName="bg-slate-50 dark:bg-slate-900 text-slate-400"
                  textClassName="text-5xl font-black"
                />
                {isLegend && (
                  <div className="absolute -top-3 -right-3 bg-slate-950 rounded-xl p-2.5 shadow-xl border border-brand-500/50">
                    <Crown className="w-5 h-5 text-brand-500 fill-current" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left space-y-6">
                <div>
                   <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                     <h2 className="text-4xl font-black tracking-tight uppercase">{profile.username}</h2>
                     {isLegend && (
                       <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">Elite Tier</span>
                     )}
                   </div>
                   <div className="flex items-center justify-center md:justify-start gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {profile.email}</div>
                      <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-brand-500" /> Mastery Level {level?.level}</div>
                   </div>
                </div>

                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <Link href="/settings" className="btn-primary !px-6 !py-3 !text-[10px] !rounded-xl flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Edit Profile
                    </Link>
                 </div>
              </div>
            </div>

            {level && (
              <div className="mt-12 space-y-3">
                <div className="flex justify-between items-end">
                   <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Knowledge Accumulation</div>
                      <div className="text-xs font-black uppercase text-slate-900 dark:text-white">Current Tier {level.level}</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Vector</div>
                      <div className="text-xs font-black uppercase text-slate-900 dark:text-white">{profile.xp?.toLocaleString()} / {level.nextLevelXP?.toLocaleString()} XP</div>
                   </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-brand-500 shadow-[0_0_10px_rgba(220,123,30,0.3)] transition-all duration-1000" style={{ width: `${level.progress * 100}%` }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-10 border-t border-slate-100 dark:border-slate-900">
              {[
                { icon: Zap,      label: 'Total XP',    value: profile.xp?.toLocaleString(), color: 'text-brand-500' },
                { icon: Flame,    label: 'Streak',      value: `${profile.streak || 0} Days`, color: 'text-orange-500' },
                { icon: Database, label: 'Sessions',    value: profile.total_sessions,        color: 'text-slate-400' },
                { icon: ShieldCheck, label: 'Achievements', value: earnedAchievements.length,     color: 'text-brand-500' },
              ].map(s => (
                <div key={s.label} className="text-center md:text-left px-4">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{s.label}</div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <s.icon className={clsx("w-4 h-4", s.color)} />
                    <span className="text-xl font-black tabular-nums">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

           {/* Following */}
           <div className="card !p-8">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Users className="w-4 h-4 text-brand-500" /> Linked Members
             </h2>
             <div className="flex flex-wrap gap-3">
               {following.length === 0 ? (
                 <div className="text-center py-6 w-full opacity-60">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active links detected.</div>
                 </div>
               ) : (
                 following.map(u => (
                   <Link 
                     key={u.id} 
                     href={`/profile/${u.username}`}
                     className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-500/40 transition-all group"
                   >
                     <Avatar
                       username={u.username}
                       avatarUrl={u.avatar_url}
                       className="w-8 h-8 rounded-lg"
                       fallbackClassName="bg-slate-50 dark:bg-slate-900 text-slate-400"
                       textClassName="text-[10px] font-black"
                     />
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase transition-colors">{u.username}</span>
                   </Link>
                 ))
               )}
             </div>
           </div>
        </div>

        {/* Achievements Section */}
        <div className="card !p-8">
          <header className="flex items-center justify-between mb-8">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
               <Trophy className="w-4 h-4 text-brand-500" /> Validated Achievements
             </h2>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{earnedAchievements.length} Total</span>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {earnedAchievements.length === 0 && (
               <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-3xl opacity-60">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Achieve breakthroughs to unlock data entries.</div>
               </div>
            )}
            {earnedAchievements.map(a => (
              <div key={a.id} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 group hover:border-brand-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                   <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <Trophy className="w-5 h-5 text-brand-500" />
                   </div>
                   <div className="text-[9px] font-black text-brand-500 uppercase tracking-tighter">+{a.xp_reward} XP</div>
                </div>
                <div className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white mb-1.5">{a.title}</div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{a.description}</p>
              </div>
            ))}
          </div>
        </div>

        {pendingAchievements.length > 0 && (
          <section className="pt-10">
             <div className="text-center mb-8">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Potential Milestones</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                {pendingAchievements.slice(0, 8).map(a => (
                   <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{a.title}</div>
                      <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800 mx-auto" />
                   </div>
                ))}
             </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
