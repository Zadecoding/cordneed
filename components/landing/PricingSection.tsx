'use client';

import { Check, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    Icon: Zap,
    price: '₹0',
    period: 'forever',
    description: 'Perfect for exploring and prototyping',
    features: ['2 projects per month', 'Standard generation speed', 'File viewer & copy', 'React Native Expo output', 'TypeScript by default', 'Community support'],
    limitations: ['Watermark in generated code', 'No ZIP export', 'No priority queue'],
    cta: 'Get Started Free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    Icon: Crown,
    price: '₹499',
    period: 'per month',
    description: 'For serious builders and professionals',
    features: ['Unlimited projects', 'Priority generation (3x faster)', 'ZIP download export', 'No watermark', 'Premium templates', 'Advanced Expo Router setup', 'Authentication scaffolding', 'Priority email support'],
    limitations: [],
    cta: 'Upgrade to Pro',
    ctaHref: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '96px 0', position: 'relative' }}>
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(99,102,241,0.10)', left: '50%', top: 0, transform: 'translateX(-50%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 14, color: '#fbbf24', fontWeight: 500, marginBottom: 16 }}>
            <Crown style={{ width: 14, height: 14 }} />
            Simple pricing
          </div>
          <h2 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-lora)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
            Start free, scale when{' '}<em className="gradient-text" style={{ fontStyle: 'italic' }}>you&apos;re ready</em>
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto' }}>
            No hidden fees. No credit card required for the free plan.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          maxWidth: 760,
          margin: '0 auto',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="card"
              style={{
                borderRadius: 24,
                position: 'relative',
                borderColor: plan.highlighted ? 'rgba(99,102,241,0.55)' : undefined,
                boxShadow: plan.highlighted ? '0 4px 40px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.15)' : undefined,
              }}
            >
              {/* Badge */}
              {plan.highlighted && plan.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    padding: '6px 16px', borderRadius: 999,
                    boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
                    whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Pro top glow */}
              {plan.highlighted && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'linear-gradient(to bottom, rgba(99,102,241,0.06), transparent)', pointerEvents: 'none' }} />
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Plan + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: plan.highlighted ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,36,60,0.9)',
                  }}>
                    <plan.Icon style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--font-space-grotesk)' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{plan.description}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--font-space-grotesk)' }}>{plan.price}</span>
                  <span style={{ color: '#64748b', fontSize: 14, marginLeft: 4 }}>/{plan.period}</span>
                </div>

                {/* CTA */}
                <Link href={plan.ctaHref} style={{ display: 'block', marginBottom: 24 }}>
                  <button style={{
                    width: '100%', padding: '12px 0', borderRadius: 14, fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                    ...(plan.highlighted
                      ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }
                      : { background: 'rgba(30,36,60,0.8)', color: '#cbd5e1', border: '1px solid rgba(99,102,241,0.25)' })
                  }}>
                    {plan.cta}
                  </button>
                </Link>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                      <Check style={{ width: 16, height: 16, color: plan.highlighted ? '#818cf8' : '#64748b', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: '#cbd5e1' }}>{f}</span>
                    </li>
                  ))}
                  {plan.limitations.map((l) => (
                    <li key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, opacity: 0.4 }}>
                      <div style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <div style={{ width: 10, height: 1, background: '#64748b', borderRadius: 1 }} />
                      </div>
                      <span style={{ color: '#64748b' }}>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 13, marginTop: 40 }}>
          All prices in Indian Rupees (INR). Payments processed securely via Razorpay.
        </p>
      </div>
    </section>
  );
}
