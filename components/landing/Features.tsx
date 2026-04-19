'use client';

import {
  Zap, Code2, FolderTree, Download, Moon, Database,
  Smartphone, Shield, Palette, Globe, Cpu, Layers
} from 'lucide-react';

const features = [
  { icon: Cpu, title: 'AI-Powered Generation', description: 'Gemini AI understands your prompt and generates complete, production-ready React Native Expo code in seconds.', color: 'from-indigo-500 to-violet-600', glow: 'rgba(99,102,241,0.25)' },
  { icon: Smartphone, title: 'Android & iOS Ready', description: 'Every generated app works natively on both platforms with platform-specific optimizations built in.', color: 'from-cyan-500 to-blue-600', glow: 'rgba(6,182,212,0.25)' },
  { icon: FolderTree, title: 'Full File Tree View', description: 'Browse your generated project like a real IDE — explore folders, view any file with full syntax highlighting.', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.25)' },
  { icon: Download, title: 'ZIP Download', description: 'Download your entire project as a single ZIP file. Open in VS Code and run with Expo in minutes.', color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.25)' },
  { icon: Moon, title: 'Dark Mode Support', description: 'Generated apps include full dark/light mode support using React Native appearance and theme context.', color: 'from-slate-500 to-slate-700', glow: 'rgba(100,116,139,0.25)' },
  { icon: Database, title: 'Supabase Powered', description: 'Your projects are securely stored in Supabase with row-level security. Access them anywhere, anytime.', color: 'from-green-500 to-emerald-600', glow: 'rgba(34,197,94,0.25)' },
  { icon: Code2, title: 'TypeScript by Default', description: 'All generated code uses TypeScript with proper types, interfaces, and strict mode for maximum reliability.', color: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.25)' },
  { icon: Shield, title: 'Auth Scaffolding', description: "Need login? Just say so. Cordneed generates complete authentication flows — signup, login, password reset.", color: 'from-orange-500 to-amber-600', glow: 'rgba(249,115,22,0.25)' },
  { icon: Palette, title: 'Expo Router Navigation', description: 'All apps use the latest Expo Router with file-based routing for clean, maintainable navigation.', color: 'from-pink-500 to-rose-600', glow: 'rgba(236,72,153,0.25)' },
  { icon: Layers, title: 'Reusable Components', description: 'Generated code includes well-organized, reusable components following React Native best practices.', color: 'from-teal-500 to-cyan-600', glow: 'rgba(20,184,166,0.25)' },
  { icon: Zap, title: 'Instant Preview', description: "View your app's structure and code instantly in our editor — no need to download to understand what was built.", color: 'from-yellow-500 to-amber-500', glow: 'rgba(234,179,8,0.25)' },
  { icon: Globe, title: 'Deploy Anywhere', description: 'Export to Expo Go, EAS Build, or bare React Native. Your app is yours — no lock-in, ever.', color: 'from-indigo-400 to-cyan-500', glow: 'rgba(99,102,241,0.25)' },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'rgba(6,10,22,0.8)' }}>
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(99,102,241,0.08)', top: '50%', left: 0, transform: 'translateY(-50%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 14, color: '#818cf8', fontWeight: 500, marginBottom: 16 }}>
            <Zap style={{ width: 14, height: 14 }} />
            Everything you need
          </div>
          <h2 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-lora)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
            Built for{' '}<em className="gradient-text" style={{ fontStyle: 'italic' }}>modern developers</em>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem', maxWidth: 560, margin: '0 auto' }}>
            From idea to production-ready code in seconds. Every feature you need to ship React Native apps fast.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card"
                style={{ position: 'relative', overflow: 'hidden', cursor: 'default' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  const glow = el.querySelector('.feat-glow') as HTMLDivElement;
                  if (glow) glow.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  const glow = el.querySelector('.feat-glow') as HTMLDivElement;
                  if (glow) glow.style.opacity = '0';
                }}
              >
                <div
                  className="feat-glow"
                  style={{
                    position: 'absolute', inset: 0, opacity: 0,
                    background: `radial-gradient(circle at 50% 0%, ${feature.glow} 0%, transparent 70%)`,
                    transition: 'opacity 0.4s ease', pointerEvents: 'none', borderRadius: 16,
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    className={`bg-gradient-to-br ${feature.color}`}
                    style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    <Icon style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15, marginBottom: 8, fontFamily: 'var(--font-space-grotesk)' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
