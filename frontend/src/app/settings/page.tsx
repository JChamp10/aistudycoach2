'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Shield, 
  Bell, 
  Globe, 
  Terminal, 
  Crown, 
  Check, 
  Upload, 
  Trash2,
  Lock,
  ChevronRight,
  Monitor,
  Database
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { userApi } from '@/lib/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { clsx } from 'clsx';

export default function SettingsPage() {
  const { user, setUser, darkMode, toggleDarkMode } = useAuthStore();
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

  const [draftUsername, setDraftUsername] = useState(user?.username || '');
  const [draftEmail, setDraftEmail] = useState(user?.email || '');
  const [draftRegion, setDraftRegion] = useState(user?.region || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDraftUsername(user.username);
    setDraftEmail(user.email);
    setDraftRegion(user.region || '');
  }, [user]);

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file format. Select an image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File size exceeds the 3MB threshold.');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (user) setUser({ ...user, avatar_url: res.data.user.avatar_url });
      toast.success('System: Avatar Updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Uploader script failed.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarRemoving(true);
    try {
      await api.delete('/users/avatar');
      if (user) setUser({ ...user, avatar_url: undefined });
      toast.success('System: Avatar Removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Deletion protocol failed.');
    } finally {
      setAvatarRemoving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const res = await userApi.updateProfile({
        username: draftUsername,
        email: draftEmail,
        region: draftRegion,
      });
      setUser(res.data.user);
      toast.success('Profile builder saved successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) return;
    setRedeeming(true);
    try {
      await userApi.redeemCode(promoCode.trim());
      toast.success('Access Tier Upgraded Successfully');
      setRedeemed(true);
      setPromoCode('');
      if (user) setUser({ ...user, plan: 'legend' });
      
      // Flashy success effect
      import('canvas-confetti').then((confetti) => {
        confetti.default({ 
          particleCount: 150, 
          spread: 80, 
          origin: { y: 0.6 }, 
          colors: ['#dc7b1e', '#f4b940', '#ffffff'] 
        });
      });
    } catch (err: any) {
      toast.error('Invalid terminal command or expired token.');
    } finally {
      setRedeeming(false);
    }
  };

  const isLegend = user?.plan === 'legend';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-10">
        <header>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1 flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-500" /> System Configuration
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Adjust your operational environment and account parameters.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation/Sidebar inside Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card !p-4 border-l-4 border-brand-500">
               <nav className="space-y-1">
                  {[
                    { icon: User, label: 'Profile Settings', id: 'profile' },
                    { icon: Monitor, label: 'Display & UI', id: 'display' },
                    { icon: Database, label: 'Subscription', id: 'subscription' },
                  ].map(item => (
                    <button 
                      key={item.label} 
                      onClick={() => setActiveTab(item.id)}
                      className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                      activeTab === item.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-600 dark:hover:text-slate-200"
                    )}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
               </nav>
            </div>

            {isLegend && (
              <div className="card !p-6 bg-slate-900 dark:bg-white border-brand-500/30 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Crown className="w-12 h-12 text-brand-500" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-2">Membership Status</div>
                  <div className="text-sm font-black text-white dark:text-slate-900 uppercase">Elite Legend</div>
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <Check className="w-3 h-3 text-brand-500" /> Lifetime Unlimited
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Identity Card */}
            {activeTab === 'profile' && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <User className="w-4 h-4 text-brand-500" /> Profile Builder
                </div>
                <p className="text-sm text-slate-400 max-w-2xl">Build your study profile here. Update your display name, contact email, region, and avatar so your account feels complete.</p>
                <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                  <div className="space-y-6">
                    <div className="relative group">
                      <Avatar
                        username={user?.username || ''}
                        avatarUrl={user?.avatar_url}
                        className={clsx(
                          'w-24 h-24 rounded-2xl border-2 transition-all duration-500',
                          isLegend ? 'border-brand-500 shadow-[0_0_20px_rgba(220,123,30,0.2)]' : 'border-slate-200 dark:border-slate-800'
                        )}
                        fallbackClassName="bg-slate-50 dark:bg-slate-900 text-slate-400"
                        textClassName="text-3xl font-black"
                      />
                      <label className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center cursor-pointer shadow-xl border border-white/10 hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleAvatarUpload(e.target.files?.[0])} />
                      </label>
                    </div>

                    <button
                      onClick={handleRemoveAvatar}
                      disabled={avatarRemoving || !user?.avatar_url}
                      className="w-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Avatar
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                        <input
                          className="input h-12 !rounded-2xl text-sm font-bold"
                          value={draftUsername}
                          onChange={e => setDraftUsername(e.target.value)}
                          placeholder="Enter a display name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
                        <input
                          className="input h-12 !rounded-2xl text-sm font-bold"
                          value={draftEmail}
                          onChange={e => setDraftEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Region</label>
                      <input
                        className="input h-12 !rounded-2xl text-sm font-bold"
                        value={draftRegion}
                        onChange={e => setDraftRegion(e.target.value)}
                        placeholder="City, State / Province"
                      />
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile || !user}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white uppercase text-[11px] font-black tracking-widest shadow-lg hover:bg-brand-400 transition-all disabled:opacity-50"
                      >
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) return;
                          setDraftUsername(user.username);
                          setDraftEmail(user.email);
                          setDraftRegion(user.region || '');
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-500 uppercase text-[11px] font-black tracking-widest hover:bg-slate-100 transition-all"
                      >
                        Reset Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
            )}

            {/* Visual Interface */}
            {activeTab === 'display' && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-500" /> Visual Interface
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl mb-8">Choose between the new arcade light mode and the classic neon dark mode. Theme palettes are removed from this page.</p>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => darkMode && toggleDarkMode()}
                   className={clsx(
                     "p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all group",
                     !darkMode ? "border-brand-500 bg-brand-500/5 shadow-lg" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                   )}
                 >
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      !darkMode ? "bg-brand-500 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                    )}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <div className={clsx("text-xs font-black uppercase tracking-widest", !darkMode ? "text-brand-700" : "text-slate-500")}>Light Mode</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arcade Day</div>
                    </div>
                 </button>

                 <button 
                   onClick={() => !darkMode && toggleDarkMode()}
                   className={clsx(
                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all group",
                    darkMode ? "border-brand-500 bg-brand-500/5 shadow-lg" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                  )}
                 >
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      darkMode ? "bg-brand-500 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                    )}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className={clsx("text-xs font-black uppercase tracking-widest", darkMode ? "text-brand-700 dark:text-brand-500" : "text-slate-500")}>Dark Mode</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arcade Night</div>
                    </div>
                 </button>
               </div>
            </motion.section>
            )}

            {/* System Access Card */}
            {activeTab === 'subscription' && (
             <>
              {!isLegend ? (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-8 relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                
                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brand-500" /> Operational Protocol
                </h2>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center border border-brand-500/20 shadow-xl">
                      <Shield className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Activate Elite Tier</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Input administrative access token.</p>
                    </div>
                  </div>

                  {redeemed ? (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-green-600">Access Granted. System Reloading...</span>
                     </motion.div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="relative flex-1 group">
                        <input
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                          placeholder="CODE-XXXX-XXXX"
                          className="input h-14 !pl-10 !rounded-xl font-mono tracking-[0.2em] text-sm uppercase shadow-inner border-slate-200 dark:border-slate-800 focus:border-brand-500 transition-all"
                          maxLength={30}
                        />
                        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        onClick={handleRedeem}
                        disabled={redeeming || !promoCode.trim()}
                        className="px-8 h-14 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 group"
                      >
                        {redeeming ? (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white dark:border-t-slate-900 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-2">Execute <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.section>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-8 bg-brand-500/5 border-brand-500/30 text-center space-y-4">
                  <Crown className="w-12 h-12 text-brand-500 mx-auto" />
                  <h3 className="text-xl font-black uppercase tracking-tight text-brand-500">Elite Legend Active</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">You have unlocked unrestricted lifetime administrative permissions.</p>
                </motion.div>
              )}
             </>
            )}

            {/* Log Out Section */}
            <div className="flex justify-center pt-10">
               <button 
                 onClick={() => useAuthStore.getState().logout()}
                 className="flex items-center gap-2 px-8 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/5 transition-all"
               >
                 <Trash2 className="w-3.5 h-3.5" /> Terminate Current Session
               </button>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
