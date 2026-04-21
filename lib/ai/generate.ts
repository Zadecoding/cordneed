import { Mistral } from '@mistralai/mistralai';
import type { AppArchitecture } from './architect';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ─── Model config ─────────────────────────────────────────────────────────────
// mistral-small: faster (~15s), good for structured JSON output
// mistral-large: slower (~45s), better code quality
const PRIMARY_MODEL   = 'mistral-small-latest';
const FALLBACK_MODEL  = 'mistral-large-latest';
const PRIMARY_TIMEOUT = 50_000;
const FALLBACK_TIMEOUT = 58_000;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture,
  designLink?: string,
  designContent?: string
): string {
  const screens = architecture?.screens ?? ['Home', 'Profile', 'Settings'];
  const features = architecture?.features ?? ['navigation', 'authentication'];
  const appName = architecture?.suggestedName ?? 'MyApp';
  const colorTheme = architecture?.colorTheme ?? 'dark with purple accents';
  const primaryColor = architecture?.primaryColor ?? '#6C3DE8';

  const tabRoutes = screens.slice(0, 5).map((s, i) =>
    i === 0 ? 'index' : s.toLowerCase().replace(/\s+/g, '-')
  );

  let designSection = '';
  if (designLink) {
    if (designContent) {
      designSection = `\nDESIGN REFERENCE URL: ${designLink}\nExtracted Content from Design Link:\n"""\n${designContent}\n"""\n\nIMPORTANT: The user has shared a design reference above. You MUST replicate its layout, features, color palette, typography, navigation patterns, and component structure as closely as possible in the generated React Native code. The design reference is the PRIMARY guide for all UI decisions.`;
    } else {
      designSection = `\nDESIGN REFERENCE URL: ${designLink}\nIMPORTANT: The user has shared a design reference above. Study it and replicate its layout, color palette, spacing, typography, navigation patterns, and component structure as closely as possible in the generated React Native code. The design reference is the PRIMARY guide for all UI decisions.`;
    }
  }

  return `You are an expert React Native / Expo developer. Generate a COMPLETE multi-screen React Native Expo app as JSON.

USER REQUEST: "${prompt}"${designSection ? '\n' + designSection + '\n' : ''}

APP: ${appName} | Theme: ${colorTheme} (primary: ${primaryColor})
Screens: ${screens.join(', ')} | Features: ${features.join(', ')}

══════════════════════════════════════════════════
OUTPUT FORMAT — CRITICAL: READ EVERY WORD
══════════════════════════════════════════════════
Return ONLY a raw JSON object. No markdown. No backticks. No text before or after.
Start your response with { and end with }

The JSON keys are file paths. The JSON values are complete file contents as strings.
String values use \\n for newlines and \\" for quotes inside the string.

YOU MUST INCLUDE ALL OF THESE FILES:
- "package.json"
- "app.json"
- "tsconfig.json"
- "babel.config.js"
- ".gitignore"
- "app/_layout.tsx"
- "app/(tabs)/_layout.tsx"
${tabRoutes.map(r => `- "app/(tabs)/${r}.tsx"`).join('\n')}
- "components/ui/Button.tsx"
- "components/ui/Card.tsx"
- "constants/Colors.ts"

══════════════════════════════════════════════════
TECHNICAL REQUIREMENTS
══════════════════════════════════════════════════
1. Expo SDK ~51.0.0, expo-router ^3.5.0, React Native 0.74.5
2. TypeScript strict mode throughout
3. Use StyleSheet.create() everywhere — zero inline styles
4. Tab bar with @expo/vector-icons Ionicons icons (one icon per screen)
5. Primary color: ${primaryColor}. Background: #0f172a. Surface: #1e293b
6. Each screen: real content (lists, cards, inputs) — no placeholder text
7. app/_layout.tsx: Stack with StatusBar, headerShown: false
8. app/(tabs)/_layout.tsx: Tabs with tabBarStyle, all ${screens.slice(0,5).length} screens
9. package.json: include expo, expo-router, expo-status-bar, @expo/vector-icons, react-native-safe-area-context, react-native-screens
10. babel.config.js: module.exports = function(api) { api.cache(true); return { presets: ['babel-preset-expo'] }; }
${!isPro ? '11. Add "Built with Cordneed" text at bottom of Home screen' : ''}

Generate the complete app now. Start your response with { immediately.`;
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseModelOutput(raw: string, prompt: string): Record<string, string> {
  let text = raw.trim();

  // Strip markdown fences
  const jsonFence = text.match(/```json\s*([\s\S]*?)```/);
  const plainFence = text.match(/```\s*([\s\S]*?)```/);
  if (jsonFence) text = jsonFence[1].trim();
  else if (plainFence) text = plainFence[1].trim();

  // Slice from first { to last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      const codeFiles = keys.filter(k => k.endsWith('.tsx') || k.endsWith('.ts') || k.endsWith('.js'));
      console.log(`[AI] Parsed ${keys.length} files (${codeFiles.length} code files)`);
      if (codeFiles.length >= 3) return parsed as Record<string, string>;
      console.warn(`[AI] Only ${codeFiles.length} code files — output too thin, using fallback`);
    }
  } catch (e) {
    console.warn('[AI] JSON parse failed:', (e as Error).message?.slice(0, 100));
  }

  return generateFallbackTemplate(prompt);
}

