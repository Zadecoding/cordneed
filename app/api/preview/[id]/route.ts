import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── React Native → HTML shim (inline, no bundler) ────────────────────────────
const RN_SHIM_JS = `
const React = window.React;
const { useState, useEffect, useRef, useCallback, useMemo } = React;

function makeStyle(s) {
  if (!s) return {};
  if (Array.isArray(s)) return Object.assign({}, ...s.map(makeStyle));
  return s;
}

const StyleSheet = { create: s => s, flatten: makeStyle, absoluteFillObject: { position:'absolute',top:0,left:0,right:0,bottom:0 } };
const Platform = { OS: 'web', select: obj => obj.web ?? obj.default };
const Dimensions = { get: () => ({ width: window.innerWidth, height: window.innerHeight }), addEventListener: () => ({ remove: () => {} }) };

function View({ style, children, ...p }) {
  return React.createElement('div', { style: { display:'flex', flexDirection:'column', boxSizing:'border-box', ...makeStyle(style) }, ...p }, children);
}
function ScrollView({ style, contentContainerStyle, children, horizontal, ...p }) {
  const s = { display:'flex', flexDirection: horizontal?'row':'column', overflowY: horizontal?'hidden':'auto', overflowX: horizontal?'auto':'hidden', boxSizing:'border-box', ...makeStyle(style) };
  return React.createElement('div', { style: s, ...p }, React.createElement('div', { style: { display:'flex', flexDirection: horizontal?'row':'column', ...makeStyle(contentContainerStyle) } }, children));
}
function Text({ style, children, numberOfLines, ...p }) {
  const s = { fontFamily:'system-ui,sans-serif', color:'#f1f5f9', ...makeStyle(style) };
  if (numberOfLines === 1) { s.whiteSpace = 'nowrap'; s.overflow = 'hidden'; s.textOverflow = 'ellipsis'; }
  return React.createElement('span', { style: s, ...p }, children);
}
function TouchableOpacity({ style, onPress, disabled, children, ...p }) {
  return React.createElement('div', { role:'button', onClick: disabled ? undefined : onPress, style: { cursor: disabled?'default':'pointer', opacity: disabled?0.5:1, display:'flex', flexDirection:'column', boxSizing:'border-box', ...makeStyle(style) }, ...p }, children);
}
const Pressable = TouchableOpacity;
function TextInput({ style, placeholder, value, onChangeText, multiline, secureTextEntry, ...p }) {
  const s = { fontFamily:'system-ui,sans-serif', outline:'none', border:'none', background:'transparent', color:'inherit', width:'100%', ...makeStyle(style) };
  const common = { style: s, placeholder, value: value ?? '', onChange: e => onChangeText?.(e.target.value), ...p };
  return multiline ? React.createElement('textarea', { rows:4, ...common }) : React.createElement('input', { type: secureTextEntry?'password':'text', ...common });
}
function Switch({ value, onValueChange, trackColor, thumbColor }) {
  const bg = value ? (trackColor?.true || '#6C3DE8') : (trackColor?.false || '#334155');
  return React.createElement('div', { onClick: () => onValueChange?.(!value), style: { width:44, height:24, borderRadius:12, backgroundColor:bg, cursor:'pointer', position:'relative', transition:'background 0.2s' } },
    React.createElement('div', { style: { position:'absolute', top:2, left: value?22:2, width:20, height:20, borderRadius:10, backgroundColor: thumbColor||'#fff', transition:'left 0.2s' } })
  );
}
function Image({ source, style, resizeMode, ...p }) {
  const src = typeof source === 'object' ? source?.uri : source;
  return React.createElement('img', { src, style: { objectFit: resizeMode||'cover', ...makeStyle(style) }, ...p });
}
function FlatList({ data, renderItem, keyExtractor, style, horizontal, ListEmptyComponent, ListHeaderComponent }) {
  return React.createElement('div', { style: { display:'flex', flexDirection: horizontal?'row':'column', overflowY: horizontal?'hidden':'auto', overflowX: horizontal?'auto':'hidden', ...makeStyle(style) } },
    ListHeaderComponent || null,
    data && data.length > 0 ? data.map((item, index) => React.createElement(React.Fragment, { key: keyExtractor ? keyExtractor(item, index) : index }, renderItem({ item, index }))) : (ListEmptyComponent || null)
  );
}
function ActivityIndicator({ color, size }) {
  return React.createElement('div', { style: { width: size==='large'?36:20, height: size==='large'?36:20, border: \`3px solid \${color||'#6C3DE8'}33\`, borderTop: \`3px solid \${color||'#6C3DE8'}\`, borderRadius:'50%', animation:'spin 0.8s linear infinite' } });
}
function SafeAreaView({ style, children, ...p }) {
  return React.createElement('div', { style: { display:'flex', flexDirection:'column', flex:1, boxSizing:'border-box', ...makeStyle(style) }, ...p }, children);
}
function Modal({ visible, children, transparent, onRequestClose }) {
  if (!visible) return null;
  return React.createElement('div', { style: { position:'fixed', inset:0, zIndex:999, backgroundColor: transparent?'transparent':'#000', display:'flex', alignItems:'center', justifyContent:'center' } }, children);
}
function KeyboardAvoidingView({ style, children, ...p }) {
  return React.createElement('div', { style: { display:'flex', flexDirection:'column', ...makeStyle(style) }, ...p }, children);
}
const StatusBar = () => null;
const SafeAreaProvider = ({ children }) => children;
const LinearGradient = ({ colors, style, children }) => React.createElement('div', { style: { background: colors ? \`linear-gradient(180deg, \${colors.join(',')})\` : 'transparent', display:'flex', flexDirection:'column', ...makeStyle(style) } }, children);
const Ionicons = ({ color, size, name }) => React.createElement('span', { style: { color, fontSize: size, display:'inline-block' } }, '★');
const MaterialIcons = Ionicons;
const FontAwesome = Ionicons;
const Feather = Ionicons;
const LineChart = ({ width, height }) => React.createElement('div', { style: { width: width||'100%', height: height||200, background:'#1e293b', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' } }, '📊 Chart');
const BarChart = LineChart;
const PieChart = LineChart;
const Animated = {
  Value: class { constructor(v) { this._v = v; } },
  View, Text,
  timing: () => ({ start: cb => cb?.() }),
  spring: () => ({ start: cb => cb?.() }),
  parallel: a => ({ start: cb => { a.forEach(x => x.start()); cb?.(); } }),
  createAnimatedComponent: C => C,
};
const useSharedValue = v => ({ value: v });
const useAnimatedStyle = () => ({});
const withTiming = v => v;
const withSpring = v => v;
const useColorScheme = () => 'dark';
const useNavigation = () => ({ navigate: () => {}, goBack: () => {} });
const useRoute = () => ({ params: {} });

window.__RN__ = { View, ScrollView, Text, TouchableOpacity, Pressable, TextInput, Switch, Image, FlatList, ActivityIndicator, SafeAreaView, SafeAreaProvider, Modal, KeyboardAvoidingView, StyleSheet, Platform, Dimensions, Animated, StatusBar, LinearGradient, Ionicons, MaterialIcons, FontAwesome, Feather, LineChart, BarChart, PieChart, useSharedValue, useAnimatedStyle, withTiming, withSpring, useColorScheme, useNavigation, useRoute };
`;

