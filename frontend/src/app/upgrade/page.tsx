'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { billingApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Check, Zap, Sparkles, Crown, Loader2, ArrowRight } from 'lucide-react';
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
    if (user?.plan === planId) return toast.error('You are already on this plan!');
    if (planId === 'free' && user?.plan !== 'free') {
       return toast.error('Please contact support to downgrade.');
    }
    
    setUpgrading(planId);
    try {
      // Simulate real-world checkout delay
      await new Promise(r => setTimeout(r, 1500));
      const res = await billingApi.checkout(planId);
      
      if (res.data.success) {
        toast.success(res.data.message, { icon: '🎉', duration: 5000 });
        // Refresh user state to reflect new plan
        window.location.href = '/dashboard'; // Force refresh to update all components
      }
    } catch {
      toast.error('Payment failed. Please try again.');
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
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" /> LEVEL UP YOUR LEARNING
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold text-text-primary mb-6"
          >
            Choose Your <span className="text-brand-500">Power Level</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-text-muted font-bold max-w-2xl mx-auto"
          >
            Unlock unlimited AI power and premium study tools designed to help you ace every exam.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => {
            const isCurrent = user?.plan === plan.id;
            const isLegend = plan.id === 'legend';
            const isPro = plan.id === 'pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 ${
                  isLegend 
                    ? 'bg-surface-card border-brand-500 shadow-[0_0_40px_rgba(var(--brand-glow),0.1)] scale-105 z-10' 
                    : 'bg-surface-card border-surface-border hover:border-brand-500/50'
                }`}
              >
                {isLegend && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-6 py-2 rounded-full text-xs font-black tracking-widest flex items-center gap-2 shadow-lg">
                    <Crown className="w-4 h-4" /> MOST POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-b-4 ${
                    isLegend ? 'bg-brand-500 border-brand-600' : isPro ? 'bg-duo-blue border-duo-blueShadow' : 'bg-surface-muted border-surface-border'
                  }`}>
                    {isLegend ? <Crown className="w-7 h-7 text-white" /> : isPro ? <Zap className="w-7 h-7 text-white" /> : <ArrowRight className="w-7 h-7 text-text-muted" />}
                  </div>
                  <h3 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-text-primary">${plan.price}</span>
                    <span className="text-text-muted font-bold">/MO</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className={`mt-1 p-0.5 rounded-full ${isLegend ? 'bg-brand-500/20 text-brand-500' : 'bg-surface-muted text-text-muted'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[15px] font-bold text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!upgrading || isCurrent}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    isCurrent 
                      ? 'bg-surface-muted text-text-faint cursor-default border-2 border-surface-border' 
                      : isLegend
                        ? 'bg-brand-500 text-white shadow-[0_6px_0_rgb(var(--brand-dark))] hover:translate-y-[-2px] hover:shadow-[0_8px_0_rgb(var(--brand-dark))]'
                        : 'bg-surface-elevated text-brand-500 border-2 border-brand-500/30 hover:bg-brand-500/5'
                  }`}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isCurrent ? (
                    'CURRENT PLAN'
                  ) : isLegend ? (
                    'UPGRADE TO LEGEND'
                  ) : (
                    'GET STARTED'
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto border-t-2 border-surface-border pt-16">
          <h2 className="text-3xl font-black text-text-primary mb-8 text-center uppercase tracking-tight">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="font-black text-text-primary uppercase text-sm tracking-wide">Can I cancel anytime?</h4>
              <p className="text-sm text-text-muted font-medium">Yes! You can cancel your subscription at any time from your profile settings. No hidden fees.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-text-primary uppercase text-sm tracking-wide">How does AI Energy work?</h4>
              <p className="text-sm text-text-muted font-medium">Energy resets every day at midnight. Legend users never have to worry about limits!</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
