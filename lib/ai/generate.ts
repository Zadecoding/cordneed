import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import type { AppArchitecture } from './architect';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ─── Model cascade ────────────────────────────────────────────────────────────
const GEMINI_CASCADE = [
  'gemini-2.0-flash-lite',      // best free-tier quota
  'gemini-1.5-flash',           // stable, good free quota
  'gemini-1.5-pro',             // higher quality
  'gemini-2.5-pro-exp-03-25',   // experimental, free while in preview
];

const GEMINI_TIMEOUT_MS = 45_000; // generous for large output
const MISTRAL_TIMEOUT_MS = 55_000;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture
): string {
  const screens = architecture?.screens ?? ['Home', 'Profile', 'Settings'];
  const features = architecture?.features ?? ['navigation', 'authentication'];
  const appName = architecture?.suggestedName ?? 'MyApp';
  const colorTheme = architecture?.colorTheme ?? 'dark with purple accents';
  const primaryColor = architecture?.primaryColor ?? '#6C3DE8';

  return `You are an expert React Native / Expo developer. Your task is to generate a COMPLETE, PRODUCTION-READY multi-screen React Native Expo app.

USER REQUEST: "${prompt}"

APP DETAILS:
- Name: ${appName}
- Screens to build: ${screens.join(', ')}
- Features: ${features.join(', ')}
- Color theme: ${colorTheme} (primary: ${primaryColor})

════════════════════════════════════════════════
MANDATORY OUTPUT FORMAT — READ CAREFULLY
════════════════════════════════════════════════
• Return ONLY a single JSON object — NO markdown, NO backticks, NO explanation before or after.
• The JSON keys are file paths (strings). The JSON values are the full file contents (strings).
• Every screen listed above MUST have its own .tsx file in app/(tabs)/ or app/.
• You MUST include ALL of these files (minimum):

  package.json
  app.json
  tsconfig.json
  babel.config.js
  .gitignore
  app/_layout.tsx          ← root layout with tab/stack navigator
  app/(tabs)/_layout.tsx   ← bottom tab bar layout
  app/(tabs)/index.tsx     ← Home / main screen
${screens.slice(1).map((s, i) => `  app/(tabs)/${s.toLowerCase().replace(/\s+/g, '-')}.tsx     ← ${s} screen`).join('\n')}
  components/ui/Button.tsx
  components/ui/Card.tsx
  constants/Colors.ts
  constants/theme.ts

════════════════════════════════════════════════
CODING RULES
════════════════════════════════════════════════
1. Use Expo SDK 51, expo-router v3, React Native 0.74, TypeScript strict mode.
2. Use StyleSheet.create() for all styles — NO inline styles, NO NativeWind.
3. Primary color: ${primaryColor}. Background: #0f172a (dark). Surface: #1e293b.
4. Each screen must have REAL content — lists, cards, inputs, images placeholders.
5. Tab bar must show icons (use @expo/vector-icons Ionicons).
6. app/_layout.tsx must export a Stack with proper options.
7. app/(tabs)/_layout.tsx must export a Tabs component with ALL tab screens.
8. All components must be TypeScript with proper prop types.
9. package.json script "start": "expo start", "android": "expo start --android", "ios": "expo start --ios".
10. babel.config.js: module.exports = { presets: ['babel-preset-expo'] }
${!isPro ? '11. Add a small "Built with Cordneed" badge at the bottom of the Home screen.' : ''}

════════════════════════════════════════════════
EXAMPLE JSON STRUCTURE (follow this shape exactly)
════════════════════════════════════════════════
{
  "package.json": "{\\n  \\"name\\": \\"my-app\\",\\n  ...\\n}",
  "app/_layout.tsx": "import { Stack } from 'expo-router';\\nexport default function RootLayout() {\\n  return <Stack />;\\n}",
  "app/(tabs)/_layout.tsx": "import { Tabs } from 'expo-router';\\n...",
  "app/(tabs)/index.tsx": "import { View, Text, StyleSheet } from 'react-native';\\n...",
  "components/ui/Button.tsx": "..."
}

Generate the COMPLETE app now. Every file must contain real, working code — no TODO comments, no placeholder content.`;
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseModelOutput(raw: string, prompt: string): Record<string, string> {
  let text = raw.trim();

  // Strip markdown code fences
  const jsonFenceMatch = text.match(/```json\s*([\s\S]*?)```/);
  const plainFenceMatch = text.match(/```\s*([\s\S]*?)```/);
  if (jsonFenceMatch) text = jsonFenceMatch[1].trim();
  else if (plainFenceMatch) text = plainFenceMatch[1].trim();

  // Find first { and last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 2) {
      console.log(`[AI] Parsed ${Object.keys(parsed).length} files from model output`);
      return parsed as Record<string, string>;
    }
  } catch (e) {
    console.warn('[AI] JSON parse failed:', (e as Error).message?.slice(0, 100));
  }

  console.warn('[AI] Could not parse model output — falling back to template');
  return generateFallbackTemplate(prompt);
}

