'use client';

import { useState, useMemo } from 'react';
import { Smartphone, Monitor, RefreshCw } from 'lucide-react';

interface AppPreviewProps {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
}

type Platform = 'mobile' | 'tablet' | 'web';

// ── Extract app design tokens from generated files ────────────────────────────

function extractAppData(files: Record<string, string>, appName: string) {
  const colors = files['constants/Colors.ts'] || '';
  const primary   = colors.match(/primary:\s*['"]([^'"]+)['"]/)?.[1]   ?? '#6C3DE8';
  const background= colors.match(/background:\s*['"]([^'"]+)['"]/)?.[1]?? '#0f172a';
  const surface   = colors.match(/surface:\s*['"]([^'"]+)['"]/)?.[1]   ?? '#1e293b';
  const border    = colors.match(/border:\s*['"]([^'"]+)['"]/)?.[1]    ?? '#334155';
  const text      = colors.match(/text:\s*['"]([^'"]+)['"]/)?.[1]      ?? '#f1f5f9';
  const textMuted = colors.match(/textMuted:\s*['"]([^'"]+)['"]/)?.[1] ?? '#94a3b8';

  // Collect tab screens
  const tabs: string[] = [];
  for (const path of Object.keys(files).sort()) {
    const m = path.match(/^app\/\(tabs\)\/(.+)\.tsx$/);
    if (m) {
      const raw = m[1];
      const label = raw === 'index' ? 'Home' : raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, ' ');
      if (!tabs.includes(label)) tabs.push(label);
    }
  }
  if (tabs.length === 0) tabs.push('Home', 'Explore', 'Profile', 'Settings');

  // Extract cards from home screen
  const homeCode = files['app/(tabs)/index.tsx'] || files['app/index.tsx'] || '';
  const cardTitles = [...homeCode.matchAll(/title:\s*['"]([^'"]{4,40})['"]/g)].map(m => m[1]).slice(0, 4);
  if (cardTitles.length === 0) cardTitles.push('Getting Started', 'Advanced Module', 'Daily Challenge', 'Community Event');

  // App description from prompt or app.json
  const appJson = files['app.json'] || '';
  const descMatch = appJson.match(/"description":\s*"([^"]+)"/);
  const description = descMatch?.[1] || '';

  return { primary, background, surface, border, text, textMuted, tabs: tabs.slice(0, 5), cardTitles, description };
}

// ── Tab icon SVGs (inline, no external dep) ──────────────────────────────────

function TabIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }): React.ReactElement {
  const n = name.toLowerCase();

  // Simple geometric icon placeholders that match the concept
  const icons: Record<string, React.ReactElement> = {
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    explore: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    discover: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    profile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    account: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
      </svg>
    ),
    cart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  };

  const key = Object.keys(icons).find(k => n.includes(k)) ?? 'explore';
  return icons[key] ?? icons.explore;
}

// ── Screen renderers ──────────────────────────────────────────────────────────

function HomeScreen({ app }: { app: ReturnType<typeof extractAppData> & { name: string } }) {
  const { primary, surface, border, text, textMuted, cardTitles, background } = app;
  const pcts = [60, 30, 90, 15];
  const tags = ['Beginner', 'Pro', 'Daily', 'Live'];
  const tagColors = [primary + '33', '#f59e0b33', '#22c55e33', '#ef444433'];
  const tagTexts = [primary, '#f59e0b', '#22c55e', '#ef4444'];

  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: textMuted, marginBottom: '2px' }}>Good morning 👋</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: text }}>{app.name}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {[{ l: 'Active', v: '24', c: '#f59e0b' }, { l: 'Done', v: '142', c: '#22c55e' }, { l: 'Streak', v: '7d', c: '#ef4444' }].map(s => (
          <div key={s.l} style={{ flex: 1, background: surface, borderRadius: '12px', padding: '12px', textAlign: 'center', border: `1px solid ${border}` }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: textMuted, marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Banner */}
      <div style={{ background: primary + '18', border: `1px solid ${primary}55`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: primary, letterSpacing: '1px', marginBottom: '4px' }}>FEATURED</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: text, marginBottom: '4px' }}>Start your journey today</div>
        <div style={{ fontSize: '11px', color: textMuted, marginBottom: '10px' }}>Explore all features and reach your goals faster.</div>
        <div style={{ background: primary, borderRadius: '8px', padding: '7px 14px', display: 'inline-block', fontSize: '12px', fontWeight: '600', color: '#fff' }}>Get Started →</div>
      </div>

      {/* Cards */}
      <div style={{ fontSize: '14px', fontWeight: '700', color: text, marginBottom: '10px' }}>Continue Learning</div>
      {cardTitles.map((title, i) => (
        <div key={title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: text }}>{title}</span>
                <span style={{ background: tagColors[i], borderRadius: '5px', padding: '2px 6px', fontSize: '9px', fontWeight: '700', color: tagTexts[i] }}>{tags[i]}</span>
              </div>
              <div style={{ fontSize: '11px', color: textMuted }}>{['5 min read', '12 min read', '8 min read', '15 min read'][i]}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div style={{ height: '5px', background: border, borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ height: '100%', width: `${pcts[i]}%`, background: primary, borderRadius: '4px' }} />
          </div>
          <div style={{ fontSize: '10px', color: textMuted }}>{pcts[i]}% complete</div>
        </div>
      ))}
    </div>
  );
}

