import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildDebugPage(projectName: string, files: Record<string, string>): string {
  const paths = Object.keys(files).sort().map(p => `<li>${p}</li>`).join('');
  return `<!DOCTYPE html><html><body style="background:#0f172a;color:#f1f5f9;font-family:monospace;padding:20px">
<h2>${projectName} — ${Object.keys(files).length} files</h2><ul>${paths}</ul></body></html>`;
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
    home: '🏠', index: '🏠', explore: '🔍', profile: '👤', settings: '⚙️',
    chat: '💬', feed: '📰', search: '🔍', favorites: '❤️', cart: '🛒',
    orders: '📦', notifications: '🔔', wallet: '💳', analytics: '📊',
    dashboard: '📊', progress: '📈', workout: '💪', calorie: '🍎', logger: '📝',
  };
  function getEmoji(s: string) {
    for (const [k, v] of Object.entries(iconMap)) if (s.toLowerCase().includes(k)) return v;
    return '📱';
  }

  // Find screens under app/(tabs)/
  const screens: { name: string; emoji: string }[] = [];
  for (const path of Object.keys(files)) {
    const m = path.match(/^app\/\(tabs\)\/(.+)\.(tsx|ts|js|jsx)$/);
    if (!m || m[1] === '_layout') continue;
    const route = m[1];
    const name = route === 'index' ? 'Home' : route.charAt(0).toUpperCase() + route.slice(1).replace(/[-_]/g, ' ');
    screens.push({ name, emoji: getEmoji(route) });
  }

  // Extract app description from the prompt-style files
  const readmeContent = files['README.md'] || '';
  const promptHint = readmeContent.slice(0, 200);

  // Build the tab data as JSON string - safe, no code execution issues
  const tabsJSON = JSON.stringify(
    screens.length > 0 ? screens : [{ name: 'Home', emoji: '🏠' }]
  );

  // Pull color constants as JSON
  const colorsJSON = JSON.stringify(colors);

  // Build a screen summary from file names only (safe - no code execution, no Babel)
  const screenSummaries = screens.map(s => `
    { name: "${s.name}", emoji: "${s.emoji}" }
  `).join(',');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <title>${projectName}</title>
  <style>
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; margin:0; padding:0; }
    body { background:${colors.background}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; height:100vh; overflow:hidden; color:${colors.text}; }
    #app { height:100vh; display:flex; flex-direction:column; overflow:hidden; }
    #screen { flex:1; overflow-y:auto; padding:0; animation:fadeIn 0.3s ease; }
    #tabs { display:flex; background:${colors.tabBar}; border-top:1px solid ${colors.border}; padding:8px 0 max(12px, env(safe-area-inset-bottom)); flex-shrink:0; }
    .tab { flex:1; background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px 0; color:${colors.textMuted}; font-size:10px; font-weight:600; font-family:inherit; transition:color 0.2s; }
    .tab.active { color:${colors.primary}; }
    .tab-icon { font-size:22px; line-height:1.2; }
    .screen-card { background:${colors.surface}; border-radius:16px; margin:12px; padding:20px; border:1px solid ${colors.border}; animation:fadeIn 0.3s ease; }
    .screen-title { font-size:22px; font-weight:700; color:${colors.text}; margin-bottom:6px; }
    .screen-sub { font-size:13px; color:${colors.textMuted}; line-height:1.5; }
    .pill { display:inline-flex; align-items:center; gap:6px; background:${colors.primary}22; color:${colors.primary}; border:1px solid ${colors.primary}44; border-radius:20px; padding:4px 12px; font-size:11px; font-weight:600; margin:4px 4px 0 0; }
    .header { display:flex; align-items:center; gap:12px; padding:16px; background:${colors.surface}; border-bottom:1px solid ${colors.border}; flex-shrink:0; }
    .header-icon { font-size:32px; }
    .header-title { font-size:17px; font-weight:700; color:${colors.text}; }
    .header-sub { font-size:11px; color:${colors.textMuted}; margin-top:2px; }
    .row { display:flex; gap:10px; margin:0 12px 0; flex-wrap:wrap; }
    .stat-card { flex:1; min-width:120px; background:${colors.surface}; border-radius:12px; padding:16px; border:1px solid ${colors.border}; animation:fadeIn 0.3s ease; }
    .stat-val { font-size:28px; font-weight:800; color:${colors.primary}; }
    .stat-label { font-size:11px; color:${colors.textMuted}; margin-top:2px; }
    .list-item { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid ${colors.border}22; }
    .list-icon { font-size:24px; }
    .list-title { font-size:14px; font-weight:600; color:${colors.text}; }
    .list-sub { font-size:12px; color:${colors.textMuted}; margin-top:2px; }
    .btn { display:flex; align-items:center; justify-content:center; padding:14px; background:${colors.primary}; border-radius:12px; color:#fff; font-weight:700; font-size:14px; border:none; cursor:pointer; margin:12px; width:calc(100% - 24px); }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:${colors.border}; border-radius:4px; }
  </style>
</head>
<body>
<div id="app">
  <div id="screen"></div>
  <div id="tabs"></div>
</div>

<script>
// ─── Safe pure-JS app (no Babel, no JSX) ─────────────────────────────────────

const COLORS = ${colorsJSON};
const APP_NAME = ${JSON.stringify(projectName)};
const TABS = ${tabsJSON};

// Screen content generators - one per tab, fully safe vanilla JS
function makeEl(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'onClick') el.addEventListener('click', v);
    else if (k === 'className') el.className = v;
    else el.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (c == null) return;
    el.append(typeof c === 'string' ? c : c);
  });
  return el;
}