function buildHTML(files: Record<string, string>, projectName: string): string {
  // Determine colors
  const cf = files['constants/Colors.ts'] || files['constants/colors.ts'] || '';
  const colorMatches = [...cf.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g)];
  const colors: Record<string, string> = {
    background: '#0f172a', primary: '#6C3DE8', text: '#f1f5f9',
    textMuted: '#94a3b8', border: '#334155', surface: '#1e293b', tabBar: '#0a1628',
  };
  for (const m of colorMatches) colors[m[1]] = m[2];

  // Find screens
  const screens: { name: string; path: string }[] = [];
  const iconMap: Record<string, string> = {
    home: '🏠', explore: '🔍', profile: '👤', settings: '⚙️', chat: '💬',
    feed: '📰', search: '🔍', favorites: '❤️', cart: '🛒', orders: '📦',
    notifications: '🔔', wallet: '💳', analytics: '📊', dashboard: '📊',
    progress: '📈', workout: '💪', calorie: '🍎',
  };
  function getEmoji(route: string) {
    for (const [k, v] of Object.entries(iconMap)) if (route.toLowerCase().includes(k)) return v;
    return '📱';
  }

  for (const path of Object.keys(files)) {
    const m = path.match(/^app\/\(tabs\)\/(.+)\.(tsx|ts|js|jsx)$/);
    if (m && m[1] !== '_layout') {
      const route = m[1];
      const name = route === 'index' ? 'Home' : route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, ' ');
      screens.push({ name, path });
    }
  }

  // Build screen modules — transform all screen files into browser-compatible JS
  function transformCode(code: string, filePath: string): string {
    // Remove TS imports
    code = code.replace(/^import\s+type\s+.*;\n?/gm, '');
    // Remove expo-router imports
    code = code.replace(/import\s+.*?from\s+['"]expo-router['"];?\n?/gm, '');
    // Remap known imports to window globals
    const remapImports = [
      [/import\s+(.*?)\s+from\s+['"]react['"];?\n?/gm, (m: string, p1: string) => `const ${p1.trim().replace(/^\{|\}$/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).reduce((a: string, n: string) => a + n + ', ', '').replace(/, $/, '')} = Object.assign({}, window.React, {useState, useEffect, useRef, useCallback, useMemo});\n`],
    ];
    // Replace all known RN imports with destructuring from window.__RN__
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native-safe-area-context['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]expo-status-bar['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]@expo\/vector-icons['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]expo-linear-gradient['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native-chart-kit['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native-reanimated['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.__RN__;`;
    });
    // Replace React import
    code = code.replace(/import\s+React(?:,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?/gm, (_, named) => {
      const namedPart = named ? `const { ${named.trim()} } = window.React;` : '';
      return `const React = window.React; ${namedPart}`;
    });
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/gm, (_, names) => {
      return `const { ${names.trim()} } = window.React;`;
    });
    // Remove other unknown third-party imports
    code = code.replace(/^import\s+.*?from\s+['"][^.\/][^'"]*['"];?\n?/gm, '// [shimmed import removed]\n');
    // Fix @/ path aliases to resolve from file modules
    code = code.replace(/from\s+['"]@\/([^'"]+)['"]/g, (_, p) => `/* @/${p} - local import */ // `);
    // Remove relative imports for other files (they'll be inlined separately)
    code = code.replace(/^import\s+.*?from\s+['"][.]{1,2}\/[^'"]*['"];?\n?/gm, '');
    // Remove TS generics from useState<X> etc.
    code = code.replace(/\b(useState|useRef|useCallback|useMemo|createContext)\s*<[^>]+>/g, '$1');
    // Remove type annotations on variables
    code = code.replace(/(const|let|var)\s+(\w+)\s*:\s*[\w<>[\]|&, ]+\s*=/g, '$1 $2 =');
    // Remove interface/type declarations
    code = code.replace(/^(export\s+)?(interface|type)\s+\w+[\s\S]*?(?=\n\n|\nexport|\nfunction|\nconst|\nclass|$)/gm, '');
    // Remove function return types
    code = code.replace(/\)\s*:\s*[\w<>[\]|& ]+(\s*\{)/g, ')$1');
    // Remove param type annotations
    code = code.replace(/(\w+)\s*\?\s*:\s*[\w<>[\]|& ,'"]+(?=[,)])/g, '$1');
    code = code.replace(/(\w+)\s*:\s*[\w<>[\]|& ,'"]+(?=[,)])/g, '$1');
    // Remove <Link> tags
    code = code.replace(/<Link\b[^>]*>/g, '<TouchableOpacity>').replace(/<\/Link>/g, '</TouchableOpacity>');
    // Convert export default to a module result
    code = code.replace(/^export\s+default\s+function\s+(\w+)/m, 'function $1');
    code = code.replace(/^export\s+default\s+/m, 'module.exports = ');
    // Convert named exports
    code = code.replace(/^export\s+(?:const|function|class)\s+/gm, '');
    return code;
  }

  // Build inline screen scripts
  const screenScripts = screens.map(({ name, path }, idx) => {
    const code = files[path] || '';
    const transformed = transformCode(code, path);
    return `<script type="text/babel" data-screen="${idx}" data-name="${name}">\n${transformed}\n</script>`;
  }).join('\n');

  // Build the tabs
  const tabsJson = screens.length > 0
    ? screens.map((s, i) => `{ name: "${s.name}", icon: "${getEmoji(s.name.toLowerCase())}", idx: ${i} }`).join(', ')
    : `{ name: "Home", icon: "🏠", idx: 0 }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${projectName} – Live Preview</title>
  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; background: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; color: ${colors.text}; }
    #root { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    #screen-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
    #tab-bar { display: flex; background: ${colors.tabBar || colors.background}; border-top: 1px solid ${colors.border}; padding: 8px 0 env(safe-area-inset-bottom, 12px); flex-shrink: 0; }
    .tab-btn { flex: 1; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px 0; color: ${colors.textMuted}; font-size: 10px; font-weight: 600; }
    .tab-btn.active { color: ${colors.primary}; }
    .tab-icon { font-size: 20px; }
    #error-box { padding: 20px; color: #ef4444; background: ${colors.background}; height: 100%; overflow: auto; font-family: monospace; white-space: pre-wrap; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 4px; }
  </style>
  <!-- React 18 + Babel Standalone for JSX in browser -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
<div id="root">
  <div id="screen-area"><div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:14px;">Loading…</div></div>
  <div id="tab-bar"></div>
</div>

<!-- React Native Shims -->
<script>${RN_SHIM_JS}</script>

<!-- Screen Code Files -->
${screenScripts}

<script type="text/babel">
const { useState, useEffect } = window.React;
const { View, Text, TouchableOpacity } = window.__RN__;

const TABS = [${tabsJson}];

// Collect screens rendered by each babel script
const screenComponents = window.__SCREENS__ || [];

function FallbackScreen() {
  return React.createElement('div', { style: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:20 } },
    React.createElement('span', { style: { fontSize:64 } }, '📱'),
    React.createElement('span', { style: { color:'#f1f5f9', fontSize:22, fontWeight:700, textAlign:'center' } }, '${projectName}'),
    React.createElement('span', { style: { color:'#94a3b8', fontSize:14, textAlign:'center' } }, 'Live Preview'),
  );
}

function App() {
  const [active, setActive] = useState(0);
  const Screen = screenComponents[active] || FallbackScreen;

  return React.createElement('div', { id: 'app-root', style: { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' } },
    React.createElement('div', { id: 'screen-area-inner', style: { flex:1, overflowY:'auto', display:'flex', flexDirection:'column' } },
      React.createElement(Screen)
    ),
    TABS.length > 1 && React.createElement('div', { id: 'tab-bar', style: { display:'flex', background:'${colors.tabBar || colors.background}', borderTop:'1px solid ${colors.border}', padding:'8px 0 12px', flexShrink:0 } },
      TABS.map((tab, i) => React.createElement('button', {
        key: i, className: 'tab-btn' + (active===i?' active':''), onClick: () => setActive(i),
        style: { flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 0', color: active===i ? '${colors.primary}' : '${colors.textMuted}', fontSize:10, fontWeight:600 }
      },
        React.createElement('span', { style: { fontSize:20 } }, tab.icon),
        React.createElement('span', null, tab.name)
      ))
    )
  );
}

const container = document.getElementById('screen-area');
container.innerHTML = '';
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
} catch(e) {
  document.getElementById('root').innerHTML = '<div id="error-box"><h2>Preview Error</h2>' + e.toString() + '</div>';
}
</script>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return new NextResponse('<h1>Project not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  }

  // Fetch files
  const { data: fileRows } = await supabase
    .from('project_files')
    .select('path, content')
    .eq('project_id', id);

  const files: Record<string, string> = {};
  for (const row of fileRows || []) {
    files[row.path] = row.content;
  }

  const html = buildHTML(files, project.name);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