// ─── Gemini ────────────────────────────────────────────────────────────────────

async function tryGemini(systemPrompt: string, rawPrompt: string): Promise<Record<string, string>> {
  let lastErr: unknown;
  for (const modelName of GEMINI_CASCADE) {
    try {
      console.log(`[AI] Gemini trying: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const text = await Promise.race<string>([
        model.generateContent(systemPrompt).then((r) => r.response.text()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${modelName} timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)), GEMINI_TIMEOUT_MS)
        ),
      ]);
      const files = parseModelOutput(text, rawPrompt);
      // Sanity check — accept only if we got more than just config files
      const codeFiles = Object.keys(files).filter(k => k.endsWith('.tsx') || k.endsWith('.ts'));
      if (codeFiles.length >= 3) {
        console.log(`[AI] Gemini success: ${modelName} (${Object.keys(files).length} files, ${codeFiles.length} code files)`);
        return files;
      }
      console.warn(`[AI] ${modelName} returned only ${codeFiles.length} code files — trying next`);
    } catch (err) {
      lastErr = err;
      console.warn(`[AI] Gemini ${modelName} failed: ${(err as Error).message?.slice(0, 120)}`);
    }
  }
  throw lastErr ?? new Error('All Gemini models failed');
}

// ─── Mistral ───────────────────────────────────────────────────────────────────

async function tryMistral(systemPrompt: string, rawPrompt: string): Promise<Record<string, string>> {
  console.log('[AI] Falling back to Mistral for code generation...');

  // Use mistral-small for speed — it's fast enough for well-structured prompts
  const text = await Promise.race<string>([
    mistral.chat
      .complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.15,
        maxTokens: 16384,
      })
      .then((r) => (r.choices?.[0]?.message?.content as string) ?? ''),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Mistral timed out after ${MISTRAL_TIMEOUT_MS / 1000}s`)), MISTRAL_TIMEOUT_MS)
    ),
  ]);

  const files = parseModelOutput(text, rawPrompt);
  const codeFiles = Object.keys(files).filter(k => k.endsWith('.tsx') || k.endsWith('.ts'));
  console.log(`[AI] Mistral returned ${Object.keys(files).length} files, ${codeFiles.length} code files`);
  return files;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateReactNativeApp(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture
): Promise<Record<string, string>> {
  const systemPrompt = buildSystemPrompt(prompt, isPro, architecture);

  // 1. Try Gemini cascade
  try {
    return await tryGemini(systemPrompt, prompt);
  } catch {
    console.warn('[AI] Entire Gemini cascade exhausted — trying Mistral');
  }

  // 2. Mistral fallback
  try {
    return await tryMistral(systemPrompt, prompt);
  } catch (err) {
    console.error('[AI] Mistral also failed:', (err as Error).message);
    console.warn('[AI] Both providers failed — using rich fallback template');
    return generateFallbackTemplate(prompt, architecture);
  }
}

// ─── Rich fallback template ────────────────────────────────────────────────────
// Generates a real, working multi-screen app so users always get something runnable