const screenDefs = [${screenSummaries}];

function buildScreen(tab, idx) {
  const wrap = makeEl('div', {});

  // Header
  const header = makeEl('div', { className: 'header' });
  header.append(
    makeEl('div', { className: 'header-icon' }, tab.emoji),
    (() => {
      const t = makeEl('div');
      t.append(
        makeEl('div', { className: 'header-title' }, tab.name),
        makeEl('div', { className: 'header-sub' }, APP_NAME + ' · Live Preview')
      );
      return t;
    })()
  );
  wrap.append(header);

  // Stat cards row
  const statData = [
    { val: '24', label: 'Today' },
    { val: '142', label: 'This Week' },
    { val: '98%', label: 'Progress' },
  ];
  const row = makeEl('div', { className: 'row', style: { marginTop: '12px' } });
  statData.forEach(s => {
    const card = makeEl('div', { className: 'stat-card' });
    card.append(
      makeEl('div', { className: 'stat-val' }, s.val),
      makeEl('div', { className: 'stat-label' }, s.label)
    );
    row.append(card);
  });
  wrap.append(row);

  // Main card
  const card = makeEl('div', { className: 'screen-card' });
  card.append(
    makeEl('div', { className: 'screen-title' }, tab.name + ' Screen'),
    makeEl('div', { className: 'screen-sub', style: { margin: '8px 0 12px' } },
      'This is the ' + tab.name + ' section of ' + APP_NAME + '. The full AI-generated React Native code for this screen is ready to download.'
    )
  );

  // Feature pills
  const pills = ['Interactive UI', 'Dark Mode', 'Responsive', 'Mobile First'];
  const pillRow = makeEl('div', { style: { display: 'flex', flexWrap: 'wrap' } });
  pills.forEach(p => pillRow.append(makeEl('div', { className: 'pill' }, p)));
  card.append(pillRow);
  wrap.append(card);

  // List items
  const items = ['Dashboard Overview', 'Recent Activity', 'Quick Actions', 'Statistics & Reports'];
  items.forEach((item, i) => {
    const li = makeEl('div', { className: 'list-item' });
    li.append(
      makeEl('div', { className: 'list-icon' }, ['📊','⚡','🎯','📈'][i]),
      (() => {
        const d = makeEl('div');
        d.append(
          makeEl('div', { className: 'list-title' }, item),
          makeEl('div', { className: 'list-sub' }, 'Tap to explore this feature')
        );
        return d;
      })()
    );
    wrap.append(li);
  });

  // CTA button
  wrap.append(
    makeEl('button', { className: 'btn' }, tab.emoji + ' Open ' + tab.name)
  );

  return wrap;
}

// ─── Render ───────────────────────────────────────────────────────────────────
let activeTab = 0;
const screenEl = document.getElementById('screen');
const tabsEl = document.getElementById('tabs');

function renderScreen() {
  screenEl.innerHTML = '';
  screenEl.scrollTop = 0;
  screenEl.append(buildScreen(TABS[activeTab], activeTab));
}

function renderTabs() {
  tabsEl.innerHTML = '';
  TABS.forEach((tab, i) => {
    const btn = makeEl('button', {
      className: 'tab' + (i === activeTab ? ' active' : ''),
      onClick: () => { activeTab = i; renderScreen(); renderTabs(); }
    },
      makeEl('span', { className: 'tab-icon' }, tab.emoji),
      makeEl('span', {}, tab.name)
    );
    tabsEl.append(btn);
  });
}

renderScreen();
if (TABS.length > 1) renderTabs();
else tabsEl.style.display = 'none';

console.log('${projectName} preview loaded. Tabs:', TABS.length);
</script>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const debug = request.nextUrl.searchParams.get('debug') === '1';

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    return new NextResponse(
      '<html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><h2>Project not found</h2></body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const files: Record<string, string> = project.files || {};

  if (debug) {
    return new NextResponse(buildDebugPage(project.name, files), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (Object.keys(files).length === 0) {
    return new NextResponse(
      `<html><body style="background:#0f172a;color:#f59e0b;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px"><h2>⏳ Generating...</h2><p>Refresh in a few seconds.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const html = buildHTML(files, project.name);
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
