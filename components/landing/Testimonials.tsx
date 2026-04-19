'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'Rahul Mehta', role: 'Indie Developer', avatar: 'RM', color: '#6366f1', text: 'I built and published my first React Native app in under an hour. Cordneed generated the entire codebase — navigation, auth, everything. Absolutely mind-blowing.' },
  { name: 'Priya Sharma', role: 'Startup Founder', avatar: 'PS', color: '#8b5cf6', text: 'We used Cordneed to prototype our MVP for investors. The generated code was clean enough that our dev team could extend it directly. Saved us 3 weeks of work.' },
  { name: 'Arjun Nair', role: 'Full Stack Developer', avatar: 'AN', color: '#06b6d4', text: 'The TypeScript output is surprisingly good. I was skeptical but the generated components follow best practices. Definitely use this for rapid prototyping.' },
  { name: 'Sneha Patel', role: 'Product Designer', avatar: 'SP', color: '#ec4899', text: "As a designer who can't code, Cordneed let me bring my designs to life as working apps. I can now prototype and demo functional apps to clients on my own." },
  { name: 'Vikram Singh', role: 'Mobile Developer', avatar: 'VS', color: '#10b981', text: 'The Expo Router integration is perfect. Generated apps have proper navigation structure from the start. This is my go-to tool for starting new projects.' },
  { name: 'Ananya Krishnan', role: 'Tech Lead', avatar: 'AK', color: '#f59e0b', text: 'We use Cordneed for client demos and internal tools. The ZIP download is seamless and the generated code is production quality. Worth every rupee.' },
];

const stats = [
  { stat: '2,400+', label: 'Apps Generated' },
  { stat: '850+', label: 'Active Users' },
  { stat: '4.9/5', label: 'Average Rating' },
  { stat: '<15s', label: 'Avg Generation' },
];

function TestimonialCard({ t }: { t: (typeof testimonials)[0] }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Quote style={{ width: 22, height: 22, color: 'rgba(129,140,248,0.5)', marginBottom: 12 }} />
      <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7, marginBottom: 20, flexGrow: 1 }}>{t.text}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: t.color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 700,
          color: '#fff', flexShrink: 0
        }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{t.name}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{t.role}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, j) => (
            <Star key={j} style={{ width: 12, height: 12, fill: '#fbbf24', color: '#fbbf24' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'rgba(6,10,22,0.8)' }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.1)', right: -80, top: 0, pointerEvents: 'none' }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'rgba(99,102,241,0.1)', left: -40, bottom: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 14, color: '#f472b6', fontWeight: 500, marginBottom: 16 }}>
            <Star style={{ width: 14, height: 14, fill: 'currentColor' }} />
            Wall of love
          </div>
          <h2 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-lora)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
            Loved by{' '}<em className="gradient-text" style={{ fontStyle: 'italic' }}>developers</em>
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto' }}>
            Join thousands of developers, founders, and creators who build with Cordneed every day.
          </p>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>

        {/* Stats */}
        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
          {stats.map((item) => (
            <div key={item.label} className="card" style={{ textAlign: 'center', borderRadius: 16 }}>
              <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-space-grotesk)', marginBottom: 4 }}>
                {item.stat}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 14 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
