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
      toast.success("Account created! Let's start learning");
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const perks = ['Free forever plan', 'AI-powered explanations', 'Spaced repetition', 'No credit card needed'];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
              boxShadow: '0 12px 30px -18px var(--brand-glow-hover)',
            }}
          >
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold">Create your account</h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Join students learning smarter</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {perks.map(p => (
            <div key={p} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle className="w-3.5 h-3.5 text-brand-500" /> {p}
            </div>
          ))}
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="studymaster99" className="input" minLength={3} maxLength={50} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="input pr-12" minLength={8} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-light)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Your Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="input" required>
                <option value="">Select your region...</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-50">
              {isLoading ? 'Creating account...' : 'Create free account'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-light)' }}>By signing up you agree to our Terms of Service</p>
          </form>
        </div>
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 hover:underline font-medium">Sign in</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-light)' }}>Back to home</Link>
        </p>
      </div>
    </div>
  );
}