// ─── Mistral caller ───────────────────────────────────────────────────────────

async function callMistral(
  model: string,
  systemPrompt: string,
  rawPrompt: string
): Promise<Record<string, string>> {
  console.log(`[AI] Mistral trying: ${model}`);

  const text = await mistral.chat
    .complete({
      model,
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.1,   // low temp = more JSON-consistent output
      maxTokens: 16000,
    })
    .then((r) => (r.choices?.[0]?.message?.content as string) ?? '');

  return parseModelOutput(text, rawPrompt);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchDesignContent(url: string): Promise<string> {
  console.log(`[AI] Fetching design content from: ${url}`);
  try {
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      method: "GET",
      headers: { "Accept": "text/plain" },
      signal: AbortSignal.timeout(5000), // don't hang if site is slow
    });
    if (res.ok) {
      const text = await res.text();
      console.log(`[AI] Successfully fetched design content (${text.length} chars)`);
      // Limit to ~8000 characters to leave room for the rest of the prompt
      return text.slice(0, 8000);
    }
  } catch (err) {
    console.warn("[AI] Failed to fetch design link content:", err);
  }
  return "";
}

export async function generateReactNativeApp(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture,
  designLink?: string
): Promise<Record<string, string>> {
  let designContent = "";
  if (designLink && designLink.trim().length > 0) {
    designContent = await fetchDesignContent(designLink.trim());
  }

  const systemPrompt = buildSystemPrompt(prompt, isPro, architecture, designLink, designContent);

  // 1. Try mistral-small (fast)
  try {
    const files = await callMistral(PRIMARY_MODEL, systemPrompt, prompt);
    const codeFiles = Object.keys(files).filter(k => k.endsWith('.tsx') || k.endsWith('.ts'));
    if (codeFiles.length >= 3) {
      console.log(`[AI] mistral-small success: ${Object.keys(files).length} files`);
      return files;
    }
    console.warn('[AI] mistral-small output thin, trying mistral-large...');
  } catch (err) {
    console.warn(`[AI] mistral-small failed: ${(err as Error).message}`);
  }

  // 2. Try mistral-large (better quality, slower)
  try {
    const files = await callMistral(FALLBACK_MODEL, systemPrompt, prompt);
    console.log(`[AI] mistral-large success: ${Object.keys(files).length} files`);
    return files;
  } catch (err) {
    console.error(`[AI] mistral-large also failed: ${(err as Error).message}`);
    console.warn('[AI] Both Mistral models failed — using rich fallback template');
    return generateFallbackTemplate(prompt, architecture);
  }
}

// ─── Rich fallback template ────────────────────────────────────────────────────

