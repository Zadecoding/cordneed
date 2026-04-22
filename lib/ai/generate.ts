import Groq from 'groq-sdk';
import type { AppArchitecture } from './architect';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Model config ─────────────────────────────────────────────────────────────
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const PRIMARY_TIMEOUT = 50_000;
const FALLBACK_TIMEOUT = 58_000;

type JsonFiles = Record<string, string>;

function toRouteName(name: string, index: number): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return index === 0 ? 'index' : clean || `screen-${index + 1}`;
}

function toComponentName(name: string, fallbackIndex: number): string {
  const clean = name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  return clean || `Screen${fallbackIndex + 1}`;
}

function q(value: string): string {
  return JSON.stringify(value);
}

function stripMarkdown(text: string): string {
  let clean = text.trim();

  const jsonFence = clean.match(/```json\s*([\s\S]*?)```/);
  const plainFence = clean.match(/```\s*([\s\S]*?)```/);
  if (jsonFence) clean = jsonFence[1].trim();
  else if (plainFence) clean = plainFence[1].trim();

  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }

  return clean.trim();
}

function buildSystemPrompt(): string {
  return `You are an expert React Native / Expo engineer and premium UI architect.

Your job is to generate a complete, polished multi-screen Expo app as JSON file contents.

HARD RULES:
1. Return ONLY valid JSON.
2. No markdown, no backticks, no explanation, no extra text.
3. The JSON keys must be file paths.
4. The JSON values must be complete file contents as strings.
5. The app must feel premium, modern, animated, and visually rich.
6. Avoid dull, flat, template-like, or generic CRUD screens.
7. Use the provided screen blueprint very closely.
8. Every screen must be distinct and have a strong visual hierarchy.
9. Use style consistency, motion, spacing, soft shadows, rounded corners, and mobile-first layouts.
10. Prefer animated hero sections, premium cards, rich empty states, strong CTAs, and polished tabs.
11. Use StyleSheet.create() in the code. Avoid inline styles unless absolutely necessary.
12. If the blueprint includes animations, reflect them in the code using React Native Animated where appropriate.
13. Never ignore the screen purpose, layout, or uiStyle.
14. Do not generate basic placeholder apps with only Home/Profile/Settings unless the blueprint actually requires that.

OUTPUT FORMAT:
- The top-level JSON object keys are file paths.
- All file values must be strings.
- Escape newlines with \\n and quotes with \\".

REQUIRED FILES:
- "package.json"
- "app.json"
- "tsconfig.json"
- "babel.config.js"
- ".gitignore"
- "constants/Colors.ts"
- "components/ui/Button.tsx"
- "components/ui/Card.tsx"
- "app/_layout.tsx"
- "app/(tabs)/_layout.tsx"

You must also generate one file for every screen route in the blueprint.

TECH REQUIREMENTS:
- Expo SDK ~51
- expo-router ^3.5.0
- React Native 0.74.5
- TypeScript strict mode
- @expo/vector-icons Ionicons
- react-native-safe-area-context
- react-native-screens
- expo-status-bar

If the app is premium or AI-oriented, make the visual style especially elite, futuristic, and polished.

Return only the JSON object.`;
}

function buildUserPrompt(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture,
  designLink?: string,
  designContent?: string
): string {
  const blueprint = architecture
    ? JSON.stringify(architecture, null, 2)
    : '{}';

  const designSection = designLink
    ? designContent
      ? `

DESIGN REFERENCE URL:
${designLink}

EXTRACTED DESIGN CONTENT:
"""
${designContent}
"""

IMPORTANT:
- Treat the above as the strongest UI reference.
- Match the layout rhythm, spacing, component style, and color mood.
- Do not copy text verbatim.
- Produce a visually similar but original result.`
      : `

DESIGN REFERENCE URL:
${designLink}

IMPORTANT:
- Use the reference as visual context if available.
- If the page is inaccessible, continue with a premium design direction.`
    : '';

  return `APP IDEA:
${prompt}

IS_PRO_USER:
${isPro ? 'true' : 'false'}

FULL SCREEN BLUEPRINT:
${blueprint}
${designSection}

INSTRUCTIONS:
- Build every screen around the blueprint, not generic defaults.
- Use the screen.name, screen.purpose, screen.layout, screen.uiStyle, and screen.animations fields.
- Create unique screen code for each screen route.
- Make the UI look premium and animated.
- Keep the app visually cohesive with the provided colors and style direction.
- Include real content, rich sections, and polished interaction patterns.
- Avoid dull starter-template layouts.`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function normalizeParsedOutput(raw: string, prompt: string): JsonFiles {
  const text = stripMarkdown(raw);

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out = parsed as Record<string, unknown>;
      const keys = Object.keys(out);
      const codeFiles = keys.filter((k) => /\.(tsx?|jsx?|js)$/.test(k));

      if (codeFiles.length >= 3) {
        const normalized: JsonFiles = {};
        for (const [key, value] of Object.entries(out)) {
          if (typeof value === 'string') normalized[key] = value;
        }
        return normalized;
      }
    }
  } catch (error) {
    console.warn('[AI] JSON parse failed:', (error as Error).message?.slice(0, 120));
  }

  return generateFallbackTemplate(prompt);
}

