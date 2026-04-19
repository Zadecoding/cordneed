'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      {/* Card */}
      <div style={{
        background: 'rgba(10,18,46,0.92)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          }}>
            <LogIn style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'var(--font-lora)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Sign in to your Cordneed account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 7 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="input-glass" placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>Password</label>
              <a href="#" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required className="input-glass input-glass-password" placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading} className="btn-primary"
            style={{ width: '100%', padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <><span>Sign In</span><ArrowRight style={{ width: 16, height: 16 }} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