function generateFallbackTemplate(
  prompt: string,
  arch?: AppArchitecture
): Record<string, string> {
  const appName = arch?.suggestedName ?? (
    prompt.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('').replace(/[^a-zA-Z]/g, '') || 'MyApp'
  );
  const slug = appName.toLowerCase();
  const primary = arch?.primaryColor ?? '#6C3DE8';
  const screens = arch?.screens ?? ['Home', 'Explore', 'Profile', 'Settings'];

  const tabScreens = screens.slice(0, 5); // max 5 tabs

  return {
    'package.json': JSON.stringify({
      name: slug,
      version: '1.0.0',
      main: 'expo-router/entry',
      scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios' },
      dependencies: {
        expo: '~51.0.0',
        'expo-router': '^3.5.0',
        'expo-status-bar': '~1.12.1',
        '@expo/vector-icons': '^14.0.2',
        'react': '18.2.0',
        'react-native': '0.74.5',
        'react-native-safe-area-context': '4.10.5',
        'react-native-screens': '~3.31.1',
      },
      devDependencies: {
        '@babel/core': '^7.24.0',
        '@types/react': '~18.2.79',
        'typescript': '^5.3.3',
      },
    }, null, 2),

    'app.json': JSON.stringify({
      expo: {
        name: appName,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        scheme: slug,
        userInterfaceStyle: 'dark',
        splash: { backgroundColor: '#0f172a' },
        ios: { supportsTablet: false, bundleIdentifier: `com.cordneed.${slug}` },
        android: { adaptiveIcon: { backgroundColor: primary }, package: `com.cordneed.${slug}` },
        plugins: ['expo-router'],
        experiments: { typedRoutes: true },
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

    '.gitignore': `node_modules/\n.expo/\ndist/\nnpm-debug.*\n*.jks\n*.p8\n*.p12\n*.key\n*.mobileprovision\n*.orig.*\nweb-build/\n.env`,

    'constants/Colors.ts': `export const Colors = {
  primary: '${primary}',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  tabBar: '#0a1628',
};`,

    'constants/theme.ts': `import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
export const fontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36 };

export const globalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: fontSize.md, color: Colors.textMuted },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: Colors.primary + '22',
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600', color: Colors.primary },
});`,

    'components/ui/Button.tsx': `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.base, styles[variant], (loading || disabled) && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, styles[\`text_\${variant}\`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: Colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
  ghost: { backgroundColor: Colors.surface },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.text },
});`,

    'components/ui/Card.tsx': `import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
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

    'app/_layout.tsx': `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}`,

    'app/(tabs)/_layout.tsx': `import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: { name: string; label: string; icon: IoniconsName; iconActive: IoniconsName }[] = [
${tabScreens.map((s, i) => {
  const icons: [string, string][] = [
    ['home-outline','home'], ['compass-outline','compass'],
    ['person-outline','person'], ['settings-outline','settings'],
    ['heart-outline','heart'],
  ];
  const [ic, ica] = icons[i % icons.length];
  const route = i === 0 ? 'index' : s.toLowerCase().replace(/\s+/g, '-');
  return `  { name: '${route}', label: '${s}', icon: '${ic}', iconActive: '${ica}' },`;
}).join('\n')}
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.tabBar, borderTopColor: Colors.border, borderTopWidth: 1, height: 64, paddingBottom: 8 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TAB_CONFIG.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}`,

    'app/(tabs)/index.tsx': `import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
  { id: '1', title: 'Getting Started', subtitle: 'Complete your setup', progress: 0.6, tag: 'Beginner' },
  { id: '2', title: 'Advanced Module', subtitle: 'Level up your skills', progress: 0.3, tag: 'Pro' },
  { id: '3', title: 'Daily Challenge', subtitle: 'Beat your record today', progress: 0.9, tag: 'Daily' },
  { id: '4', title: 'Community Event', subtitle: 'Join 1,200 participants', progress: 0.1, tag: 'Live' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.title}>${appName}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={22} color={s.color} style={{ marginBottom: 6 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Featured banner */}
        <Card style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTag}>Featured</Text>
            <Text style={styles.bannerTitle}>Start your journey today</Text>
            <Text style={styles.bannerSub}>Explore all features and reach your goals</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* List */}
        <Text style={styles.sectionTitle}>Continue where you left off</Text>
        {ITEMS.map(item => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={styles.tag}><Text style={styles.tagText}>{item.tag}</Text></View>
                </View>
                <Text style={styles.itemSub}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: \`\${item.progress * 100}%\`, backgroundColor: Colors.primary }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(item.progress * 100)}% complete</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: Colors.textMuted },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  banner: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '55', marginBottom: 20 },
  bannerContent: {},
  bannerTag: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  bannerSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 14 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  itemCard: {},
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 13, color: Colors.textMuted },
  tag: { backgroundColor: Colors.primary + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, color: Colors.textMuted },
});`,

    // Generate remaining tab screens dynamically
    ...tabScreens.slice(1).reduce<Record<string, string>>((acc, screen, idx) => {
      const route = screen.toLowerCase().replace(/\s+/g, '-');
      acc[`app/(tabs)/${route}.tsx`] = buildTabScreen(screen, appName, primary, idx + 1);
      return acc;
    }, {}),
  };
}

function buildTabScreen(screenName: string, appName: string, primary: string, idx: number): string {
  const isProfile = /profile|account|user/i.test(screenName);
  const isSettings = /setting|config|pref/i.test(screenName);
  const isExplore = /explore|discover|search|browse/i.test(screenName);

  if (isProfile) {
    return `import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const STATS = [
  { label: 'Completed', value: '142' },
  { label: 'Streak', value: '7' },
  { label: 'Points', value: '2.4k' },
];

const MENU = [
  { icon: 'person-outline' as const, label: 'Edit Profile', arrow: true },
  { icon: 'notifications-outline' as const, label: 'Notifications', arrow: true },
  { icon: 'shield-outline' as const, label: 'Privacy', arrow: true },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', arrow: true },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}><Ionicons name="person" size={36} color="${primary}" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Alex Johnson</Text>
              <Text style={styles.email}>alex@example.com</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Pro Member</Text></View>
            </View>
          </View>
          <View style={styles.statsRow}>
            {STATS.map(s => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>
        {MENU.map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}><Ionicons name={item.icon} size={20} color="${primary}" /></View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.arrow && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        ))}
        <Button title="Sign Out" onPress={() => {}} variant="outline" style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  profileCard: { marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '${primary}22', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '${primary}55' },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  email: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  badge: { backgroundColor: '${primary}22', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '${primary}' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '${primary}18', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
});`;
  }

  if (isSettings) {
    return `import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Preferences',
    items: [
      { label: 'Dark Mode', icon: 'moon-outline' as const, toggle: true, key: 'darkMode' },
      { label: 'Notifications', icon: 'notifications-outline' as const, toggle: true, key: 'notifications' },
      { label: 'Sound Effects', icon: 'volume-medium-outline' as const, toggle: true, key: 'sound' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Change Password', icon: 'lock-closed-outline' as const, toggle: false, key: 'password' },
      { label: 'Two-Factor Auth', icon: 'shield-checkmark-outline' as const, toggle: false, key: '2fa' },
      { label: 'Linked Accounts', icon: 'link-outline' as const, toggle: false, key: 'linked' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help Center', icon: 'help-circle-outline' as const, toggle: false, key: 'help' },
      { label: 'Send Feedback', icon: 'chatbubble-outline' as const, toggle: false, key: 'feedback' },
      { label: 'Rate the App', icon: 'star-outline' as const, toggle: false, key: 'rate' },
      { label: 'Privacy Policy', icon: 'document-text-outline' as const, toggle: false, key: 'privacy' },
    ],
  },
];

export default function SettingsScreen() {
  const [toggles, setToggles] = useState({ darkMode: true, notifications: true, sound: false });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Settings</Text>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity key={item.key} activeOpacity={item.toggle ? 1 : 0.7}
                style={[styles.row, i === section.items.length - 1 && styles.rowLast]}>
                <View style={styles.iconBox}><Ionicons name={item.icon} size={18} color="${primary}" /></View>
                <Text style={styles.label}>{item.label}</Text>
                {item.toggle ? (
                  <Switch value={toggles[item.key as keyof typeof toggles]}
                    onValueChange={v => setToggles(t => ({ ...t, [item.key]: v }))}
                    trackColor={{ false: Colors.border, true: '${primary}' }}
                    thumbColor="#fff" style={{ marginLeft: 'auto' }} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Text style={styles.version}>Version 1.0.0 · Built with ${appName}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  section: { backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  rowLast: {},
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '${primary}18', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, color: Colors.text },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});`;
  }

  // Generic explore/other screen
  return `import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import { useState } from 'react';

const CATEGORIES = ['All', 'Popular', 'New', 'Trending', 'Featured'];

const ITEMS = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: ['Quick Start', 'Advanced Guide', 'Pro Tips', 'Tutorial', 'Best Practices', 'Case Study', 'Workshop', 'Deep Dive'][i],
  subtitle: ['5 min read', '12 min read', '8 min read', '15 min read', '6 min read', '10 min read', '20 min read', '18 min read'][i],
  tag: ['Free', 'Pro', 'Free', 'New', 'Free', 'Pro', 'New', 'Free'][i],
  icon: ['book-outline', 'rocket-outline', 'bulb-outline', 'play-circle-outline', 'checkmark-circle-outline', 'analytics-outline', 'school-outline', 'layers-outline'][i] as any,
}));

export default function ${screenName.replace(/\s+/g, '')}Screen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = ITEMS.filter(it =>
    (category === 'All' || it.tag === category || it.subtitle.includes(category)) &&
    it.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>${screenName}</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catChip, category === cat && styles.catChipActive]}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grid */}
        <Text style={styles.sectionTitle}>{filtered.length} results</Text>
        {filtered.map(item => (
          <TouchableOpacity key={item.id} activeOpacity={0.8}>
            <Card style={styles.itemRow}>
              <View style={styles.itemIcon}><Ionicons name={item.icon} size={22} color="${primary}" /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={[styles.tag, item.tag === 'Pro' && styles.tagPro]}>
                    <Text style={[styles.tagText, item.tag === 'Pro' && styles.tagTextPro]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.itemSub}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  catScroll: { marginBottom: 16 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: '${primary}', borderColor: '${primary}' },
  catText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  catTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '${primary}18', alignItems: 'center', justifyContent: 'center' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 12, color: Colors.textMuted },
  tag: { backgroundColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagPro: { backgroundColor: '${primary}22' },
  tagText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  tagTextPro: { color: '${primary}' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
});`;
}
