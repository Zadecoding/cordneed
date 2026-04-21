'use client';

import { useState, useMemo } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { Smartphone, Monitor, RefreshCw } from 'lucide-react';

interface AppPreviewProps {
  projectId: string;
  projectName: string;
  files: Record<string, string>;
}

// ─── React-Native → React-Web shim ────────────────────────────────────────────
// Maps every RN primitive to an HTML equivalent so the code runs in a browser.
const RN_SHIM = `
import React from 'react';

function makeStyle(s) {
  if (!s) return {};
  if (Array.isArray(s)) return Object.assign({}, ...s.map(makeStyle));
  return s;
}

export const StyleSheet = {
  create: (s) => s,
  flatten: makeStyle,
  absoluteFillObject: { position:'absolute', top:0, left:0, right:0, bottom:0 },
};

export function View({ style, children, ...p }) {
  return <div style={{ display:'flex', flexDirection:'column', boxSizing:'border-box', ...makeStyle(style) }} {...p}>{children}</div>;
}
export function ScrollView({ style, contentContainerStyle, children, horizontal, ...p }) {
  const s = { display:'flex', flexDirection: horizontal ? 'row' : 'column', overflowY: horizontal ? 'hidden' : 'auto', overflowX: horizontal ? 'auto' : 'hidden', boxSizing:'border-box', ...makeStyle(style) };
  return <div style={s} {...p}><div style={{ display:'flex', flexDirection: horizontal ? 'row' : 'column', ...makeStyle(contentContainerStyle) }}>{children}</div></div>;
}
export function Text({ style, children, numberOfLines, ...p }) {
  const s = { fontFamily:'system-ui,sans-serif', color:'#f1f5f9', ...makeStyle(style) };
  if (numberOfLines === 1) { s.whiteSpace = 'nowrap'; s.overflow = 'hidden'; s.textOverflow = 'ellipsis'; }
  return <span style={s} {...p}>{children}</span>;
}
export function TouchableOpacity({ style, onPress, disabled, activeOpacity, children, ...p }) {
  return <div role="button" onClick={disabled ? undefined : onPress} style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, display:'flex', flexDirection:'column', boxSizing:'border-box', ...makeStyle(style) }} {...p}>{children}</div>;
}
export const Pressable = TouchableOpacity;
export function TextInput({ style, placeholder, value, onChangeText, placeholderTextColor, multiline, secureTextEntry, keyboardType, ...p }) {
  const s = { fontFamily:'system-ui,sans-serif', outline:'none', border:'none', background:'transparent', color:'inherit', width:'100%', ...makeStyle(style) };
  const common = { style: s, placeholder, value: value ?? '', onChange: (e) => onChangeText?.(e.target.value), ...p };
  return multiline ? <textarea rows={4} {...common} /> : <input type={secureTextEntry ? 'password' : 'text'} {...common} />;
}
export function Switch({ value, onValueChange, trackColor, thumbColor }) {
  const bg = value ? (trackColor?.true || '#6C3DE8') : (trackColor?.false || '#334155');
  return <div onClick={() => onValueChange?.(!value)} style={{ width:44, height:24, borderRadius:12, backgroundColor:bg, cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
    <div style={{ position:'absolute', top:2, left: value ? 22 : 2, width:20, height:20, borderRadius:10, backgroundColor: thumbColor || '#fff', transition:'left 0.2s' }} />
  </div>;
}
export function Image({ source, style, resizeMode, ...p }) {
  const src = typeof source === 'object' ? source?.uri : source;
  return <img src={src} style={{ objectFit: resizeMode || 'cover', ...makeStyle(style) }} {...p} />;
}
export function FlatList({ data, renderItem, keyExtractor, style, contentContainerStyle, horizontal, ListEmptyComponent, ListHeaderComponent, ...p }) {
  return <div style={{ display:'flex', flexDirection: horizontal ? 'row' : 'column', overflowY: horizontal ? 'hidden' : 'auto', overflowX: horizontal ? 'auto' : 'hidden', ...makeStyle(style) }}>
    {ListHeaderComponent}
    {data && data.length > 0 ? data.map((item, index) => <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>{renderItem({ item, index })}</React.Fragment>) : ListEmptyComponent}
  </div>;
}
export function ActivityIndicator({ color, size }) {
  return <div style={{ width: size === 'large' ? 36 : 20, height: size === 'large' ? 36 : 20, border: \`3px solid \${color||'#6C3DE8'}33\`, borderTop: \`3px solid \${color||'#6C3DE8'}\`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />;
}
export function SafeAreaView({ style, children, ...p }) {
  return <div style={{ display:'flex', flexDirection:'column', flex:1, boxSizing:'border-box', ...makeStyle(style) }} {...p}>{children}</div>;
}
export function Modal({ visible, children, animationType, transparent, onRequestClose }) {
  if (!visible) return null;
  return <div style={{ position:'fixed', inset:0, zIndex:999, backgroundColor: transparent ? 'transparent' : '#000', display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</div>;
}
export function KeyboardAvoidingView({ style, children, ...p }) {
  return <div style={{ display:'flex', flexDirection:'column', ...makeStyle(style) }} {...p}>{children}</div>;
}
export const Platform = { OS: 'web', select: (obj) => obj.web ?? obj.default };
export const Dimensions = { get: () => ({ width: 390, height: 844 }), addEventListener: () => ({ remove: () => {} }) };
export const Animated = {
  Value: class { constructor(v) { this._v = v; } },
  View,
  Text,
  timing: () => ({ start: (cb) => cb?.() }),
  spring: () => ({ start: (cb) => cb?.() }),
  parallel: (a) => ({ start: (cb) => { a.forEach(x => x.start()); cb?.(); } }),
  createAnimatedComponent: (C) => C,
};
export default { View, Text, ScrollView, TouchableOpacity, Pressable, TextInput, Switch, Image, FlatList, ActivityIndicator, SafeAreaView, StyleSheet, Platform, Dimensions, Animated };
`;

