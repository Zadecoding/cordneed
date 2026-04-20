import { Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg" style={{ minHeight: '100vh', background: '#040816', display: 'flex', flexDirection: 'column' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(99,102,241,0.18)', top: -96, left: -96 }} />
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.13)', bottom: -80, right: -80 }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, padding: '20px 28px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Cordneed" width={32} height={32} style={{ borderRadius: 10, objectFit: 'cover', boxShadow: '0 4px 12px rgba(244,63,94,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-space-grotesk)' }}>
            Cordneed
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
