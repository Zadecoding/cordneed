'use client';

import { useState, useEffect, useRef } from 'react';
import { Smartphone, ExternalLink, RefreshCw, Monitor } from 'lucide-react';

interface AppPreviewProps {
  files: Record<string, string>;
  projectName: string;
}

/** Builds a minimal Expo Snack URL from the project files.
 *  We encode the files as Snack query params for an embedded preview. */
function buildSnackUrl(files: Record<string, string>, projectName: string): string {
  // Find App.tsx or app/index.tsx as entry
  const appEntry = files['App.tsx'] || files['app/index.tsx'] || '';

  // Encode key files for Snack (Snack supports ?code= for single-file or files param)
  // Use the Snack embed URL with the code from App.tsx
  const encodedCode = encodeURIComponent(appEntry || `import { View, Text } from 'react-native';
export default function App() {
  return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0f172a'}}>
    <Text style={{color:'#fff',fontSize:24,fontWeight:'bold'}}>${projectName}</Text>
  </View>;
}`);

  return `https://snack.expo.dev/embedded?iframeId=cordneed-preview&preview=true&platform=web&theme=dark&code=${encodedCode}&supportedPlatforms=web,ios,android`;
}

export default function AppPreview({ files, projectName }: AppPreviewProps) {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // force iframe reload
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const snackUrl = buildSnackUrl(files, projectName);

  const platformDims = {
    web: { width: '100%', height: '100%', borderRadius: '0px' },
    ios: { width: '390px', height: '720px', borderRadius: '44px' },
    android: { width: '360px', height: '720px', borderRadius: '24px' },
  };

  const dims = platformDims[platform];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#030812' }}>

      {/* Preview toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px',
        background: '#060d1a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <Smartphone size={14} color='#6366f1' />
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, flex: 1 }}>
          Live Preview
        </span>

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px' }}>
          {(['web', 'ios', 'android'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              style={{
                padding: '4px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: platform === p ? 'rgba(99,102,241,0.8)' : 'transparent',
                color: platform === p ? '#fff' : '#64748b',
                textTransform: 'capitalize',
              }}
            >
              {p === 'web' ? <Monitor size={12} style={{ display: 'inline', marginRight: '4px' }} /> : null}
              {p}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => { setKey(k => k + 1); setIsLoading(true); }}
          title='Reload preview'
          style={{
            padding: '4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#475569', transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <RefreshCw size={14} />
        </button>

        {/* Open in Snack */}
        <a
          href={`https://snack.expo.dev/?code=${encodeURIComponent(files['App.tsx'] || '')}`}
          target='_blank'
          rel='noopener noreferrer'
          title='Open in Expo Snack'
          style={{
            padding: '4px', borderRadius: '8px', color: '#475569', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Preview area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: platform === 'web' ? '0' : '24px',
        background: platform === 'web' ? 'transparent' : 'radial-gradient(ellipse at center, #0d1a30 0%, #030812 100%)',
      }}>
        <div style={{
          width: dims.width,
          height: dims.height,
          borderRadius: dims.borderRadius,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: platform !== 'web'
            ? '0 0 0 8px #1e293b, 0 0 0 10px #0f172a, 0 30px 80px rgba(0,0,0,0.8)'
            : 'none',
          maxWidth: '100%',
          maxHeight: '100%',
        }}>
          {/* Loading overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: '#050d1a',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                <Smartphone size={20} color='#fff' />
              </div>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Loading preview...</span>
            </div>
          )}

          <iframe
            key={key}
            ref={iframeRef}
            src={snackUrl}
            style={{
              width: '100%', height: '100%', border: 'none',
              background: '#050d1a',
            }}
            allow='accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; microphone; usb; xr-spatial-tracking'
            sandbox='allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads'
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
