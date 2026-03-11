'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const REGIONS = [
  'Global',
  'North America',
  'South America',
  'Europe',
  'UK & Ireland',
  'Middle East & North Africa',
  'Sub-Saharan Africa',
  'South Asia',
  'East Asia',
  'Southeast Asia',
  'Oceania',
];

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!region) return toast.error('Please select your region');
    try {
      await register(username, email, password, region);
      toast.success('Account created! Let\'s start learning 🧠');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const perks = ['Free forever plan', 'AI-powered explanations', 'Spaced repetition', 'No credit card needed'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold">Create your account</h1>
          <p className="text-slate-400 mt-2">Join 50,000+ students learning smarter</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {perks.map(p => (
            <div key={p} className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> {p}
            </div>
          ))}
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="studymaster99" className="input" minLength={3} maxLength={50} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="input pr-12" minLength={8} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Your Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="input" required>
                <option value="">Select your region...</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-50">
              {isLoading ? 'Creating account...' : 'Create free account →'}
            </button>
            <p className="text-xs text-slate-500 text-center">By signing up you agree to our Terms of Service</p>
          </form>
        </div>
        <p className="text-center text-slate-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 hover:underline font-medium">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-slate-600 hover:text-slate-400 text-sm">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
