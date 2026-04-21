'use client';

import { useState, useMemo } from 'react';
import { Smartphone, ExternalLink, RefreshCw, Monitor } from 'lucide-react';

interface AppPreviewProps {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
}

type Platform = 'web' | 'ios' | 'android';

// ── Extract design tokens from project files ──────────────────────────────────

function extractTokens(files: Record<string, string>) {
  const colors = files['constants/Colors.ts'] || '';
  const primary = colors.match(/primary:\s*['"]([^'"]+)['"]/)?.[1] ?? '#6C3DE8';

  // Collect tab screen names from (tabs) folder
  const tabs: string[] = [];
  for (const path of Object.keys(files)) {
    const m = path.match(/^app\/\(tabs\)\/(.+)\.tsx$/);
    if (m) {
      const name = m[1] === 'index' ? 'Home' : m[1].charAt(0).toUpperCase() + m[1].slice(1).replace(/-/g, ' ');
      tabs.push(name);
    }
  }
  if (tabs.length === 0) tabs.push('Home', 'Explore', 'Profile', 'Settings');

  return { primary, tabs };
}

// ── Build a self-contained standalone App.js for Snack ────────────────────────
// This creates a simple but visually accurate preview of the generated app.
// We inline everything into one file so Snack can run it without resolving imports.

function buildPreviewApp(projectName: string, files: Record<string, string>): string {
  const { primary, tabs } = extractTokens(files);

  const tabIconMap: Record<string, string> = {
    home: 'home', explore: 'compass', discover: 'compass',
    profile: 'person', account: 'person', settings: 'settings',
    search: 'search', favorites: 'heart', library: 'library-books',
    chat: 'chat', message: 'message', notifications: 'notifications',
    analytics: 'bar-chart', stats: 'bar-chart', map: 'map',
  };

  function getIcon(name: string): string {
    const key = name.toLowerCase().replace(/\s+/g, '');
    for (const [k, v] of Object.entries(tabIconMap)) {
      if (key.includes(k)) return v;
    }
    return 'circle';
  }

  const tabsJson = JSON.stringify(tabs.slice(0, 5).map(t => ({ name: t, icon: getIcon(t) })));

  // Get the home screen content (index.tsx) to show as context
  const homeFile = files['app/(tabs)/index.tsx'] || files['app/index.tsx'] || '';

  // Extract top-level card titles if present (simple regex)
  const cardTitles: string[] = [];
  const matches = homeFile.matchAll(/title:\s*['"]([^'"]{3,40})['"]/g);
  for (const m of matches) cardTitles.push(m[1]);
  const cards = cardTitles.slice(0, 4);
  if (cards.length === 0) cards.push('Getting Started', 'Advanced Module', 'Daily Challenge', 'Community Event');

  return `import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PRIMARY = '${primary}';
const BG = '#0f172a';
const SURFACE = '#1e293b';
const BORDER = '#334155';
const TEXT = '#f1f5f9';
const MUTED = '#94a3b8';

const TABS = ${tabsJson};
const CARDS = ${JSON.stringify(cards)};
const APP_NAME = '${projectName.replace(/'/g, "\\'")}';

const STATS = [
  { label: 'Active', value: '24', color: '#f59e0b' },
  { label: 'Done', value: '142', color: '#22c55e' },
  { label: 'Streak', value: '7d', color: '#ef4444' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [activePct] = useState([60, 30, 90, 15]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>Good morning 👋</Text>
        <Text style={s.appName}>{APP_NAME}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Banner */}
        <View style={[s.banner, { borderColor: PRIMARY + '55', backgroundColor: PRIMARY + '18' }]}>
          <Text style={[s.bannerTag, { color: PRIMARY }]}>FEATURED</Text>
          <Text style={s.bannerTitle}>Start your journey today</Text>
          <Text style={s.bannerSub}>Explore all features and reach your goals faster.</Text>
          <TouchableOpacity style={[s.bannerBtn, { backgroundColor: PRIMARY }]}>
            <Text style={s.bannerBtnTxt}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        <Text style={s.sectionTitle}>Continue where you left off</Text>
        {CARDS.map((card, i) => (
          <View key={card} style={s.card}>
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{card}</Text>
                <Text style={s.cardSub}>{['5 min', '12 min', '8 min', '15 min'][i % 4]} read · {['Beginner', 'Pro', 'Daily', 'Live'][i % 4]}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={MUTED} />
            </View>
            <View style={s.progBg}>
              <View style={[s.progFill, { width: activePct[i % 4] + '%', backgroundColor: PRIMARY }]} />
            </View>
            <Text style={s.progTxt}>{activePct[i % 4]}% complete</Text>
          </View>
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab.name} style={s.tabItem} onPress={() => setActiveTab(i)} activeOpacity={0.7}>
            <MaterialIcons
              name={tab.icon}
              size={22}
              color={activeTab === i ? PRIMARY : MUTED}
            />
            <Text style={[s.tabLabel, activeTab === i && { color: PRIMARY }]}>{tab.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingTop: Platform.OS === 'ios' ? 54 : 32, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: BG },
  greeting: { fontSize: 12, color: MUTED },
  appName: { fontSize: 26, fontWeight: '700', color: TEXT },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  statVal: { fontSize: 20, fontWeight: '700' },
  statLbl: { fontSize: 11, color: MUTED, marginTop: 2 },
  banner: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 18 },
  bannerTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 4 },
  bannerSub: { fontSize: 13, color: MUTED, marginBottom: 14 },
  bannerBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  bannerBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 12 },
  card: { backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: TEXT, marginBottom: 3 },
  cardSub: { fontSize: 12, color: MUTED },
  progBg: { height: 5, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progFill: { height: '100%', borderRadius: 4 },
  progTxt: { fontSize: 11, color: MUTED },
  tabBar: { flexDirection: 'row', backgroundColor: '#0a1628', borderTopWidth: 1, borderTopColor: BORDER, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: MUTED },
});`;
}

