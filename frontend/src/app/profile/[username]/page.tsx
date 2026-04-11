'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { userApi, socialApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Crown, Flame, Zap, UserPlus, UserMinus, ShieldCheck, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="text-text-muted">The user you're looking for doesn't exist.</p>
      </div>
    </AppLayout>
  );

  const isMe = currentUser?.id === profile.id;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-20">
        <div className="card !p-0 overflow-hidden border-2 border-surface-border mb-6">
          {/* Header/Cover */}
          <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-500 relative" />
          
          {/* Profile Basic Info */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-surface shadow-xl flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-black text-brand-500 uppercase">{profile.username[0]}</div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-text-primary">{profile.username}</h1>
                  {profile.plan === 'legend' && <Crown className="w-5 h-5 text-amber-500 m-0" />}
                  {profile.role === 'admin' && <ShieldCheck className="w-5 h-5 text-red-500 m-0" />}
                </div>
                <div className="text-text-muted font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                  {profile.region || 'Global'} Student
                  <span className="w-1 h-1 rounded-full bg-surface-border" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>

              {!isMe && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center gap-2 ${
                    isFollowing 
                      ? 'bg-surface-border text-text-primary border-b-4 border-gray-300' 
                      : 'bg-duo-blue text-white border-b-4 border-blue-600 hover:brightness-110 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <><UserMinus className="w-5 h-5" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-5 h-5" /> Follow</>
                  )}
                </button>
              )}
            </div>

            {profile.bio && (
              <p className="text-text-secondary font-medium leading-relaxed mb-6 italic">
                "{profile.bio}"
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card bg-surface-muted border-none p-4 text-center">
                <div className="flex justify-center mb-1"><Target className="w-5 h-5 text-duo-orange" /></div>
                <div className="text-lg font-black text-text-primary leading-none mb-1">{profile.xp?.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total XP</div>
              </div>
              <div className="card bg-surface-muted border-none p-4 text-center">
                <div className="flex justify-center mb-1"><Flame className="w-5 h-5 text-orange-500" /></div>
                <div className="text-lg font-black text-text-primary leading-none mb-1">{profile.streak || 0}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Day Streak</div>
              </div>
              <div className="card bg-surface-muted border-none p-4 text-center">
                <div className="flex justify-center mb-1"><Trophy className="w-5 h-5 text-amber-500" /></div>
                <div className="text-lg font-black text-text-primary leading-none mb-1">{profile.level?.level || 1}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Level</div>
              </div>
              <div className="card bg-surface-muted border-none p-4 text-center">
                <div className="flex justify-center mb-1"><Zap className="w-5 h-5 text-purple-400" /></div>
                <div className="text-lg font-black text-text-primary leading-none mb-1">{profile.achievements?.length || 0}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Badges</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        {profile.achievements?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-text-primary px-2">Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {profile.achievements.map((ach: any) => (
                <div key={ach.id} className="card border-2 border-surface-border p-4 text-center group hover:border-brand-500 transition-colors">
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center text-3xl">
                    {ach.icon || '🏆'}
                  </div>
                  <div className="font-black text-sm text-text-primary leading-tight mb-1">{ach.name}</div>
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                    Unlocked {new Date(ach.earned_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
