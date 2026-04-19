'use client';

import { MessageSquare, Cpu, Rocket, Check } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: MessageSquare,
    title: 'Describe Your App',
    description: 'Simply type what you want to build — "A fitness app with login, workout tracker, and progress charts." No technical knowledge needed.',
    accent: '#818cf8',
    shadowColor: 'rgba(99,102,241,0.35)',
    gradientFrom: '#6366f1',
    gradientTo: '#8b5cf6',
    details: ['Natural language input', 'Template suggestions', 'Smart prompt enhancement', 'Multi-screen support'],
  },
  {
    step: '02',
    icon: Cpu,
    title: 'AI Generates Code',
    description: "Cordneed's AI engine analyzes your prompt and generates a complete React Native Expo project with all screens, components, and navigation.",
    accent: '#a78bfa',
    shadowColor: 'rgba(139,92,246,0.35)',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
    details: ['Full file structure', 'TypeScript code', 'Navigation setup', 'Component library'],
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Download & Deploy',
    description: 'Browse the generated code in our file viewer, copy individual files, or download the entire project as a ZIP and run with Expo instantly.',
    accent: '#f472b6',
    shadowColor: 'rgba(236,72,153,0.35)',
    gradientFrom: '#ec4899',
    gradientTo: '#fb923c',
    details: ['Interactive file viewer', 'One-click ZIP export', 'Copy any file', 'Expo compatible'],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '96px 0', position: 'relative' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 14, color: '#a78bfa', fontWeight: 500, marginBottom: 16 }}>
            <Rocket style={{ width: 14, height: 14 }} />
            How it works
          </div>
          <h2 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-lora)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
            From prompt to app in{' '}<em className="gradient-text" style={{ fontStyle: 'italic' }}>3 simple steps</em>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem', maxWidth: 480, margin: '0 auto' }}>
            No design tools, no boilerplate, no setup. Just describe and build.
          </p>
        </div>

        {/* Responsive grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <div key={step.step} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card" style={{
                  borderRadius: 24,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '32px 28px',
                  border: `1px solid ${step.accent}22`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Big step number watermark */}
                  <div style={{
                    position: 'absolute', top: 14, right: 18,
                    fontSize: 60, fontWeight: 800,
                    fontFamily: 'var(--font-space-grotesk)',
                    color: `${step.accent}14`,
                    lineHeight: 1, userSelect: 'none',
                  }}>
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${step.gradientFrom}, ${step.gradientTo})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 28px ${step.shadowColor}`,
                    marginBottom: 24, flexShrink: 0,
                  }}>
                    <StepIcon style={{ width: 26, height: 26, color: '#fff' }} />
                  </div>

                  {/* Step label */}
                  <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: step.accent, marginBottom: 10, letterSpacing: '0.12em' }}>
                    STEP {step.step}
                  </p>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 12, fontFamily: 'var(--font-space-grotesk)' }}>
                    {step.title}
                  </h3>

                  {/* Description — flex:1 pushes bullets to bottom */}
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 24, flex: 1 }}>
                    {step.description}
                  </p>

                  {/* 4 bullets — identical count on every card */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {step.details.map((detail) => (
                      <li key={detail} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                        <Check style={{ width: 15, height: 15, color: step.accent, flexShrink: 0 }} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