// ── Build Snack embed URL using files param ───────────────────────────────────

function buildSnackEmbedUrl(
  appCode: string,
  platform: Platform
): string {
  const snackFiles = JSON.stringify({
    'App.js': { type: 'CODE', contents: appCode },
  });

  const params = new URLSearchParams({
    iframeId: 'cordneed-preview',
    preview: 'true',
    platform,
    theme: 'dark',
    supportedPlatforms: 'web,ios,android',
    files: snackFiles,
  });

  return `https://snack.expo.dev/embedded?${params.toString()}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PLATFORM_FRAME: Record<Platform, { w: string; h: string; r: string }> = {
  web:     { w: '100%',   h: '100%', r: '0' },
  ios:     { w: '375px',  h: '700px', r: '44px' },
  android: { w: '360px',  h: '700px', r: '24px' },
};

export default function AppPreview({ projectId, projectName, files }: AppPreviewProps) {
  const [platform, setPlatform] = useState<Platform>('web');
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Build the preview code once (memoized)
  const previewCode = useMemo(() => buildPreviewApp(projectName, files), [projectName, files]);
  const snackUrl = useMemo(() => buildSnackEmbedUrl(previewCode, platform), [previewCode, platform]);
  const snackShareUrl = useMemo(() => {
    const params = new URLSearchParams({
      platform: 'web',
      preview: 'true',
      files: JSON.stringify({ 'App.js': { type: 'CODE', contents: previewCode } }),
    });
    return `https://snack.expo.dev/?${params.toString()}`;
  }, [previewCode]);

  const frame = PLATFORM_FRAME[platform];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#030812' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', flexShrink: 0, background: '#060d1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Smartphone size={14} color='#6366f1' />
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Live Preview</span>
        <span style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.06)' }}>
          Expo Snack
        </span>
        <div style={{ flex: 1 }} />

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px' }}>
          {(['web', 'ios', 'android'] as const).map(p => (
            <button key={p} onClick={() => { setPlatform(p); setIframeLoaded(false); }}
              style={{ padding: '4px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: platform === p ? 'rgba(99,102,241,0.8)' : 'transparent', color: platform === p ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
              {p === 'web' && <Monitor size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
              {p}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button onClick={() => { setIframeKey(k => k + 1); setIframeLoaded(false); }}
          title='Reload'
          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
          <RefreshCw size={14} />
        </button>

        {/* Open in Snack */}
        <a href={snackShareUrl} target='_blank' rel='noopener noreferrer' title='Open in Expo Snack'
          style={{ padding: '6px', borderRadius: '8px', color: '#475569', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: platform === 'web' ? '0' : '24px', background: platform === 'web' ? '#050d1a' : 'radial-gradient(ellipse at center, #0d1a30 0%, #030812 100%)' }}>
        <div style={{
          width: frame.w, height: frame.h, borderRadius: frame.r,
          overflow: 'hidden', position: 'relative', maxWidth: '100%', maxHeight: '100%',
          boxShadow: platform !== 'web' ? '0 0 0 8px #1e293b, 0 0 0 10px #0f172a, 0 40px 100px rgba(0,0,0,0.8)' : 'none',
        }}>
          {/* Loading overlay */}
          {!iframeLoaded && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#050d1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s ease-in-out infinite' }}>
                <Smartphone size={22} color='#fff' />
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Loading preview…</p>
            </div>
          )}
          <iframe
            key={`${iframeKey}-${platform}`}
            src={snackUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow='accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; microphone'
            sandbox='allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads'
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.7; transform:scale(.95); } }
      `}</style>
    </div>
  );
}
