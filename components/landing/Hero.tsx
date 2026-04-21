'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, ChevronDown } from 'lucide-react';

const prompts = [
  'Create a food delivery app with real-time order tracking',
  'Build a fitness tracker app with login and dark mode',
  'Create an e-commerce app with product listings and cart',
  'Build a meditation app with timers and breathing exercises',
  'Make a social app with profiles, posts, and messaging',
];

const generatedLines = [
  { text: '✓ Analyzing prompt...', done: true },
  { text: '✓ Scaffolding project structure...', done: true },
  { text: '✓ Generating App.tsx...', done: true },
  { text: '✓ Creating navigation stack...', done: true },
  { text: '✓ Building authentication screens...', done: true },
  { text: '✓ Adding dark mode support...', done: true },
  { text: '✓ Generating 14 files total', done: true },
];

const generatedFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/profile.tsx',
  'components/ui/Button.tsx',
  'lib/supabase.ts',
  'constants/theme.ts',
];

const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];

export default function Hero() {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  // Typing animation
  useEffect(() => {
    const target = prompts[currentPrompt];
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    setVisibleLineCount(0);

    const typeInt = setInterval(() => {
      i++;
      setDisplayedText(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(typeInt);
        setIsTyping(false);
        // Start generating lines
        let lineIdx = 0;
        const lineInt = setInterval(() => {
          lineIdx++;
          setVisibleLineCount(lineIdx);
          if (lineIdx >= generatedLines.length) {
            clearInterval(lineInt);
            setTimeout(() => {
              setCurrentPrompt((p) => (p + 1) % prompts.length);
            }, 2500);
          }
        }, 350);
      }
    }, 28);

    return () => clearInterval(typeInt);
  }, [currentPrompt]);

  return (
    <section
      className="grid-bg"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 600, height: 600, background: 'rgba(99,102,241,0.18)', top: -128, left: -128, animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(139,92,246,0.12)', bottom: -80, right: -80, animation: 'pulse 10s ease-in-out infinite reverse' }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'pulse 6s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '96px 40px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 56, alignItems: 'center' }}>

          {/* LEFT — Content */}
          <div>
            {/* Badge */}
            <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 14, marginBottom: 28, border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
              <span style={{ color: '#34d399', fontWeight: 500 }}>Advanced AI Engine</span>
              <Sparkles style={{ width: 14, height: 14, color: '#818cf8', flexShrink: 0 }} />
            </div>

            {/* Headline — LORA FONT */}
            <h1 style={{
              fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 24,
              fontFamily: 'var(--font-lora)',
              letterSpacing: '-0.01em',
            }}>
              Build any <span className="gradient-text">mobile app</span>
              <br />with a single
              <br /><span className="gradient-text-cyan" style={{ fontStyle: 'italic' }}>prompt</span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: 32, maxWidth: 520, lineHeight: 1.7 }}>
              Cordneed uses AI to instantly generate production-ready{' '}
              <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>React Native Expo</strong> code — complete
              with navigation, authentication, and beautiful UI. No coding required.
            </p>

            {/* Animated Prompt input */}
            <div className="glass" style={{ borderRadius: 16, padding: '14px 18px', marginBottom: 32, border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minHeight: 52 }}>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your prompt</p>
                <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.5 }}>
                  {displayedText}
                  <span className="cursor-blink" style={{ display: 'inline-block', width: 2, height: 16, background: '#818cf8', marginLeft: 2, verticalAlign: 'middle', opacity: isTyping ? 1 : 0 }} />
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 40 }}>
              <Link href="/signup" style={{ textDecoration: 'none' }}>
                <button
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 16, fontWeight: 600, fontSize: 15 }}
                >
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Start Building Free <ArrowRight style={{ width: 16, height: 16 }} />
                  </span>
                </button>
              </Link>
              <a href="#how-it-works" style={{ textDecoration: 'none' }}>
                <button
                  className="glass"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 16, fontWeight: 600, fontSize: 15, color: '#cbd5e1', border: '1px solid rgba(99,102,241,0.25)', background: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.25)'; }}
                >
                  <Play style={{ width: 15, height: 15, fill: 'currentColor' }} />
                  See How It Works
                </button>
              </a>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, fontSize: 14, color: '#64748b' }}>
              <div style={{ display: 'flex' }}>
                {avatarColors.map((color, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: color, border: '2px solid #040816',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    marginLeft: i > 0 ? -8 : 0,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span><strong style={{ color: '#f1f5f9' }}>2,400+</strong> apps built this month</span>
              <span style={{ color: '#334155' }}>·</span>
              <span>No credit card required</span>
            </div>
          </div>

          {/* RIGHT — Terminal */}
          <div style={{ position: 'relative' }}>
            <div
              className="glass animate-float"
              style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.22)', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)' }}
            >
              {/* Terminal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: '#080f20', borderBottom: '1px solid rgba(30,40,80,0.8)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.75)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(234,179,8,0.75)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,197,94,0.75)' }} />
                <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>cordneed — generating app</span>
              </div>

              {/* Terminal body */}
              <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 12, minHeight: 280, background: '#050d1a' }}>
                <div style={{ color: '#818cf8', marginBottom: 10 }}>$ cordneed generate</div>
                <div style={{ color: '#64748b', marginBottom: 12, fontSize: 12, lineHeight: 1.5, borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: 10 }}>
                  &quot;{prompts[currentPrompt] ?? ''}&quot;
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {generatedLines.slice(0, visibleLineCount).map((item, i) => (
                    <div key={i} style={{ color: item.done ? '#34d399' : '#64748b', fontWeight: item.done ? 600 : 400 }}>
                      {item.text}
                    </div>
                  ))}
                  {visibleLineCount > 0 && visibleLineCount < generatedLines.length && (
                    <span className="cursor-blink" style={{ display: 'inline-block', width: 8, height: 14, background: '#818cf8' }} />
                  )}
                </div>
              </div>

              {/* File tree preview */}
              {visibleLineCount >= generatedLines.length && (
                <div style={{ borderTop: '1px solid rgba(30,40,80,0.8)', padding: 16, background: '#060e1c' }}>
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontFamily: 'monospace' }}>Generated files:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: 12 }}>
                    {generatedFiles.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                        <span style={{ color: '#818cf8' }}>›</span>{f}
                      </div>
                    ))}
                    <div style={{ color: '#334155', fontSize: 11, marginTop: 2 }}>+ 9 more files</div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating stat cards */}
            <div className="glass" style={{ position: 'absolute', left: -24, top: '25%', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}>14s</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>avg. generation</div>
            </div>
            <div className="glass" style={{ position: 'absolute', right: -12, bottom: '25%', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}>14</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>files generated</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#334155', marginTop: 64 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Scroll to explore</span>
          <ChevronDown style={{ width: 16, height: 16, animation: 'float 2s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
}
