'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, UserPlus, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const perks = ['2 free projects per month', 'No credit card required', 'React Native Expo output'];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: fullName });
      await supabase.from('subscriptions').upsert({ user_id: data.user.id, plan: 'free', status: 'active' });
    }
    setLoading(false);
    setSuccess(true);
    toast.success('Registration successful. Please check your email.');
  };

  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      {/* Card */}
      <div style={{
        background: 'rgba(10,18,46,0.92)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(52,211,153,0.2)',
            }}>
              <Mail style={{ width: 32, height: 32, color: '#34d399' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 12, fontFamily: 'var(--font-lora)' }}>
              Check your email
            </h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
              We've sent a verification link to <br /> <strong style={{ color: '#fff' }}>{email}</strong>. <br /><br />
              Please click the link in your email to activate your account and access the dashboard.
            </p>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Didn't receive it? <button type="button" onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 500, cursor: 'pointer' }}>Try signing up again</button>
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          }}>
            <UserPlus style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'var(--font-lora)' }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Start building apps with AI for free</p>
        </div>

        {/* Perks */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
          {perks.map((perk) => (
            <span key={perk} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: '#34d399',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 999, padding: '4px 12px',
            }}>
              ✓ {perk}
            </span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 7 }}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              required className="input-glass" placeholder="John Doe" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 7 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="input-glass" placeholder="you@example.com" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 7 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required className="input-glass input-glass-password" placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{
            width: '100%', padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
          }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Creating account...
              </>
            ) : (
              <><span>Create Free Account</span><ArrowRight style={{ width: 16, height: 16 }} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 16 }}>
          By signing up, you agree to our{' '}
          <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Terms</a> and{' '}
          <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy Policy</a>
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 12 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#818cf8', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
          </>
        )}
      </div>
    </div>
  );
}
