'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { userApi, socialApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Crown, Flame, Zap, UserPlus, UserMinus, ShieldCheck, Trophy, Target, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Avatar from '@/components/ui/Avatar';

import { clsx } from 'clsx';
import { getLevelFromXP } from '@/lib/utils';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    checkFollowStatus();
  }, [username]);

  const loadProfile = async () => {
    try {
      const res = await userApi.getPublicProfile(username as string);
      setProfile(res.data.user);
    } catch {
      toast.error('User not found');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const res = await socialApi.following();
      const isFollowing = res.data.following?.some((u: any) => u.username === username);
      setIsFollowing(isFollowing);
    } catch {}
  };

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialApi.unfollow(profile.id);
        setIsFollowing(false);
        toast.success(`Unfollowed ${username}`);
      } else {
        await socialApi.follow(profile.id);
        setIsFollowing(true);
        toast.success(`Following ${username}!`);
      }
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center py-24 space-y-6">
        <div className="text-6xl">🔍</div>
        <h1 className="text-3xl font-black">User Not Found</h1>
        <p className="text-slate-500 font-medium">The seeker you are looking for has not yet arrived.</p>
        <Link href="/" className="btn-primary inline-block">Return to Sanctuary</Link>
      </div>
    </AppLayout>
  );

  const isMe = currentUser?.id === profile.id;
  const isLegend = profile.plan === 'legend';
  const level = getLevelFromXP(profile.xp || 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-24 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "card !p-0 overflow-hidden relative group transition-all duration-500",
            isLegend && "shadow-glow border-brand-500/30"
          )}
        >
          {/* Cover Area */}
          <div className="h-48 bg-slate-900 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-purple-500/20 to-indigo-500/20" />
             <div className="absolute inset-0 modern-zen-bg opacity-30" />
             {isLegend && <div className="absolute inset-0 holo-card opacity-40" />}
          </div>
          
          <div className="px-8 pb-10 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
              <div className="relative">
                <div className={clsx(
                  "w-32 h-32 rounded-[2rem] bg-slate-800 border-4 border-slate-900 shadow-2xl overflow-hidden relative z-10",
                  isLegend && "holo-card"
                )}>
                  <Avatar
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    className="w-full h-full"
                    fallbackClassName="text-brand-500"
                    textClassName="text-5xl font-black"
                  />
                </div>
                {isLegend && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-brand-300 to-brand-600 rounded-full p-2 shadow-xl border-2 border-slate-900 z-20">
                    <Crown className="w-5 h-5 text-white fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black tracking-tight">{profile.username}</h1>
                  {profile.role === 'admin' && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-1">Admin</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {profile.region || 'World'}</div>
                  <div className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Lvl {level.level}</div>
                </div>
              </div>

              {!isMe && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={clsx(
                    "px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3",
                    isFollowing 
                      ? 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:bg-slate-700' 
                      : 'bg-brand-500 text-white shadow-glow hover:scale-105 active:scale-95'
                  )}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-4 h-4" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow Seeker</>
                  )}
                </button>
              )}
            </div>

            {profile.bio && (
              <div className="max-w-2xl mb-10">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Intent</div>
                <p className="text-lg text-slate-400 font-medium italic leading-relaxed">
                  "{profile.bio}"
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total XP', val: profile.xp?.toLocaleString(), icon: Target, color: 'text-brand-500' },
                { label: 'Day Streak', val: profile.streak || 0, icon: Flame, color: 'text-orange-500' },
                { label: 'Sanctuary Lvl', val: level.level, icon: Trophy, color: 'text-amber-500' },
                { label: 'Relics', val: profile.achievements?.length || 0, icon: Zap, color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="card !p-6 bg-slate-800/30 border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <stat.icon className={clsx("w-5 h-5", stat.color)} />
                  </div>
                  <div className="text-2xl font-black tabular-nums">{stat.val}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Achievements Section */}
        {profile.achievements?.length > 0 && (
          <div className="mt-16 space-y-8">
            <h2 className="text-2xl font-black px-2 flex items-center gap-3">
               Unlocked Relics <ShieldCheck className="w-6 h-6 text-brand-500" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profile.achievements.map((ach: any) => (
                <motion.div 
                  key={ach.id} 
                  whileHover={{ y: -5 }}
                  className="card group border-slate-700/50 hover:border-brand-500 transition-all p-6 text-center bg-slate-800/20"
                >
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-4xl bg-slate-900 rounded-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {ach.icon || '🏆'}
                  </div>
                  <div className="font-black text-sm uppercase tracking-wider mb-1 text-slate-200">{ach.name}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Found {new Date(ach.earned_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
