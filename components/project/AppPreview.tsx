'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Monitor, RefreshCw, Loader2, Code2 } from 'lucide-react';

interface AppPreviewProps {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
}

type Platform = 'web' | 'android' | 'ios';

export default function AppPreview({ projectId, projectName, files }: AppPreviewProps) {
  const [platform, setPlatform] = useState<Platform>('web');
  const [snackId, setSnackId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Sync with Expo Snack API ───────────────────────────────────────────────
  
  useEffect(() => {
    async function syncSnack() {
      if (!files || Object.keys(files).length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch('/api/snack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files, projectName }),
        });
        
        if (!res.ok) throw new Error('Failed to save to Expo Snack');
        
        const data = await res.json();
        setSnackId(data.id);
      } catch (err) {
        console.error(err);
        setError('Interactive preview unavailable right now.');
      } finally {
        setLoading(false);
      }
    }
    
    syncSnack();
  }, [files, projectName, refreshKey]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const iframeSrc = snackId 
    ? `https://snack.expo.dev/embedded/@snack/${snackId}?preview=true&platform=${platform}&theme=dark&hideComponents=true`
    : '';

  return (
    <div className="flex flex-col h-full bg-[#030812]">
      
      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-3 flex-shrink-0 bg-[#060d1a] border-b border-white/5">
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1">
          {(['web', 'android', 'ios'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                platform === p 
                  ? 'bg-indigo-500 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {p === 'web' && <Monitor size={12} className="inline mr-1.5" />}
              {p !== 'web' && <Smartphone size={12} className="inline mr-1.5" />}
              {p}
            </button>
          ))}
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {snackId && (
            <a 
              href={`https://snack.expo.dev/@snack/${snackId}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Code2 size={13} />
              Open Full Editor
            </a>
          )}
          <button 
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Reload Environment"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Preview Area ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0d1a30_0%,_#030812_100%)]">
        
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#030812]/80 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <div className="text-sm font-semibold text-slate-200">Building Interactive App...</div>
            <div className="text-xs text-slate-500 mt-1">Deploying changes to device</div>
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-red-400 font-medium px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        {snackId && !error && (
          <iframe
            src={iframeSrc}
            className="w-full h-full border-none"
            allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
            sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
