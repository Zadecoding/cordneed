'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Wand2, ChevronRight, Loader2, CheckCircle2,
  ServerCrash, Brain, Code2, ImageIcon, Layers, Monitor,
  Zap, Smartphone, Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AppArchitecture } from '@/lib/ai/architect';

// ─── Templates ────────────────────────────────────────────────────────────────

const templates = [
  { label: '🏃 Fitness Tracker', prompt: 'Build a fitness tracker app with workout logging, progress charts, calorie counter, and dark mode' },
  { label: '🛒 E-Commerce', prompt: 'Create an e-commerce app with product listings, cart, checkout flow, and order history' },
  { label: '📝 Todo & Kanban', prompt: 'Build a task manager app with drag-and-drop kanban board, due dates, and categories' },
  { label: '💬 Social Feed', prompt: 'Make a social media app with posts feed, likes, comments, user profiles, and stories' },
  { label: '🧘 Meditation', prompt: 'Create a meditation app with guided sessions, breathing timer, mood tracker, and calming animations' },
  { label: '🍕 Food Delivery', prompt: 'Build a food delivery app with restaurant listing, menu, cart, real-time order tracking' },
  { label: '📚 Learning App', prompt: 'Build an e-learning app with video courses, quizzes, progress tracking, and certificates' },
  { label: '💰 Finance Tracker', prompt: 'Create a personal finance app with expense tracking, budgets, charts, and financial goals' },
];

// ─── Phase types ──────────────────────────────────────────────────────────────

type Phase = 'idle' | 'analyzing' | 'blueprint' | 'generating' | 'done' | 'error';

const generationSteps = [
  'Generating screens & navigation...',
  'Building components...',
  'Adding authentication flow...',
  'Optimizing TypeScript types...',
  'Finalizing project structure...',
  'Almost done...',
];

// ─── Complexity badge ─────────────────────────────────────────────────────────

