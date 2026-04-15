'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { userApi, socialApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Crown, Flame, Zap, UserPlus, UserMinus, ShieldCheck, Trophy, Target, MapPin, Search, ChevronLeft } from 'lucide-react';
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
      <div className="max-w-md mx-auto text-center py-24 space-y-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
          <Search className="w-10 h-10" style={{ color: 'var(--text-faint)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Profile Not Found</h1>
          <p className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--text-muted)' }}>The requested user does not exist in the database.</p>
        </div>
        <Link href="/" className="btn-primary inline-flex items-center gap-2 !px-8">
           <ChevronLeft className="w-4 h-4" /> Return Home
        </Link>
      </div>
    </AppLayout>
  );

  const isMe = currentUser?.id === profile.id;
  const isLegend = profile.plan === 'legend';
  const level = getLevelFromXP(profile.xp || 0);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-24 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "card !p-0 overflow-hidden relative group shadow-2xl",
            isLegend && "border-brand-500/40"
          )}
        >
          {/* Cover Area */}
          <div className="h-48 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
             <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 opacity-40" />
             {isLegend && <div className="absolute inset-0 holo-card opacity-30" />}
          </div>
          
          <div className="px-10 pb-12 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-8 -mt-16 mb-10">
              <div className="relative">
                <div className={clsx(
                  "w-32 h-32 rounded-3xl border-4 shadow-2xl overflow-hidden relative z-10",
                  isLegend && "holo-card"
                )} style={{ backgroundColor: 'var(--bg-muted)', borderColor: 'var(--bg-elevated)' }}>
                  <Avatar
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    className="w-full h-full"
                    fallbackClassName="bg-slate-50 dark:bg-slate-900"
                    textClassName="text-5xl font-black"
                  />
                </div>
                {isLegend && (
                  <div className="absolute -top-3 -right-3 bg-slate-950 rounded-xl p-2.5 shadow-xl border border-brand-500/50 z-20">
                    <Crown className="w-5 h-5 text-brand-500 fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black tracking-tighter uppercase" style={{ color: 'var(--text-primary)' }}>{profile.username}</h1>
                  {profile.role === 'admin' && (
                    <span className="bg-red-500/10 text-red-600 border border-red-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">System Admin</span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {profile.region || 'Global'}</div>
                  <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-brand-500" /> Member Tier {isLegend ? 'Elite' : 'Standard'}</div>
                </div>
              </div>

              {!isMe && (
                 <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={clsx(
                    "px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3",
                    isFollowing 
                      ? 'shadow-sm' 
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                  )}
                  style={isFollowing ? { backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-primary)' } : {}}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-4 h-4" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow Member</>
                  )}
                </button>
              )}
            </div>

            {profile.bio && (
              <div className="max-w-2xl mb-12">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--text-faint)' }}>Professional Bio</div>
                <p className="text-lg font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Cumulative XP', val: profile.xp?.toLocaleString(), icon: Target, color: 'text-brand-500' },
                { label: 'Active Streak', val: (profile.streak || 0) + ' Days', icon: Flame, color: 'text-orange-500' },
                { label: 'Evaluation Lvl', val: level.level, icon: Zap, color: 'text-amber-500' },
                { label: 'Achievements', val: profile.achievements?.length || 0, icon: ShieldCheck, color: 'text-brand-500' },
              ].map((stat, i) => (
                <div key={i} className="card !p-8 transition-all hover:border-brand-500/40"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex justify-between items-start mb-6">
                    <stat.icon className={clsx("w-5 h-5", stat.color)} />
                  </div>
                  <div className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: 'var(--text-primary)' }}>{stat.val}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-2" style={{ color: 'var(--text-faint)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Achievements Section */}
        {profile.achievements?.length > 0 && (
          <div className="mt-20 space-y-10">
            <div className="flex items-center gap-4 px-2">
               <h2 className="text-2xl font-black uppercase tracking-tight">Verified Achievements</h2>
               <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-primary)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {profile.achievements.map((ach: any) => (
                 <motion.div 
                  key={ach.id} 
                  whileHover={{ y: -5 }}
                  className="card group hover:border-brand-500/40 transition-all !p-8 text-center shadow-sm"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl border shadow-inner group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border-primary)' }}>
                    {/* Filter out emojis if they exist, fallback to Trophy icon */}
                    {ach.icon && ach.icon.length < 3 ? <span className="text-2xl opacity-50 grayscale">{ach.icon}</span> : <Trophy className="w-6 h-6 text-brand-500" />}
                  </div>
                  <div className="font-black text-xs uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{ach.name}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-faint)' }}>
                    Earned {new Date(ach.earned_at).toLocaleDateString()}
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