const SAFE_AREA_SHIM = `
export { SafeAreaView, SafeAreaProvider } from 'react-native';
`;

// Strip TS type annotations for JS sandpack execution
function stripTypes(code: string): string {
  return code
    // Remove TypeScript type imports: import type ...
    .replace(/^import\s+type\s+.*;\n?/gm, '')
    // Remove inline type assertions: as SomeType
    .replace(/\s+as\s+[A-Z][A-Za-z<>\[\]|&,\s]+(?=[,)\];\s])/g, '')
    // Remove type/interface declarations
    .replace(/^(export\s+)?(type|interface)\s+\w[\s\S]*?(?=\n\n|\nexport|\nfunction|\nconst|\nclass|$)/gm, '')
    // Remove generic type params from function calls like useState<string>
    .replace(/<[A-Z][A-Za-z<>\[\]|&,\s]*>/g, '')
    // Remove return type annotations: ): ReturnType {
    .replace(/\):\s*[A-Za-z<>\[\]|&,\s]+(?=\s*\{)/g, ') ')
    // Remove parameter type annotations: (param: Type)
    .replace(/(\w+)\s*\?\s*:\s*[A-Za-z<>\[\]|&.,\s|'"]+(?=[,)=])/g, '$1')
    .replace(/(\w+)\s*:\s*[A-Za-z<>\[\]|&.,\s|'"]+(?=[,)=])/g, '$1')
    // Remove const/let type annotations: const x: Type =
    .replace(/(const|let|var)\s+(\w+)\s*:\s*[A-Za-z<>\[\]|&,\s]+\s*=/g, '$1 $2 =')
    .trim();
}

function buildSandpackFiles(files: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {
    '/react-native.js': { code: RN_SHIM } as any,
    '/react-native-safe-area-context.js': { code: SAFE_AREA_SHIM } as any,
    '/expo-status-bar.js': { code: `export const StatusBar = () => null;` } as any,
    '/vector-icons.js': { code: `import React from 'react';\nexport const Ionicons = ({ color, size, style }) => <span style={{ color, fontSize: size, display: 'inline-block', lineHeight: 1, ...style }}>💠</span>;\nexport const MaterialIcons = Ionicons;\nexport const FontAwesome = Ionicons;\nexport const Feather = Ionicons;` } as any,
  };

  // Collect all files (components, constants, screens)
  const screens: { route: string; name: string; path: string }[] = [];

  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    if (path.startsWith('.') || path.endsWith('.png') || path.endsWith('.jpg')) continue;
    if (['package.json', 'app.json', 'tsconfig.json', 'babel.config.js'].includes(path)) continue;

    // Track tab screens for the navigator
    const match = path.match(/^app\/\(tabs\)\/(.+)\.(tsx|ts|js|jsx)$/);
    if (match && match[1] !== '_layout') {
      const route = match[1];
      const name = route === 'index' ? 'Home' : route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, ' ');
      screens.push({ route, name, path: '/' + path.replace(/\.(tsx|ts|jsx)$/, '.js') });
    }

    // Skip Expo Router layout files as we use a custom App.js
    if (path.includes('_layout')) continue;

    const jsPath = '/' + path.replace(/\.(tsx|ts|jsx)$/, '.js');
    let code = content
      // Remove all Expo Router imports gracefully without deleting the rest of the line unecessarily
      .replace(/import\s+.*?from\s+['"]expo-router['"];?\n?/gm, '')
      // Some components might use Link from expo-router, we'll replace it with a dummy Fragment or TouchableOpacity
      .replace(/<Link\b[^>]*>/g, '<TouchableOpacity>')
      .replace(/<\/Link>/g, '</TouchableOpacity>')
      
      // Fix paths and shims
      .replace(/@\//g, '../'.repeat(path.split('/').length - 1 || 1))
      .replace(/from\s+['"]react-native-safe-area-context['"]/g, "from 'react-native-safe-area-context'")
      .replace(/from\s+['"]react-native['"]/g, "from 'react-native'")
      .replace(/from\s+['"]@expo\/vector-icons['"]/g, "from 'vector-icons'")
      .replace(/from\s+['"]lucide-react-native['"]/g, "from 'vector-icons'")
      .replace(/from\s+['"]expo-status-bar['"]/g, "from 'expo-status-bar'");

    // For any remaining file, rewrite import paths that point to our shims so Sandpack resolves them from root.
    // e.g., 'react-native' -> '/react-native.js'
    code = code.replace(/from\s+['"](react-native|react-native-safe-area-context|vector-icons|expo-status-bar)['"]/g, "from '/$1.js'");

    result[jsPath] = { code: stripTypes(code) } as any;
  }

  // Fallback styling
  const [colors] = (() => {
    const c: Record<string, string> = {
      primary: '#6C3DE8', background: '#0f172a', surface: '#1e293b',
      border: '#334155', text: '#f1f5f9', textMuted: '#94a3b8', tabBar: '#0a1628',
    };
    const cf = files['constants/Colors.ts'] || files['constants/colors.ts'] || '';
    for (const m of cf.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g)) c[m[1]] = m[2];
    return [c];
  })();

  const iconMap: Record<string, string> = {
    home: '🏠', explore: '🔍', profile: '👤', account: '👤', settings: '⚙️',
    chat: '💬', feed: '📰', search: '🔍', favorites: '❤️', cart: '🛒',
    orders: '📦', notifications: '🔔', wallet: '💳', analytics: '📊', dashboard: '📊',
  };
  function getEmoji(route: string) {
    for (const [k, v] of Object.entries(iconMap)) if (route.toLowerCase().includes(k)) return v;
    return '📱';
  }

  // Build the unified App.js
  const screenImports = screens.map((s, i) => `import Screen${i} from '.${s.path}';`).join('\n');
  const fallbackScreen = `const Fallback = () => <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, backgroundColor:'${colors.background}' }}><span style={{ fontSize:48 }}>📱</span><span style={{ color:'${colors.text}', fontSize:22 }}>App Preview</span></div>;`;

  const appJs = `import React, { useState } from 'react';
${screenImports}
${screens.length === 0 ? fallbackScreen : ''}

// Global reset & styling
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } body { margin: 0; background: ${colors.background}; } #root { height: 100vh; display: flex; flex-direction: column; overflow: hidden; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 4px; }';
document.head.appendChild(style);

const TABS = [${screens.length > 0 
  ? screens.map((s, i) => `{ name: '${s.name}', comp: Screen${i}, icon: '${getEmoji(s.route)}' }`).join(', ')
  : `{ name: 'Home', comp: Fallback, icon: '🏠' }`}];

export default function App() {
  const [active, setActive] = useState(0);
  const Screen = TABS[active]?.comp || TABS[0].comp;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', backgroundColor:'${colors.background}', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Screen />
      </div>
      <div style={{ display:'flex', backgroundColor:'${colors.tabBar || colors.background}', borderTop:'1px solid ${colors.border}', padding:'8px 0 12px', flexShrink: 0 }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 0' }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:10, fontWeight:600, color: active === i ? '${colors.primary}' : '${colors.textMuted}' }}>{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
`;

  result['/App.js'] = { code: appJs } as any;
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AppPreview({ projectId, projectName, files }: AppPreviewProps) {
  const [key, setKey] = useState(0);

  const sandpackFiles = useMemo(() => buildSandpackFiles(files), [files, key]);

  if (!files || Object.keys(files).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No files to preview
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#030812]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 flex-shrink-0 bg-[#060d1a] border-b border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Monitor size={13} />
          <span className="font-semibold text-slate-200">Live Preview</span>
          <span className="text-slate-600">· powered by Sandpack</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setKey(k => k + 1)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Reload Preview"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Sandpack Preview */}
      <div className="flex-1 overflow-hidden [&_.sp-layout]:!h-full [&_.sp-preview]:!h-full [&_.sp-preview-iframe]:!h-full">
        <Sandpack
          key={key}
          files={sandpackFiles}
          template="react"
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showInlineErrors: true,
            visibleFiles: ['/App.js'],
            activeFile: '/App.js',
            layout: 'preview',
          }}
          customSetup={{
            dependencies: {
              react: '18.2.0',
              'react-dom': '18.2.0',
            },
            entry: '/App.js',
          }}
          theme="dark"
        />
      </div>
    </div>
  );
}