function ComplexityBadge({ complexity }: { complexity: string }) {
  const map: Record<string, { color: string; label: string }> = {
    simple: { color: '#22c55e', label: 'Simple' },
    moderate: { color: '#f59e0b', label: 'Moderate' },
    complex: { color: '#ef4444', label: 'Complex' },
  };
  const cfg = map[complexity] ?? { color: '#6366f1', label: complexity };
  return (
    <span
      style={{
        background: cfg.color + '22',
        border: `1px solid ${cfg.color}55`,
        color: cfg.color,
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Architecture Blueprint Card ──────────────────────────────────────────────

function BlueprintCard({
  arch,
  onProceed,
  onBack,
}: {
  arch: AppArchitecture;
  onProceed: () => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        background: 'rgba(15,15,30,0.95)',
        border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 0 60px rgba(99,102,241,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, ${arch.primaryColor}, #8b5cf6)`,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: arch.primaryColor + '22',
            border: `1px solid ${arch.primaryColor}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Brain size={20} color={arch.primaryColor} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>
              {arch.suggestedName}
            </h3>
            <ComplexityBadge complexity={arch.complexity} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{arch.description}</p>
        </div>
      </div>

      {/* Grid: Screens + Features */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Screens */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Monitor size={14} color={arch.primaryColor} />
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Screens ({arch.screens.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {arch.screens.map((s) => (
              <span
                key={s.name}
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#a5b4fc',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Zap size={14} color='#f59e0b' />
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Features ({arch.features.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {arch.features.map((f) => (
              <span
                key={f.name}
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#fcd34d',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Color theme row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: arch.primaryColor,
            flexShrink: 0,
          }}
        />
        <div>
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Color Theme ·&nbsp;
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{arch.colorTheme}</span>
        </div>
        <Layout size={14} color='#475569' style={{ marginLeft: 'auto' }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            flex: '0 0 auto',
            padding: '12px 20px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          ← Edit Prompt
        </button>
        <button
          onClick={onProceed}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${arch.primaryColor}, #8b5cf6)`,
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 0 30px ${arch.primaryColor}44`,
            transition: 'all 0.2s',
          }}
        >
          <Code2 size={16} />
          Generate Code
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [appName, setAppName] = useState('');
  const [designLink, setDesignLink] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [architecture, setArchitecture] = useState<AppArchitecture | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Phase 1: Analyze ────────────────────────────────────────────────────────

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) { toast.error('Please describe your app first'); return; }

    setPhase('analyzing');
    setErrorMsg(null);
    setArchitecture(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), designLink: designLink.trim() || undefined }),
      });

      if (!res.ok) {
        // Analyze failing is non-fatal — proceed to generate without blueprint
        console.warn('[Create] Analyze failed, proceeding without blueprint');
        await handleGenerate(null);
        return;
      }

      const { architecture: arch } = await res.json();
      setArchitecture(arch);
      setPhase('blueprint');
    } catch (err) {
      // Non-fatal — skip blueprint, go straight to generate
      console.warn('[Create] Analyze error, skipping blueprint:', err);
      await handleGenerate(null);
    }
  };

  // ── Phase 2: Generate ───────────────────────────────────────────────────────

  const handleGenerate = async (arch: AppArchitecture | null) => {
    setPhase('generating');
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= generationSteps.length - 1) { clearInterval(stepInterval); return prev; }
        return prev + 1;
      });
    }, 4000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          name: appName.trim() || arch?.suggestedName || undefined,
          architecture: arch ?? architecture,
          designLink: designLink.trim() || undefined,
        }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        let msg = 'Generation failed';
        try {
          msg = ct.includes('application/json')
            ? (await res.json()).message ?? msg
            : await res.text() || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const { projectId } = await res.json();
      setPhase('done');
      setTimeout(() => router.push(`/projects/${projectId}`), 1200);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setErrorMsg(msg);
      setPhase('error');
      toast.error(msg);
    }
  };

  const resetToIdle = () => {
    setPhase('idle');
    setErrorMsg(null);
    setArchitecture(null);
    setCurrentStep(0);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px', maxWidth: '840px', marginLeft: 'auto', marginRight: 'auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Wand2 size={18} color='#fff' />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Create New App
          </h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginLeft: '46px', margin: 0 }}>
          Describe your app in plain English — AI designs the architecture, then generates complete React Native code.
        </p>

        {/* Phase stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
          {[
            { key: 'idle', icon: <Smartphone size={13} />, label: 'Describe' },
            { key: 'blueprint', icon: <Brain size={13} />, label: 'Architecture' },
            { key: 'generating', icon: <Code2 size={13} />, label: 'Code Gen' },
            { key: 'done', icon: <ImageIcon size={13} />, label: 'Done' },
          ].map((step, i, arr) => {
            const phaseOrder: Phase[] = ['idle', 'analyzing', 'blueprint', 'generating', 'done'];
            const currentIdx = phaseOrder.indexOf(phase);
            const stepIdx = phaseOrder.indexOf(step.key as Phase);
            const isActive = step.key === phase || (step.key === 'idle' && phase === 'analyzing') || (step.key === 'blueprint' && false);
            const isDone = currentIdx > stepIdx;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: '999px',
                    fontSize: '12px', fontWeight: 600,
                    background: isDone
                      ? 'rgba(34,197,94,0.15)'
                      : isActive
                        ? 'rgba(99,102,241,0.2)'
                        : 'rgba(255,255,255,0.04)',
                    border: isDone
                      ? '1px solid rgba(34,197,94,0.4)'
                      : isActive
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                    color: isDone ? '#4ade80' : isActive ? '#a5b4fc' : '#475569',
                    transition: 'all 0.3s',
                  }}
                >
                  {isDone ? <CheckCircle2 size={13} /> : step.icon}
                  {step.label}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: '20px', height: '1px', background: isDone ? '#22c55e44' : '#1e293b' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Phase: Analyzing ─────────────────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <div
          style={{
            background: 'rgba(15,15,30,0.95)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 20px' }}>
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: '18px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                opacity: 0.8,
                animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
              }}
            />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Brain size={28} color='#fff' />
            </div>
          </div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
            AI is Planning Your App
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 auto', maxWidth: '320px' }}>
            Analyzing your prompt to design screens, features, and architecture...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#6366f1',
                  animation: `bounce 1.4s ${i * 0.2}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Phase: Blueprint ─────────────────────────────────────────────────── */}
      {phase === 'blueprint' && architecture && (
        <BlueprintCard
          arch={architecture}
          onProceed={() => handleGenerate(architecture)}
          onBack={resetToIdle}
        />
      )}

      {/* ── Phase: Generating ────────────────────────────────────────────────── */}
      {phase === 'generating' && (
        <div
          style={{
            background: 'rgba(15,15,30,0.95)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '24px',
            padding: '40px 32px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 20px' }}>
            <div
              style={{
                position: 'absolute', inset: 0, borderRadius: '18px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
              }}
            />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Sparkles size={26} color='#fff' />
            </div>
          </div>

          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>
            Generating Your App
          </h3>
          <p style={{ color: '#818cf8', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
            {generationSteps[currentStep]}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px', margin: '0 auto 24px' }}>
            {generationSteps.slice(0, currentStep + 1).map((step, i) => (
              <div
                key={step}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: i < currentStep ? '#64748b' : '#818cf8',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
              >
                {i < currentStep
                  ? <CheckCircle2 size={14} color='#22c55e' style={{ flexShrink: 0 }} />
                  : <Loader2 size={14} color='#6366f1' style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                {step}
              </div>
            ))}
          </div>

          <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto', background: '#0f172a', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: '999px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                width: `${Math.min(((currentStep + 1) / generationSteps.length) * 100, 95)}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <p style={{ color: '#334155', fontSize: '12px', marginTop: '8px' }}>
            {architecture ? `Using AI · ${architecture.screens.length} screens to build` : 'Using AI · This takes 15–30 seconds'}
          </p>

          {/* Icon generation notice */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginTop: '16px', color: '#475569', fontSize: '12px',
            }}
          >
            <ImageIcon size={12} />
            App icon generating in background...
          </div>
        </div>
      )}

      {/* ── Phase: Done ──────────────────────────────────────────────────────── */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', padding: '48px 32px' }}>
          <CheckCircle2 size={56} color='#22c55e' style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>
            App Generated! 🎉
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Redirecting to your project...</p>
        </div>
      )}

      {/* ── Phase: Error ─────────────────────────────────────────────────────── */}
      {phase === 'error' && (
        <div
          style={{
            background: 'rgba(15,5,5,0.95)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '24px',
            padding: '40px 32px',
            textAlign: 'center',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
          <ServerCrash size={48} color='#ef4444' style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
            Generation Failed
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
            {errorMsg}
          </p>
          <button
            onClick={resetToIdle}
            style={{
              padding: '11px 28px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Try Again
          </button>
        </div>
      )}

      {/* ── Phase: Idle (form) ────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Prompt */}
          <div className='glass' style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}>
            <label style={{ display: 'block', color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Describe your app <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder='Build a fitness tracker app with login, workout logging, progress charts, and dark mode. Include a home screen with daily steps, a workout screen with exercise library, and a profile screen.'
              className='input-glass'
              style={{ width: '100%', borderRadius: '14px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ color: '#334155', fontSize: '12px' }}>
                Be specific — mention screens, features, and styling
              </span>
              <span style={{ color: prompt.length > 500 ? '#f59e0b' : '#334155', fontSize: '12px' }}>
                {prompt.length}
              </span>
            </div>
          </div>

          {/* Design Reference Link */}
          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Design Reference{' '}
              <span style={{ color: '#475569', fontWeight: 400 }}>(optional — paste a Figma, Stitch, or any design URL)</span>
            </label>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${designLink ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px', padding: '10px 14px',
                transition: 'border-color 0.2s',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>🎨</span>
              <input
                id="design-link"
                type="url"
                value={designLink}
                onChange={(e) => setDesignLink(e.target.value)}
                placeholder="https://www.figma.com/design/... or https://stitch.withgoogle.com/..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: '14px', fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              {designLink && (
                <button
                  type="button"
                  onClick={() => setDesignLink('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', flexShrink: 0 }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
            {designLink && (
              <p style={{ color: '#818cf8', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ✓ AI will use this design as a visual reference for layout, colors &amp; components
              </p>
            )}
          </div>

          {/* App Name */}
          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              App Name <span style={{ color: '#475569', fontWeight: 400 }}>(optional — AI will suggest one)</span>
            </label>
            <input
              type='text'
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder='e.g. FitTrack Pro'
              className='input-glass'
              style={{ width: '100%', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Templates */}
          <div>
            <label style={{ display: 'block', color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Or start from a template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {templates.map((t) => (
                <button
                  key={t.label}
                  type='button'
                  onClick={() => setPrompt(t.prompt)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: `1px solid ${prompt === t.prompt ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}`,
                    background: prompt === t.prompt ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    color: prompt === t.prompt ? '#a5b4fc' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (prompt !== t.prompt) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (prompt !== t.prompt) {
                      e.currentTarget.style.color = '#64748b';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>



          {/* Submit */}
          <button
            type='submit'
            className='btn-primary'
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '18px',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Brain size={18} />
            Plan & Generate App
            <ChevronRight size={16} />
          </button>

          <p style={{ textAlign: 'center', color: '#334155', fontSize: '12px' }}>
            Step 1: AI plans the architecture (2–3s) · Step 2: AI generates code (15–30s)
          </p>
        </form>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
