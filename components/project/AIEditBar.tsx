'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Wand2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AIEditBarProps {
  projectId: string;
  onFilesUpdated: (files: Record<string, string>, changedPaths: string[]) => void;
}

const suggestions = [
  'Add a dark/light mode toggle',
  'Add loading skeletons to all screens',
  'Change the color scheme to blue and white',
  'Add a settings screen',
  'Make the navigation bottom-tab based',
  'Add pull-to-refresh on the main screen',
];

export default function AIEditBar({ projectId, onFilesUpdated }: AIEditBarProps) {
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [changedCount, setChangedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim() || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');
    setChangedCount(0);

    try {
      const res = await fetch(`/api/projects/${projectId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeRequest: request.trim() }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json')
          ? (await res.json()).message
          : await res.text();
        throw new Error(msg || 'Edit failed');
      }

      const { files, changedFiles } = await res.json();
      setChangedCount(changedFiles.length);
      setStatus('done');
      toast.success(`${changedFiles.length} file${changedFiles.length !== 1 ? 's' : ''} updated`);
      onFilesUpdated(files, changedFiles);
      setRequest('');

      // Reset to idle after a moment
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Edit failed';
      setErrorMsg(msg);
      setStatus('error');
      toast.error(msg);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const isLoading = status === 'loading';

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: '#060d1a',
      padding: '12px 16px',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Wand2 size={13} color='#6366f1' />
        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
          AI Code Editor
        </span>
        <span style={{
          fontSize: '10px', color: '#334155',
          background: 'rgba(255,255,255,0.04)',
          padding: '1px 7px', borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          updates only changed files
        </span>

        {/* Suggestions toggle */}
        <button
          type='button'
          onClick={() => setShowSuggestions(s => !s)}
          style={{
            marginLeft: 'auto', fontSize: '11px', color: '#475569',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '2px 8px', borderRadius: '6px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          {showSuggestions ? 'hide ideas ↑' : 'show ideas ↓'}
        </button>
      </div>

      {/* Suggestion chips */}
      {showSuggestions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {suggestions.map((s) => (
            <button
              key={s}
              type='button'
              onClick={() => { setRequest(s); setShowSuggestions(false); textareaRef.current?.focus(); }}
              style={{
                fontSize: '11px', color: '#818cf8',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '8px', padding: '4px 10px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Status banners */}
      {status === 'done' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '10px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          marginBottom: '8px', fontSize: '13px', color: '#4ade80',
        }}>
          <CheckCircle2 size={14} />
          {changedCount} file{changedCount !== 1 ? 's' : ''} updated successfully
        </div>
      )}
      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          marginBottom: '8px', fontSize: '13px', color: '#f87171',
        }}>
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
          }}
          placeholder='Describe a change, e.g. "Add a search bar to the Home screen"  (Enter to send, Shift+Enter for new line)'
          rows={2}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#e2e8f0',
            fontSize: '13px',
            padding: '10px 14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
            opacity: isLoading ? 0.6 : 1,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        <button
          type='submit'
          disabled={isLoading || !request.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: 'none',
            background: isLoading || !request.trim()
              ? 'rgba(99,102,241,0.3)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            cursor: isLoading || !request.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 600,
            flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: isLoading || !request.trim() ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
            height: '64px',
          }}
        >
          {isLoading ? (
            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Applying...</>
          ) : (
            <><Sparkles size={14} />Apply<ChevronRight size={12} /></>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