function generateFallbackTemplate(
  prompt: string,
  arch?: AppArchitecture
): Record<string, string> {
  const appName = arch?.suggestedName ?? (
    prompt.split(' ').slice(0, 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('').replace(/[^a-zA-Z]/g, '') || 'MyApp'
  );
  const slug = appName.toLowerCase();
  const primary = arch?.primaryColor ?? '#6C3DE8';
  const screens = (arch?.screens ?? ['Home', 'Explore', 'Profile', 'Settings']).slice(0, 5);

  return {
    'package.json': JSON.stringify({
      name: slug, version: '1.0.0', main: 'expo-router/entry',
      scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios' },
      dependencies: {
        expo: '~51.0.0', 'expo-router': '^3.5.0', 'expo-status-bar': '~1.12.1',
        '@expo/vector-icons': '^14.0.2', react: '18.2.0', 'react-native': '0.74.5',
        'react-native-safe-area-context': '4.10.5', 'react-native-screens': '~3.31.1',
      },
      devDependencies: { '@babel/core': '^7.24.0', '@types/react': '~18.2.79', typescript: '^5.3.3' },
    }, null, 2),

    'app.json': JSON.stringify({
      expo: {
        name: appName, slug, version: '1.0.0', orientation: 'portrait', scheme: slug,
        userInterfaceStyle: 'dark', splash: { backgroundColor: '#0f172a' },
        ios: { supportsTablet: false, bundleIdentifier: `com.cordneed.${slug}` },
        android: { adaptiveIcon: { backgroundColor: primary }, package: `com.cordneed.${slug}` },
        plugins: ['expo-router'], experiments: { typedRoutes: true },
      },
    }, null, 2),

    'tsconfig.json': JSON.stringify({
      extends: 'expo/tsconfig.base',
      compilerOptions: { strict: true },
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    }, null, 2),

    'babel.config.js': `module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};`,

    '.gitignore': `node_modules/\n.expo/\ndist/\nnpm-debug.*\n*.jks\n*.p8\n*.p12\n*.key\n*.mobileprovision\nweb-build/\n.env`,

    'constants/Colors.ts': `export const Colors = {
  primary: '${primary}',
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  tabBar: '#0a1628',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};`,

    'components/ui/Card.tsx': `import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
});`,

    'components/ui/Button.tsx': `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props { title: string; onPress: () => void; variant?: 'primary' | 'outline'; loading?: boolean; style?: ViewStyle; }

export default function Button({ title, onPress, variant = 'primary', loading, style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.base, styles[variant], style]} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.text, styles[\`text_\${variant}\`]]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  primary: { backgroundColor: Colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
  text: { fontSize: 15, fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_outline: { color: Colors.primary },
});`,

    'app/_layout.tsx': `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}`,

    'app/(tabs)/_layout.tsx': buildTabLayout(screens, primary),

    ...screens.reduce<Record<string, string>>((acc, screen, i) => {
      const route = i === 0 ? 'index' : screen.toLowerCase().replace(/\s+/g, '-');
      acc[`app/(tabs)/${route}.tsx`] = buildScreen(screen, appName, primary, i);
      return acc;
    }, {}),
  };
}

// ─── Tab layout builder ───────────────────────────────────────────────────────

function buildTabLayout(screens: string[], primary: string): string {
  const icons = [
    ['home-outline', 'home'],
    ['compass-outline', 'compass'],
    ['person-outline', 'person'],
    ['settings-outline', 'settings'],
    ['heart-outline', 'heart'],
  ];

  const tabConfigs = screens.slice(0, 5).map((s, i) => ({
    route: i === 0 ? 'index' : s.toLowerCase().replace(/\s+/g, '-'),
    label: s,
    icon: icons[i % icons.length][0],
    iconActive: icons[i % icons.length][1],
  }));

  return `import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '${primary}',
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
${tabConfigs.map(t => `      <Tabs.Screen
        name="${t.route}"
        options={{
          title: '${t.label}',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? '${t.iconActive}' : '${t.icon}'} size={size} color={color} />
          ),
        }}
      />`).join('\n')}
    </Tabs>
  );
}`;
}

// ─── Screen builders ───────────────────────────────────────────────────────────

