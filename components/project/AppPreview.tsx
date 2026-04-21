'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, ExternalLink, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface AppPreviewProps {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
}

type Platform = 'web' | 'ios' | 'android';
type State = 'idle' | 'creating' | 'ready' | 'error';

const PLATFORM_SIZES: Record<Platform, { width: string; height: string; radius: string }> = {
  web:     { width: '100%',   height: '100%', radius: '0' },
  ios:     { width: '375px',  height: '700px', radius: '44px' },
  android: { width: '360px',  height: '700px', radius: '24px' },
};

export default function AppPreview({ projectId, projectName, files }: AppPreviewProps) {
  const [state, setState] = useState<State>('idle');
  const [snackId, setSnackId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<Platform>('web');
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasFetched = useRef(false);

  // Create snack on first mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    createSnack();
  }, []);

  async function createSnack() {
    setState('creating');
    setError('');
    setIframeLoaded(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/snack`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create preview');
      setSnackId(data.snackId);
      setState('ready');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setState('error');
    }
  }

  function refresh() {
    hasFetched.current = false;
    setSnackId(null);
    setIframeKey(k => k + 1);
    setIframeLoaded(false);
    createSnack();
    hasFetched.current = true;
  }

  const dims = PLATFORM_SIZES[platform];
  const snackEmbedUrl = snackId
    ? `https://snack.expo.dev/embedded?snack=${snackId}&preview=true&platform=${platform}&theme=dark&supportedPlatforms=web,ios,android`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#030812' }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', flexShrink: 0,
        background: '#060d1a', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Smartphone size={14} color='#6366f1' />
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Live Preview</span>
        <span style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.06)' }}>
          Powered by Expo Snack
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Platform switcher */}
        {state === 'ready' && (
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px' }}>
            {(['web', 'ios', 'android'] as const).map(p => (
              <button key={p} onClick={() => { setPlatform(p); setIframeLoaded(false); }}
                style={{
                  padding: '4px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: platform === p ? 'rgba(99,102,241,0.8)' : 'transparent',
                  color: platform === p ? '#fff' : '#64748b', textTransform: 'capitalize',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Refresh */}
        <button onClick={refresh} disabled={state === 'creating'}
          title='Recreate preview'
          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: state === 'creating' ? 'not-allowed' : 'pointer', color: '#475569', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <RefreshCw size={14} style={{ animation: state === 'creating' ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        {/* Open in Snack */}
        {snackId && (
          <a href={`https://snack.expo.dev/${snackId}`} target='_blank' rel='noopener noreferrer'
            title='Open in Expo Snack'
            style={{ padding: '6px', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        padding: platform === 'web' ? '0' : '24px',
        background: platform === 'web' ? '#050d1a' : 'radial-gradient(ellipse at center, #0d1a30 0%, #030812 100%)',
      }}>

        {/* Creating snack */}
        {state === 'creating' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Loader2 size={24} color='#fff' style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 6px' }}>Building preview…</p>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Sending your app to Expo Snack</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '360px', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} color='#ef4444' />
            </div>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 6px' }}>Preview unavailable</p>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>
            </div>
            <button onClick={refresh}
              style={{ padding: '10px 24px', borderRadius: '12px', background: 'rgba(99,102,241,0.8)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Ready — show iframe */}
        {state === 'ready' && snackEmbedUrl && (
          <div style={{
            width: dims.width, height: dims.height,
            borderRadius: dims.radius,
            overflow: 'hidden', position: 'relative',
            maxWidth: '100%', maxHeight: '100%',
            boxShadow: platform !== 'web'
              ? '0 0 0 8px #1e293b, 0 0 0 10px #0f172a, 0 40px 100px rgba(0,0,0,0.8)'
              : 'none',
          }}>
            {/* iframe loading overlay */}
            {!iframeLoaded && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: '#050d1a', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
              }}>
                <Loader2 size={32} color='#6366f1' style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#64748b', fontSize: '13px' }}>Loading Snack…</span>
              </div>
            )}
            <iframe
              key={`${iframeKey}-${platform}`}
              src={snackEmbedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow='accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; microphone; usb; xr-spatial-tracking'
              sandbox='allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads'
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
