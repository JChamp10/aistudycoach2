'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { billingApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Check, Zap, Sparkles, Crown, Loader2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    billingApi.getPlans()
      .then(res => setPlans(res.data.plans))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (planId: string) => {
    if (user?.plan === planId) return toast.error('Account already on this tier.');
    if (planId === 'free' && user?.plan !== 'free') {
       return toast.error('Contact support for tier adjustments.');
    }
    
    setUpgrading(planId);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const res = await billingApi.checkout(planId);
      
      if (res.data.success) {
        toast.success(res.data.message, { duration: 4000 });
        window.location.href = '/dashboard';
      }
    } catch {
      toast.error('Transaction failed.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-16 px-6">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-[0.25em] mb-8"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Subscription Management
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-extrabold mb-6 uppercase tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Access Tiers
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            Optimize your workflow with expanded AI capacity and precision learning tools.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, idx) => {
            const isCurrent = user?.plan === plan.id;
            const isLegend = plan.id === 'legend';
            const isPro = plan.id === 'pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={clsx(
                  "relative flex flex-col p-10 rounded-xl border-2 transition-all duration-500",
                  isLegend 
                    ? 'bg-[#253018] border-brand-500/50 shadow-2xl scale-105 z-10' 
                    : 'hover:border-brand-500/40'
                )}
                style={!isLegend ? { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' } : {}}
              >
                {isLegend && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white dark:bg-white text-slate-900 px-6 py-2 rounded-lg text-[9px] font-bold tracking-[0.2em] flex items-center gap-2 shadow-xl border border-white">
                    <Crown className="w-3.5 h-3.5" /> PREFERRED TIER
                  </div>
                )}

                <div className="mb-10">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border shadow-inner",
                    isLegend ? 'bg-slate-900 border-slate-800' : ''
                  )} style={!isLegend ? { backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border-primary)' } : {}}>
                    {isLegend ? <Crown className="w-6 h-6 text-brand-500" /> : isPro ? <Zap className="w-6 h-6" style={{ color: 'var(--text-muted)' }} /> : <ArrowRight className="w-6 h-6" style={{ color: 'var(--text-faint)' }} />}
                  </div>
                  <h3 className={clsx("text-2xl font-extrabold mb-2 uppercase tracking-tight", isLegend ? 'text-white' : '')} style={!isLegend ? { color: 'var(--text-primary)' } : {}}>
                    {isLegend ? 'Elite' : isPro ? 'Professional' : 'Basic'}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className={clsx("text-4xl font-black", isLegend ? 'text-white' : '')} style={!isLegend ? { color: 'var(--text-primary)' } : {}}>${plan.price}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>/ Month</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className={clsx("mt-1 p-0.5 rounded-full", isLegend ? 'bg-brand-500/20 text-brand-500' : '')}
                        style={!isLegend ? { backgroundColor: 'var(--bg-muted)', color: 'var(--text-faint)' } : {}}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={clsx("text-sm font-medium", isLegend ? 'text-slate-300' : '')}
                        style={!isLegend ? { color: 'var(--text-muted)' } : {}}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!upgrading || isCurrent}
                  className={`w-full py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                    isCurrent 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-slate-700' 
                      : isLegend
                        ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-xl'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCurrent ? (
                    'ACTIVE TIER'
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Initialize Upgrade</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto pt-20 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Support & Policy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>Cancellation Protocols</h4>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>Subscriptions can be managed or terminated via account settings at any termination point in the billing cycle.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-faint)' }}>Energy Matrix</h4>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>Daily operational capacity resets at 00:00 UTC. Professional and Elite tiers feature expanded resource allocation.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