function buildScreen(name: string, appName: string, primary: string, idx: number): string {
  if (idx === 0) return buildHomeScreen(name, appName, primary);
  if (/profile|account|user/i.test(name)) return buildProfileScreen(name, primary);
  if (/setting|config|pref/i.test(name)) return buildSettingsScreen(name, appName);
  return buildExploreScreen(name, primary);
}

function buildHomeScreen(name: string, appName: string, primary: string): string {
  return `import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';

const STATS = [
  { label: 'Active', value: '24', icon: 'flash' as const, color: '#f59e0b' },
  { label: 'Done', value: '142', icon: 'checkmark-circle' as const, color: '#22c55e' },
  { label: 'Streak', value: '7d', icon: 'flame' as const, color: '#ef4444' },
];

const ITEMS = [
  { id: '1', title: 'Getting Started', sub: 'Complete your setup', pct: 60, tag: 'Beginner' },
  { id: '2', title: 'Advanced Module', sub: 'Level up your skills', pct: 30, tag: 'Pro' },
  { id: '3', title: 'Daily Challenge', sub: 'Beat your record today', pct: 90, tag: 'Daily' },
  { id: '4', title: 'Community Event', sub: 'Join 1,200 participants', pct: 10, tag: 'Live' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.title}>${appName}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Ionicons name="person-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={22} color={s.color} />
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Card style={[styles.banner, { borderColor: '${primary}55', backgroundColor: '${primary}18' }]}>
          <Text style={[styles.bannerTag, { color: '${primary}' }]}>FEATURED</Text>
          <Text style={styles.bannerTitle}>Start your journey today</Text>
          <Text style={styles.bannerSub}>Explore all features and reach your goals faster.</Text>
          <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: '${primary}' }]}>
            <Text style={styles.bannerBtnTxt}>Get Started</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Continue Learning</Text>
        {ITEMS.map(item => (
          <Card key={item.id}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={[styles.tag, { backgroundColor: '${primary}22' }]}>
                    <Text style={[styles.tagTxt, { color: '${primary}' }]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.itemSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
            <View style={styles.progBg}>
              <View style={[styles.progFill, { width: \`\${item.pct}%\`, backgroundColor: '${primary}' }]} />
            </View>
            <Text style={styles.progTxt}>{item.pct}% complete</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: Colors.textMuted },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 4 },
  statVal: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLbl: { fontSize: 11, color: Colors.textMuted },
  banner: { marginBottom: 20 },
  bannerTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  bannerSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 14 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  bannerBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 13, color: Colors.textMuted },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagTxt: { fontSize: 11, fontWeight: '600' },
  progBg: { height: 6, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progFill: { height: '100%', borderRadius: 4 },
  progTxt: { fontSize: 11, color: Colors.textMuted },
});`;
}

function buildProfileScreen(name: string, primary: string): string {
  return `import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const STATS = [{ label: 'Completed', value: '142' }, { label: 'Streak', value: '7d' }, { label: 'Points', value: '2.4k' }];
const MENU = [
  { icon: 'person-outline' as const, label: 'Edit Profile' },
  { icon: 'notifications-outline' as const, label: 'Notifications' },
  { icon: 'shield-outline' as const, label: 'Privacy & Security' },
  { icon: 'help-circle-outline' as const, label: 'Help & Support' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>${name}</Text>
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: '${primary}22', borderColor: '${primary}55' }]}>
              <Ionicons name="person" size={36} color="${primary}" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Alex Johnson</Text>
              <Text style={styles.email}>alex@example.com</Text>
              <View style={[styles.badge, { backgroundColor: '${primary}22' }]}>
                <Text style={[styles.badgeTxt, { color: '${primary}' }]}>Pro Member</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={s.label} style={[styles.stat, i > 0 && styles.statBorder]}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>
        {MENU.map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: '${primary}18' }]}>
              <Ionicons name={item.icon} size={18} color="${primary}" />
            </View>
            <Text style={styles.menuLbl}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ))}
        <Button title="Sign Out" onPress={() => {}} variant="outline" style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  profileCard: { marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  email: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLbl: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLbl: { fontSize: 15, color: Colors.text, fontWeight: '500' },
});`;
}