function GenericScreen({ screenName, app }: { screenName: string; app: ReturnType<typeof extractAppData> }) {
  const { primary, surface, border, text, textMuted } = app;
  const isProfile = /profile|account/i.test(screenName);
  const isSettings = /setting|config/i.test(screenName);

  if (isProfile) {
    return (
      <div style={{ padding: '16px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: text, marginBottom: '16px' }}>{screenName}</div>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: primary + '22', border: `2px solid ${primary}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: text }}>Alex Johnson</div>
              <div style={{ fontSize: '12px', color: textMuted }}>alex@example.com</div>
              <div style={{ marginTop: '5px', background: primary + '22', borderRadius: '5px', padding: '2px 8px', display: 'inline-block', fontSize: '10px', fontWeight: '700', color: primary }}>Pro Member</div>
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: `1px solid ${border}`, paddingTop: '12px' }}>
            {[['142', 'Completed'], ['7d', 'Streak'], ['2.4k', 'Points']].map(([v, l], i) => (
              <div key={l} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${border}` : 'none' }}>
                <div style={{ fontSize: '17px', fontWeight: '700', color: text }}>{v}</div>
                <div style={{ fontSize: '10px', color: textMuted }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {['Edit Profile', 'Notifications', 'Privacy & Security', 'Help & Support'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', padding: '14px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth={2}><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: text }}>{item}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
          </div>
        ))}
      </div>
    );
  }

  if (isSettings) {
    const sections = [
      { title: 'Preferences', items: ['Dark Mode', 'Notifications', 'Sound Effects'] },
      { title: 'Account', items: ['Change Password', 'Two-Factor Auth'] },
    ];
    return (
      <div style={{ padding: '16px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: text, marginBottom: '16px' }}>{screenName}</div>
        {sections.map(s => (
          <div key={s.title} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: textMuted, padding: '12px 14px 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>{s.title}</div>
            {s.items.map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderTop: i === 0 ? `1px solid ${border}` : 'none' }}>
                <span style={{ flex: 1, fontSize: '14px', color: text }}>{item}</span>
                <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: i === 0 ? primary : border, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '2px', right: i === 0 ? '2px' : 'auto', left: i === 0 ? 'auto' : '2px', width: '16px', height: '16px', borderRadius: '8px', background: '#fff' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Explore / generic
  const items = ['Quick Start', 'Advanced Guide', 'Tips & Tricks', 'Video Tutorial', 'Best Practices'];
  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: text, marginBottom: '14px' }}>{screenName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', padding: '10px 12px', marginBottom: '12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span style={{ fontSize: '13px', color: textMuted }}>Search…</span>
      </div>
      <div style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
        {['All', 'Popular', 'New'].map((c, i) => (
          <div key={c} style={{ padding: '5px 14px', borderRadius: '14px', background: i === 0 ? primary : surface, border: `1px solid ${i === 0 ? primary : border}`, fontSize: '12px', fontWeight: '600', color: i === 0 ? '#fff' : textMuted }}>{c}</div>
        ))}
      </div>
      {items.map(item => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: surface, border: `1px solid ${border}`, borderRadius: '14px', padding: '13px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: text, marginBottom: '3px' }}>{item}</div>
            <div style={{ fontSize: '11px', color: textMuted }}>6 min · Free</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AppPreview({ projectId: _pid, projectName, files }: AppPreviewProps) {
  const [platform, setPlatform] = useState<Platform>('mobile');
  const [activeTab, setActiveTab] = useState(0);
  const app = useMemo(() => ({ ...extractAppData(files, projectName), name: projectName }), [files, projectName]);

  const { primary, background, border, textMuted, tabs } = app;

  const frameSize = {
    mobile: { outer: '375px', height: '720px', radius: '44px' },
    tablet: { outer: '500px', height: '700px', radius: '24px' },
    web:    { outer: '100%',  height: '100%',  radius: '0px' },
  };

  const frame = frameSize[platform];
  const isNative = platform !== 'web';

  const currentScreen = tabs[activeTab] ?? 'Home';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#030812' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', flexShrink: 0, background: '#060d1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Smartphone size={14} color='#6366f1' />
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>App Preview</span>
        <span style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.06)' }}>
          Interactive Mockup
        </span>
        <div style={{ flex: 1 }} />

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px' }}>
          {([['mobile', 'Mobile'], ['tablet', 'Tablet'], ['web', 'Full']] as const).map(([p, lbl]) => (
            <button key={p} onClick={() => setPlatform(p)}
              style={{ padding: '4px 11px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: platform === p ? 'rgba(99,102,241,0.8)' : 'transparent', color: platform === p ? '#fff' : '#64748b' }}>
              {p === 'web' && <Monitor size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />}
              {lbl}
            </button>
          ))}
        </div>

        {/* Tab picker */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
              style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: `1px solid ${i === activeTab ? primary + '88' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', background: i === activeTab ? primary + '22' : 'transparent', color: i === activeTab ? primary : '#64748b', transition: 'all 0.2s' }}>
              {t}
            </button>
          ))}
        </div>

        <button onClick={() => setActiveTab(0)}
          title='Reset'
          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: isNative ? '24px' : '0', background: isNative ? 'radial-gradient(ellipse at center, #0d1a30 0%, #030812 100%)' : background }}>
        <div style={{
          width: frame.outer, height: frame.height,
          maxWidth: '100%', maxHeight: '100%',
          borderRadius: frame.radius, overflow: 'hidden', position: 'relative',
          boxShadow: isNative ? '0 0 0 8px #1e293b, 0 0 0 11px #0f172a, 0 40px 100px rgba(0,0,0,0.8)' : 'none',
          display: 'flex', flexDirection: 'column',
          background: background,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          {/* Status bar */}
          {isNative && (
            <div style={{ background: background, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 4px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#f1f5f9' }}>9:41</span>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {['wifi', 'battery'].map(i => (
                  <svg key={i} width={i === 'battery' ? '24' : '16'} height='12' viewBox={i === 'battery' ? '0 0 24 12' : '0 0 18 14'} fill='none'>
                    {i === 'wifi'
                      ? <><path d="M9 11h0M5.5 7.5a5 5 0 017 0M2 4a9 9 0 0114 0" stroke='#f1f5f9' strokeWidth={1.5} strokeLinecap='round'/></>
                      : <><rect x="1" y="1" width="20" height="10" rx="2" stroke='#f1f5f9' strokeWidth={1.5}/><rect x="21" y="3.5" width="2" height="5" rx="1" fill='#f1f5f9'/><rect x="2.5" y="2.5" width="15" height="7" rx="1" fill='#f1f5f9'/></>}
                  </svg>
                ))}
              </div>
            </div>
          )}

          {/* Screen content */}
          <div style={{ flex: 1, overflow: 'hidden', background: background }}>
            {activeTab === 0
              ? <HomeScreen app={app} />
              : <GenericScreen screenName={currentScreen} app={app} />}
          </div>

          {/* Tab bar */}
          <div style={{ background: '#0a1628', borderTop: `1px solid ${border}`, display: 'flex', flexShrink: 0, paddingBottom: isNative ? '20px' : '8px', paddingTop: '8px' }}>
            {tabs.map((tab, i) => {
              const active = i === activeTab;
              return (
                <button key={tab} onClick={() => setActiveTab(i)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                  <TabIcon name={tab} color={active ? primary : textMuted} size={22} />
                  <span style={{ fontSize: '10px', fontWeight: '600', color: active ? primary : textMuted, transition: 'color 0.2s' }}>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
