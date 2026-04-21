import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function transformScreenCode(code: string): string {
  // Remove TypeScript type imports
  code = code.replace(/^import\s+type\s+.*;\n?/gm, '');
  // Remove expo-router imports
  code = code.replace(/import\s+.*?from\s+['"]expo-router['"].*\n?/gm, '');
  // Remap RN and known imports
  const remap = [
    [/import\s+React(?:,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?/gm, (_: string, named: string) =>
      `const React = window.React; ${named ? `const { ${named.trim()} } = window.React;` : ''}`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.React;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]react-native-safe-area-context['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]expo-status-bar['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]@expo\/vector-icons['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]expo-linear-gradient['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]react-native-chart-kit['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
    [/import\s+\{([^}]+)\}\s+from\s+['"]react-native-reanimated['"];?/gm, (_: string, n: string) => `const { ${n.trim()} } = window.__RN__;`],
  ] as const;
  for (const [pattern, replacer] of remap) {
    code = code.replace(pattern as RegExp, replacer as any);
  }
  // Remove any leftover third-party imports (non-relative)
  code = code.replace(/^import\s+.*?from\s+['"][^.\/][^'"]*['"];?\n?/gm, '// [removed import]\n');
  // Remove relative imports (other local files)
  code = code.replace(/^import\s+.*?from\s+['"][./][^'"]*['"];?\n?/gm, '// [removed relative import]\n');
  // Strip TypeScript generics from hooks
  code = code.replace(/\b(useState|useRef|useCallback|useMemo|createContext)\s*<[^>]+>/g, '$1');
  // Strip variable type annotations
  code = code.replace(/(const|let|var)\s+(\w+)\s*:\s*[\w<>[\]|&, ]+\s*=/g, '$1 $2 =');
  // Strip interface/type declarations
  code = code.replace(/^(export\s+)?(interface|type)\s+\w[\s\S]*?(?=\n\n|\nexport|\nfunction|\nconst|\nclass|$)/gm, '');
  // Strip function return type annotations
  code = code.replace(/\)\s*:\s*(?:React\.)?[\w<>[\]|& ]+(\s*\{)/g, ')$1');
  // Strip param type annotations  
  code = code.replace(/(\w+)\s*\?\s*:\s*[\w<>[\]|& ,'"[\]]+(?=[,)])/g, '$1');
  code = code.replace(/(\w+)\s*:\s*[\w<>[\]|& ,'"[\]]+(?=[,)])/g, '$1');
  // Replace Link with TouchableOpacity
  code = code.replace(/<Link\b[^>]*>/g, '<TouchableOpacity>').replace(/<\/Link>/g, '</TouchableOpacity>');
  // Convert export default function Name → function Name
  code = code.replace(/^export\s+default\s+function\s+(\w+)/m, 'function $1');
  code = code.replace(/^export\s+default\s+/m, '// export default ');
  // Strip remaining named exports
  code = code.replace(/^export\s+(?=const|function|class)/gm, '');
  return code;
}

function buildHTML(files: Record<string, string>, projectName: string): string {
  // Parse colors
  const cf = files['constants/Colors.ts'] || files['constants/colors.ts'] || '';
  const colors: Record<string, string> = {
    background: '#0f172a', primary: '#6C3DE8', text: '#f1f5f9',
    textMuted: '#94a3b8', border: '#334155', surface: '#1e293b', tabBar: '#0a1628',
  };
  for (const m of cf.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g)) colors[m[1]] = m[2];

  const iconMap: Record<string, string> = {
    home: '🏠', index: '🏠', explore: '🔍', profile: '👤', settings: '⚙️', chat: '💬',
    feed: '📰', search: '🔍', favorites: '❤️', cart: '🛒', orders: '📦',
    notifications: '🔔', wallet: '💳', analytics: '📊', dashboard: '📊',
    progress: '📈', workout: '💪', calorie: '🍎', logger: '📝',
  };
  function getEmoji(route: string) {
    for (const [k, v] of Object.entries(iconMap)) if (route.toLowerCase().includes(k)) return v;
    return '📱';
  }

  // Find tab screens
  const screens: { name: string; varName: string; code: string }[] = [];
  for (const [path, content] of Object.entries(files)) {
    const m = path.match(/^app\/\(tabs\)\/(.+)\.(tsx|ts|js|jsx)$/);
    if (!m || m[1] === '_layout') continue;
    const route = m[1];
    const name = route === 'index' ? 'Home' : route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, ' ');
    const varName = `Screen_${route.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const transformed = transformScreenCode(content);
    // Extract the default export function name from original code
    const fnMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const defaultFn = fnMatch ? fnMatch[1] : null;
    screens.push({ name, varName, code: transformed + (defaultFn ? `\nconst ${varName} = ${defaultFn};` : `\nconst ${varName} = () => React.createElement('div', {style:{padding:20,color:'${colors.text}'}}, '${name}');`) });
  }

  const tabsArray = screens.length > 0
    ? screens.map(s => `{ name: "${s.name}", icon: "${getEmoji(s.name.toLowerCase())}", comp: ${s.varName} }`).join(',\n    ')
    : `{ name: "Home", icon: "🏠", comp: () => React.createElement('div', {style:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:20}}, React.createElement('span',{style:{fontSize:64}},'📱'), React.createElement('span',{style:{color:'${colors.text}',fontSize:22,fontWeight:700}},'${projectName}')) }`;

  const allScreenCode = screens.map(s => `// ── ${s.name} ──\n${s.code}`).join('\n\n');

  const RN_SHIM = `
const React = window.React;
const { useState, useEffect, useRef, useCallback, useMemo } = React;
function makeStyle(s){if(!s)return{};if(Array.isArray(s))return Object.assign({},...s.map(makeStyle));return s;}
const StyleSheet={create:s=>s,flatten:makeStyle,absoluteFillObject:{position:'absolute',top:0,left:0,right:0,bottom:0}};
const Platform={OS:'web',select:obj=>obj.web??obj.default};
const Dimensions={get:()=>({width:window.innerWidth,height:window.innerHeight}),addEventListener:()=>({remove:()=>{}})};
function View({style,children,...p}){return<div style={{display:'flex',flexDirection:'column',boxSizing:'border-box',...makeStyle(style)}} {...p}>{children}</div>}
function ScrollView({style,contentContainerStyle,children,horizontal,...p}){const s={display:'flex',flexDirection:horizontal?'row':'column',overflowY:horizontal?'hidden':'auto',overflowX:horizontal?'auto':'hidden',boxSizing:'border-box',...makeStyle(style)};return<div style={s} {...p}><div style={{display:'flex',flexDirection:horizontal?'row':'column',...makeStyle(contentContainerStyle)}}>{children}</div></div>}
function Text({style,children,numberOfLines,...p}){const s={fontFamily:'system-ui,sans-serif',color:'${colors.text}',...makeStyle(style)};if(numberOfLines===1){s.whiteSpace='nowrap';s.overflow='hidden';s.textOverflow='ellipsis';}return<span style={s} {...p}>{children}</span>}
function TouchableOpacity({style,onPress,disabled,children,...p}){return<div role="button" onClick={disabled?undefined:onPress} style={{cursor:disabled?'default':'pointer',opacity:disabled?0.5:1,display:'flex',flexDirection:'column',boxSizing:'border-box',...makeStyle(style)}} {...p}>{children}</div>}
const Pressable=TouchableOpacity;
function TextInput({style,placeholder,value,onChangeText,multiline,secureTextEntry,...p}){const s={fontFamily:'system-ui,sans-serif',outline:'none',border:'none',background:'transparent',color:'inherit',width:'100%',...makeStyle(style)};const c={style:s,placeholder,value:value??'',onChange:e=>onChangeText?.(e.target.value),...p};return multiline?<textarea rows={4} {...c}/>:<input type={secureTextEntry?'password':'text'} {...c}/>;}
function Switch({value,onValueChange,trackColor,thumbColor}){const bg=value?(trackColor?.true||'${colors.primary}'):(trackColor?.false||'#334155');return<div onClick={()=>onValueChange?.(!value)} style={{width:44,height:24,borderRadius:12,backgroundColor:bg,cursor:'pointer',position:'relative',transition:'background 0.2s'}}><div style={{position:'absolute',top:2,left:value?22:2,width:20,height:20,borderRadius:10,backgroundColor:thumbColor||'#fff',transition:'left 0.2s'}}/></div>}
function Image({source,style,resizeMode,...p}){const src=typeof source==='object'?source?.uri:source;return<img src={src} style={{objectFit:resizeMode||'cover',...makeStyle(style)}} {...p}/>}
function FlatList({data,renderItem,keyExtractor,style,horizontal,ListEmptyComponent,ListHeaderComponent}){return<div style={{display:'flex',flexDirection:horizontal?'row':'column',overflowY:horizontal?'hidden':'auto',overflowX:horizontal?'auto':'hidden',...makeStyle(style)}}>{ListHeaderComponent||null}{data&&data.length>0?data.map((item,i)=><React.Fragment key={keyExtractor?keyExtractor(item,i):i}>{renderItem({item,index:i})}</React.Fragment>):(ListEmptyComponent||null)}</div>}
function ActivityIndicator({color,size}){return<div style={{width:size==='large'?36:20,height:size==='large'?36:20,border:\`3px solid \${color||'${colors.primary}'}33\`,borderTop:\`3px solid \${color||'${colors.primary}'}\`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>}
function SafeAreaView({style,children,...p}){return<div style={{display:'flex',flexDirection:'column',flex:1,boxSizing:'border-box',...makeStyle(style)}} {...p}>{children}</div>}
const SafeAreaProvider=({children})=>children;
function Modal({visible,children,transparent}){if(!visible)return null;return<div style={{position:'fixed',inset:0,zIndex:999,backgroundColor:transparent?'transparent':'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center'}}>{children}</div>}
function KeyboardAvoidingView({style,children,...p}){return<div style={{display:'flex',flexDirection:'column',...makeStyle(style)}} {...p}>{children}</div>}
const StatusBar=()=>null;
const LinearGradient=({colors:c,style,children,...p})=><div style={{background:c?\`linear-gradient(180deg,\${c.join(',')})\`:'transparent',display:'flex',flexDirection:'column',...makeStyle(style)}} {...p}>{children}</div>;
const Ionicons=({color,size,name})=><span style={{color,fontSize:size,display:'inline-block',lineHeight:1}}>★</span>;
const MaterialIcons=Ionicons,FontAwesome=Ionicons,Feather=Ionicons,AntDesign=Ionicons;
const LineChart=({width,height})=><div style={{width:width||300,height:height||200,background:'#1e293b',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:13}}>📊 Chart</div>;
const BarChart=LineChart,PieChart=LineChart,ProgressChart=LineChart;
const Animated={Value:class{constructor(v){this._v=v;}},View,Text,timing:()=>({start:cb=>cb?.()}),spring:()=>({start:cb=>cb?.()}),parallel:a=>({start:cb=>{a.forEach(x=>x.start());cb?.();}}),createAnimatedComponent:C=>C};
const useSharedValue=v=>({value:v}),useAnimatedStyle=()=>({}),withTiming=v=>v,withSpring=v=>v;
const useColorScheme=()=>'dark';
const useNavigation=()=>({navigate:()=>{},goBack:()=>{}});
const useRoute=()=>({params:{}});
window.__RN__={View,ScrollView,Text,TouchableOpacity,Pressable,TextInput,Switch,Image,FlatList,ActivityIndicator,SafeAreaView,SafeAreaProvider,Modal,KeyboardAvoidingView,StyleSheet,Platform,Dimensions,Animated,StatusBar,LinearGradient,Ionicons,MaterialIcons,FontAwesome,Feather,AntDesign,LineChart,BarChart,PieChart,ProgressChart,useSharedValue,useAnimatedStyle,withTiming,withSpring,useColorScheme,useNavigation,useRoute};
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <title>${projectName}</title>
  <style>
    @keyframes spin{to{transform:rotate(360deg)}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    body{margin:0;background:${colors.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100vh;overflow:hidden;color:${colors.text}}
    #root{height:100vh;display:flex;flex-direction:column;overflow:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${colors.border};border-radius:4px}
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
<div id="root"><div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">Loading…</div></div>
<script type="text/babel">
${RN_SHIM}

// ════════ Screen Components ════════
${allScreenCode}

// ════════ App Shell ════════
const TABS = [
  ${tabsArray}
];

function App() {
  const [active, setActive] = React.useState(0);
  const Tab = TABS[active]?.comp || TABS[0].comp;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'${colors.background}',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
        {(() => { try { return <Tab />; } catch(e) { return <div style={{padding:20,color:'#ef4444',fontFamily:'monospace',fontSize:12,whiteSpace:'pre-wrap'}}>{'Screen Error:\\n'+e.toString()}</div>; } })()}
      </div>
      {TABS.length > 1 && (
        <div style={{display:'flex',background:'${colors.tabBar || colors.background}',borderTop:'1px solid ${colors.border}',padding:'8px 0 env(safe-area-inset-bottom,12px)',flexShrink:0}}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActive(i)} style={{flex:1,background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'4px 0',color:active===i?'${colors.primary}':'${colors.textMuted}',fontSize:10,fontWeight:600}}>
              <span style={{fontSize:22}}>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
</script>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    return new NextResponse('<html><body style="background:#0f172a;color:#ef4444;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h2>Project not found</h2></body></html>', {
      status: 404, headers: { 'Content-Type': 'text/html' },
    });
  }

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
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
