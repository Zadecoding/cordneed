'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Background orb */}
      <div className="orb" style={{ width: 700, height: 700, background: 'rgba(99,102,241,0.14)', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      {/* Subtle grid */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
        {/* Glass card */}
        <div style={{
          background: 'rgba(14,22,56,0.88)',
          border: '1px solid rgba(99,102,241,0.38)',
          borderRadius: 28,
          padding: '60px 48px',
          boxShadow: '0 8px 64px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>

          {/* Floating icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
            animation: 'float 4s ease-in-out infinite',
          }}>
            <Sparkles style={{ width: 28, height: 28, color: '#fff' }} />
          </div>

          {/* Heading — Lora font, italic accent like Hero */}
          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 700,
            fontFamily: 'var(--font-lora)',
            lineHeight: 1.12,
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}>
            Ready to build{' '}
            <em className="gradient-text" style={{ fontStyle: 'italic' }}>your app?</em>
          </h2>

          {/* Subtext */}
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join <strong style={{ color: '#e2e8f0' }}>2,400+</strong> developers and founders who use Cordneed
            to ship React Native apps faster than ever before.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            {['Free to start', 'No credit card', '< 15s generation', 'TypeScript ready'].map((item) => (
              <span key={item} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc',
              }}>
                ✓ {item}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <Link href="/signup" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 16, fontWeight: 600, fontSize: 15 }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Start Building Free <ArrowRight style={{ width: 17, height: 17 }} />
                </span>
              </button>
            </Link>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '15px 32px', borderRadius: 16, fontWeight: 600, fontSize: 15,
                  color: '#94a3b8', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.28)', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color = '#f1f5f9'; b.style.borderColor = 'rgba(99,102,241,0.55)'; b.style.background = 'rgba(99,102,241,0.1)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color = '#94a3b8'; b.style.borderColor = 'rgba(99,102,241,0.28)'; b.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                View Pricing
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