function buildSettingsScreen(name: string, appName: string): string {
  return `import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useState } from 'react';

const SECTIONS = [
  { title: 'Preferences', items: [
    { key: 'dark', label: 'Dark Mode', icon: 'moon-outline' as const, toggle: true },
    { key: 'notif', label: 'Notifications', icon: 'notifications-outline' as const, toggle: true },
    { key: 'sound', label: 'Sound Effects', icon: 'volume-medium-outline' as const, toggle: true },
  ]},
  { title: 'Account', items: [
    { key: 'pw', label: 'Change Password', icon: 'lock-closed-outline' as const, toggle: false },
    { key: 'tfa', label: 'Two-Factor Auth', icon: 'shield-checkmark-outline' as const, toggle: false },
  ]},
  { title: 'Support', items: [
    { key: 'help', label: 'Help Center', icon: 'help-circle-outline' as const, toggle: false },
    { key: 'fb', label: 'Send Feedback', icon: 'chatbubble-outline' as const, toggle: false },
    { key: 'rate', label: 'Rate the App', icon: 'star-outline' as const, toggle: false },
  ]},
];

export default function SettingsScreen() {
  const [toggles, setToggles] = useState({ dark: true, notif: true, sound: false });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>${name}</Text>
        {SECTIONS.map(sec => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {sec.items.map(item => (
              <TouchableOpacity key={item.key} style={styles.row} activeOpacity={item.toggle ? 1 : 0.7}>
                <View style={styles.iconBox}><Ionicons name={item.icon} size={17} color={Colors.primary} /></View>
                <Text style={styles.label}>{item.label}</Text>
                {item.toggle ? (
                  <Switch value={toggles[item.key as keyof typeof toggles]} onValueChange={v => setToggles(t => ({ ...t, [item.key]: v }))}
                    trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#fff" style={{ marginLeft: 'auto' }} />
                ) : (
                  <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Text style={styles.version}>v1.0.0 · ${appName}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Colors2 = { ...{primary: '#6C3DE8'} };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  section: { backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: 14, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, color: Colors.text },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});`;
}

function buildExploreScreen(name: string, primary: string): string {
  return `import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import { useState } from 'react';

const CATS = ['All', 'Popular', 'New', 'Trending'];
const ITEMS = [
  { id: '1', title: 'Quick Start Guide', sub: '5 min', tag: 'Free', icon: 'book-outline' as const },
  { id: '2', title: 'Advanced Techniques', sub: '12 min', tag: 'Pro', icon: 'rocket-outline' as const },
  { id: '3', title: 'Tips & Tricks', sub: '8 min', tag: 'Free', icon: 'bulb-outline' as const },
  { id: '4', title: 'Video Tutorial', sub: '15 min', tag: 'New', icon: 'play-circle-outline' as const },
  { id: '5', title: 'Best Practices', sub: '6 min', tag: 'Free', icon: 'checkmark-circle-outline' as const },
  { id: '6', title: 'Case Study', sub: '10 min', tag: 'Pro', icon: 'analytics-outline' as const },
];

export default function ${name.replace(/\s+/g, '')}Screen() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const filtered = ITEMS.filter(it => it.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>${name}</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={17} color={Colors.textMuted} /></TouchableOpacity>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {CATS.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)} style={[styles.chip, c === cat && { backgroundColor: '${primary}', borderColor: '${primary}' }]}>
              <Text style={[styles.chipTxt, c === cat && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.count}>{filtered.length} items</Text>
        {filtered.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.8}>
            <Card style={styles.itemRow}>
              <View style={[styles.iconBox, { backgroundColor: '${primary}18' }]}>
                <Ionicons name={item.icon} size={20} color="${primary}" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={[styles.tag, item.tag === 'Pro' ? { backgroundColor: '${primary}22' } : { backgroundColor: Colors.border }]}>
                    <Text style={[styles.tagTxt, item.tag === 'Pro' && { color: '${primary}' }]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.itemSub}>{item.sub} read</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTxt}>No results for "{search}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  count: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 12, color: Colors.textMuted },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagTxt: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt: { fontSize: 15, color: Colors.textMuted },
});`;
}