async function callGroq(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number,
  fallbackPrompt: string,
  architecture?: AppArchitecture
): Promise<JsonFiles> {
  console.log(`[AI] Trying model: ${model}`);

  const res = await withTimeout(
    groq.chat.completions.create({
      model,
      temperature: 0.15,
      max_tokens: 6000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    timeoutMs,
    model
  );

  const text = (res.choices?.[0]?.message?.content as string) ?? '';
  const files = normalizeParsedOutput(text, fallbackPrompt);

  const codeFiles = Object.keys(files).filter((k) => /\.(tsx?|jsx?|js)$/.test(k));
  if (codeFiles.length < 3) {
    console.warn(`[AI] ${model} output was too thin; using fallback template`);
    return generateFallbackTemplate(fallbackPrompt, architecture);
  }

  console.log(`[AI] ${model} success: ${Object.keys(files).length} files`);
  return files;
}

function inferRouteScreens(architecture?: AppArchitecture): string[] {
  const screens =
    architecture?.screens?.map((screen) => screen.name).filter(Boolean) ?? [];

  if (screens.length === 0) {
    return ['Home', 'Explore', 'Profile', 'Settings'];
  }

  return screens;
}

function buildTabLayout(screens: string[], primary: string): string {
  const iconPairs: Array<[string, string]> = [
    ['home-outline', 'home'],
    ['compass-outline', 'compass'],
    ['layers-outline', 'layers'],
    ['person-outline', 'person'],
    ['settings-outline', 'settings'],
  ];

  const tabConfigs = screens.slice(0, 5).map((screen, index) => ({
    route: toRouteName(screen, index),
    label: screen,
    iconInactive: iconPairs[index % iconPairs.length][0],
    iconActive: iconPairs[index % iconPairs.length][1],
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
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '${primary}',
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
${tabConfigs
      .map(
        (tab) => `      <Tabs.Screen
        name="${tab.route}"
        options={{
          title: ${q(tab.label)},
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? '${tab.iconActive}' : '${tab.iconInactive}'}
              size={size}
              color={color}
            />
          ),
        }}
      />`
      )
      .join('\n')}
    </Tabs>
  );
}`;
}

function buildScreenComponent(
  screen: { name: string; purpose?: string; layout?: string; uiStyle?: string; animations?: string[] },
  appName: string,
  primary: string,
  index: number
): string {
  const componentName = toComponentName(screen.name, index);
  const routeTitle = screen.name;
  const purpose = screen.purpose ?? 'Premium mobile experience';
  const layout = screen.layout ?? 'premium card-based mobile layout';
  const uiStyle = screen.uiStyle ?? 'dark premium with gradients and soft shadows';
  const animations = (screen.animations && screen.animations.length > 0)
    ? screen.animations
    : ['fade-in transition', 'staggered cards', 'micro-interactions'];

  const featureLabels = [
    `${routeTitle} overview`,
    purpose,
    layout,
    uiStyle,
  ];

  const animationLabels = animations.slice(0, 4);

  return `import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const PRIMARY = ${q(primary)};
const SCREEN_TITLE = ${q(routeTitle)};
const APP_NAME = ${q(appName)};
const PURPOSE = ${q(purpose)};
const LAYOUT = ${q(layout)};
const UI_STYLE = ${q(uiStyle)};
const FEATURE_LABELS = ${JSON.stringify(featureLabels)};
const ANIMATION_LABELS = ${JSON.stringify(animationLabels)};

export default function ${componentName}Screen() {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.appMark}>
            <Ionicons name="sparkles" size={16} color={PRIMARY} />
            <Text style={styles.appMarkText}>{APP_NAME}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Card style={[styles.hero, { borderColor: PRIMARY + '55' }]}>
          <View style={styles.heroChip}>
            <Ionicons name="layers-outline" size={13} color={PRIMARY} />
            <Text style={[styles.heroChipText, { color: PRIMARY }]}>Premium experience</Text>
          </View>

          <Text style={styles.title}>{SCREEN_TITLE}</Text>
          <Text style={styles.subtitle}>{PURPOSE}</Text>

          <View style={[styles.glowCard, { backgroundColor: PRIMARY + '18', borderColor: PRIMARY + '33' }]}>
            <Text style={styles.glowLabel}>Design direction</Text>
            <Text style={styles.glowText}>{UI_STYLE}</Text>
            <View style={styles.glowMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="color-palette-outline" size={12} color={PRIMARY} />
                <Text style={[styles.metaPillText, { color: PRIMARY }]}>Custom theme</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles-outline" size={12} color={PRIMARY} />
                <Text style={[styles.metaPillText, { color: PRIMARY }]}>Animated flow</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={[styles.primaryCTA, { backgroundColor: PRIMARY }]}>
            <Text style={styles.primaryCTAText}>Start from here</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Screen blueprint</Text>
        <View style={styles.blueprintGrid}>
          <Card style={styles.blueprintCard}>
            <Text style={styles.cardLabel}>Layout</Text>
            <Text style={styles.cardValue}>{LAYOUT}</Text>
          </Card>

          <Card style={styles.blueprintCard}>
            <Text style={styles.cardLabel}>Motion</Text>
            <Text style={styles.cardValue}>{ANIMATION_LABELS.join(' • ')}</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Premium details</Text>
        {FEATURE_LABELS.map((label, idx) => (
          <Card key={label} style={styles.listCard}>
            <View style={[styles.listIcon, { backgroundColor: PRIMARY + '15' }]}>
              <Ionicons
                name={idx % 2 === 0 ? 'checkmark-circle-outline' : 'ellipse-outline'}
                size={18}
                color={PRIMARY}
              />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>{label}</Text>
              <Text style={styles.listSub}>Designed to feel polished, tactile, and high-end.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Motion cues</Text>
        <View style={styles.chipRow}>
          {ANIMATION_LABELS.map((item) => (
            <View key={item} style={[styles.chip, { borderColor: PRIMARY + '44' }]}>
              <Text style={[styles.chipText, { color: PRIMARY }]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerPanel}>
          <Text style={styles.footerTitle}>Built for a premium feel</Text>
          <Text style={styles.footerText}>
            Strong hierarchy, rich spacing, smooth transitions, and a clean experience from first open to final action.
          </Text>
          <Button title="Continue" onPress={() => {}} style={{ marginTop: 14 }} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  appMarkText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 18,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  glowCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  glowLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  glowText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    marginBottom: 12,
  },
  glowMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  primaryCTAText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  blueprintGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  blueprintCard: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardValue: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  listSub: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  footerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});`;
}

function buildRootLayout(): string {
  return `import { Stack } from 'expo-router';
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
}`;
}

function buildColorsFile(primary: string): string {
  return `export const Colors = {
  primary: '${primary}',
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  tabBar: '#0b1322',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};`;
}

function buildCardComponent(): string {
  return `import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});`;
}

function buildButtonComponent(primary: string): string {
  return `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function Button({ title, onPress, variant = 'primary', loading = false, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '${primary}'} />
      ) : (
        <Text style={[styles.text, variant === 'primary' ? styles.textPrimary : styles.textOutline]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '${primary}',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '${primary}',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#fff',
  },
  textOutline: {
    color: '${primary}',
  },
});`;
}

function buildJsonPackage(appName: string, slug: string, primary: string): string {
  return JSON.stringify(
    {
      name: slug,
      version: '1.0.0',
      main: 'expo-router/entry',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      },
      dependencies: {
        expo: '~51.0.0',
        'expo-router': '^3.5.0',
        'expo-status-bar': '~1.12.1',
        '@expo/vector-icons': '^14.0.2',
        react: '18.2.0',
        'react-native': '0.74.5',
        'react-native-safe-area-context': '4.10.5',
        'react-native-screens': '~3.31.1',
      },
      devDependencies: {
        '@babel/core': '^7.24.0',
        '@types/react': '~18.2.79',
        typescript: '^5.3.3',
      },
      private: true,
    },
    null,
    2
  );
}

function buildAppJson(appName: string, slug: string, primary: string): string {
  return JSON.stringify(
    {
      expo: {
        name: appName,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        scheme: slug,
        userInterfaceStyle: 'dark',
        splash: {
          backgroundColor: '#0f172a',
        },
        ios: {
          supportsTablet: false,
          bundleIdentifier: `com.cordneed.${slug}`,
        },
        android: {
          adaptiveIcon: {
            backgroundColor: primary,
          },
          package: `com.cordneed.${slug}`,
        },
        plugins: ['expo-router'],
        experiments: {
          typedRoutes: true,
        },
      },
    },
    null,
    2
  );
}

function buildTsConfig(): string {
  return JSON.stringify(
    {
      extends: 'expo/tsconfig.base',
      compilerOptions: {
        strict: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    },
    null,
    2
  );
}

function buildBabelConfig(): string {
  return `module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};`;
}

function buildGitIgnore(): string {
  return `node_modules/
.expo/
dist/
web-build/
*.log
*.tsbuildinfo
.env
.env.local
`;
}

function buildScreenFile(
  screen: AppArchitecture['screens'][number],
  appName: string,
  primary: string,
  index: number
): string {
  return buildScreenComponent(screen, appName, primary, index);
}

function generateFallbackTemplate(
  prompt: string,
  arch?: AppArchitecture
): JsonFiles {
  const appName =
    arch?.suggestedName ??
    (prompt
      .split(' ')
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') ||
    'MyApp');

  const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'myapp';
  const primary = arch?.primaryColor ?? '#6C3DE8';
  const screens = inferRouteScreens(arch);

  const screenObjects =
    arch?.screens && arch.screens.length > 0
      ? arch.screens
      : screens.map((screenName, index) => ({
        name: screenName,
        purpose: index === 0 ? 'Main premium landing screen' : 'Core in-app screen',
        layout: 'premium card-based mobile layout with a strong hero section',
        uiStyle: 'dark premium with gradients and soft shadows',
        animations: ['fade-in transition', 'staggered cards', 'micro-interactions'],
      }));

  const allFiles: JsonFiles = {
    'package.json': buildJsonPackage(appName, slug, primary),
    'app.json': buildAppJson(appName, slug, primary),
    'tsconfig.json': buildTsConfig(),
    'babel.config.js': buildBabelConfig(),
    '.gitignore': buildGitIgnore(),
    'constants/Colors.ts': buildColorsFile(primary),
    'components/ui/Card.tsx': buildCardComponent(),
    'components/ui/Button.tsx': buildButtonComponent(primary),
    'app/_layout.tsx': buildRootLayout(),
    'app/(tabs)/_layout.tsx': buildTabLayout(screens, primary),
    'app/+not-found.tsx': `import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function NotFound() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.text}>The screen you are looking for does not exist.</Text>
        <Button title="Go home" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
  },
});`,
  };

  screenObjects.forEach((screen, index) => {
    const route = toRouteName(screen.name, index);
    allFiles[`app/(tabs)/${route}.tsx`] = buildScreenFile(screen, appName, primary, index);
  });

  return allFiles;
}

/** Use Groq to generate a complete React Native Expo app from a blueprint. */
export async function generateReactNativeApp(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture,
  designLink?: string
): Promise<JsonFiles> {
  let designContent = '';

  if (designLink && designLink.trim().length > 0) {
    try {
      designContent = await fetchDesignContent(designLink.trim());
    } catch (error) {
      console.warn('[AI] Failed to fetch design content:', error);
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(prompt, isPro, architecture, designLink, designContent);

  try {
    const files = await callGroq(
      PRIMARY_MODEL,
      systemPrompt,
      userPrompt,
      PRIMARY_TIMEOUT,
      prompt,
      architecture
    );

    const codeFiles = Object.keys(files).filter((k) => /\.(tsx?|jsx?|js)$/.test(k));
    if (codeFiles.length >= 3) {
      return files;
    }

    console.warn(`[AI] ${PRIMARY_MODEL} output too thin, trying fallback model...`);
  } catch (err) {
    console.warn(`[AI] ${PRIMARY_MODEL} failed: ${(err as Error).message}`);
  }

  try {
    return await callGroq(
      FALLBACK_MODEL,
      systemPrompt,
      userPrompt,
      FALLBACK_TIMEOUT,
      prompt,
      architecture
    );
  } catch (err) {
    console.error(`[AI] ${FALLBACK_MODEL} failed: ${(err as Error).message}`);
    console.warn('[AI] Both Groq models failed — using rich fallback template');
    return generateFallbackTemplate(prompt, architecture);
  }
}

/**
 * Optional helper if you still want to fetch design content elsewhere.
 */
export async function fetchDesignContent(url: string): Promise<string> {
  console.log(`[AI] Fetching design content from: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (res.ok) {
      const text = await res.text();
      console.log(`[AI] Successfully fetched design content (${text.length} chars)`);
      return text.slice(0, 8000);
    }
  } catch (error) {
    console.warn('[AI] Failed to fetch design link content:', error);
  } finally {
    clearTimeout(timeoutId);
  }

  return '';
}