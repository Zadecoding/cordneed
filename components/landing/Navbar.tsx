'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Smartphone, Menu, X, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.3s ease',
        ...(scrolled
          ? { background: 'rgba(10,18,40,0.90)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,40,80,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }
          : { background: 'transparent' }),
      }}
    >
      {/* Main bar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}>
            <Smartphone style={{ width: 17, height: 17, color: '#fff' }} />
          </div>
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-space-grotesk)' }}>
            Cordneed
          </span>
        </Link>

        {/* Desktop nav links — always visible on non-mobile */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  padding: '8px 16px', fontSize: 14, color: '#94a3b8',
                  textDecoration: 'none', borderRadius: 8,
                  transition: 'color 0.2s ease, background 0.2s ease',
                }}
                onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = '#f1f5f9'; (e.target as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = '#94a3b8'; (e.target as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Desktop auth buttons — always visible on non-mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                  <Sparkles style={{ width: 14, height: 14 }} />
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <button style={{ padding: '8px 16px', fontSize: 14, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
                    onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#f1f5f9'}
                    onMouseLeave={e => (e.target as HTMLButtonElement).style.color = '#94a3b8'}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                    Start Building Free
                  </button>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8, borderRadius: 8 }}
          >
            {menuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          background: 'rgba(10,18,40,0.97)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(30,40,80,0.8)',
          padding: '16px 24px 24px',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '10px 12px', fontSize: 14, color: '#94a3b8', textDecoration: 'none', borderRadius: 8 }}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', fontSize: 14, color: '#94a3b8', background: 'none', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, cursor: 'pointer' }}>
                    Sign In
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                    Start Building Free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
