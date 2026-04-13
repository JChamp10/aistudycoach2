'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, devLogin, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  const handleDevLogin = async () => {
    try {
      await devLogin();
      toast.success('Bypassed login (Dev Mode)');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Dev login failed');
    }
  };

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
          <h1 className="text-3xl font-extrabold">Welcome back</h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Sign in to continue studying</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input pr-12" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-light)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-50">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-brand-500/40 bg-brand-500/10 text-brand-500 font-semibold hover:bg-brand-500/15 transition-all font-mono"
              >
                Developer Bypass Limit
              </button>
            )}
          </form>
        </div>
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-500 hover:underline font-medium">Create one free</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-light)' }}>Back to home</Link>
        </p>
      </div>
    </div>
  );
}
