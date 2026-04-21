import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import type { AppArchitecture } from './architect';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ─── Gemini cascade ────────────────────────────────────────────────────────
// Models verified against ListModels 2026-04-21 — ordered by free-tier quota availability
const GEMINI_CASCADE = [
  'gemini-2.0-flash-lite',        // best free-tier quota ('lite' variant)
  'gemini-1.5-flash',             // stable, good free quota (no -latest suffix)
  'gemini-1.5-pro',               // higher quality fallback
  'gemini-2.5-pro-exp-03-25',     // experimental, free while in preview
];

// Per-model timeout — 2.5 models are slower; total cascade < Vercel 60s ceiling
const GEMINI_TIMEOUT_MS = 22_000; // 22s × up to 4 = 88s worst case (cascade stops on first success)
const MISTRAL_TIMEOUT_MS = 55_000; // Mistral large can take 40-50s for big code gen

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture
): string {
  const archContext = architecture
    ? `\nApp Architecture Blueprint (use this as your guide):
- App Type: ${architecture.appType}
- App Name: ${architecture.suggestedName}
- Description: ${architecture.description}
- Screens to build: ${architecture.screens.join(', ')}
- Key Features: ${architecture.features.join(', ')}
- Complexity: ${architecture.complexity}
- Color Theme: ${architecture.colorTheme} (primary: ${architecture.primaryColor})
`
    : '';

  return `You are an expert React Native Expo developer. Generate a complete, production-ready React Native Expo project based on the user's description.
${archContext}
IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no explanation, no code blocks.
2. The JSON must be an object where keys are file paths and values are file contents.
3. Always include these files: package.json, app.json, App.tsx, tsconfig.json, .gitignore
4. Use TypeScript (.tsx/.ts extensions)
5. Use Expo Router for navigation
6. Use NativeWind for styling (Tailwind for React Native)
7. Make the app fully functional with realistic data
8. Include proper navigation, screens, and components
9. App should look modern and professional${architecture ? ` using the color theme: ${architecture.colorTheme}` : ''}
10. Build ALL screens listed in the architecture blueprint${!isPro ? '\n11. Add a subtle "Built with Cordneed" text at the bottom of the app' : ''}

The JSON structure example:
{
  "package.json": "{ \\"name\\": \\"my-app\\" ... }",
  "app.json": "{ \\"expo\\": { ... } }",
  "App.tsx": "import React from 'react'...",
  "app/(tabs)/index.tsx": "...",
  "components/Button.tsx": "..."
}

Generate a complete app for: ${prompt}`;
}

/** Parse + clean JSON from raw model output */
function parseModelOutput(text: string, prompt: string): Record<string, string> {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();
  try {
    return JSON.parse(clean);
  } catch {
    return generateFallbackTemplate(prompt);
  }
}

// ─── Gemini generator ────────────────────────────────────────────────────────

async function tryGeminiWithTimeout(modelName: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`${modelName} timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)),
      GEMINI_TIMEOUT_MS
    )
  );

  const generatePromise = model.generateContent(prompt).then((r) => r.response.text());
  return Promise.race([generatePromise, timeoutPromise]);
}

async function generateWithGemini(
  systemPrompt: string,
  prompt: string
): Promise<Record<string, string>> {
  let lastError: unknown;

  for (const modelName of GEMINI_CASCADE) {
    try {
      console.log(`[AI] Gemini trying: ${modelName}`);
      const text = await tryGeminiWithTimeout(modelName, systemPrompt);
      console.log(`[AI] Gemini success: ${modelName}`);
      return parseModelOutput(text, prompt);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] Gemini ${modelName} failed: ${msg}`);
    }
  }

  throw lastError ?? new Error('All Gemini models failed');
}

// ─── Mistral fallback generator ───────────────────────────────────────────────

async function generateWithMistral(
  systemPrompt: string,
  prompt: string
): Promise<Record<string, string>> {
  console.log('[AI] Falling back to Mistral for code generation...');

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Mistral timed out after ${MISTRAL_TIMEOUT_MS / 1000}s`)),
      MISTRAL_TIMEOUT_MS
    )
  );

  const generatePromise = mistral.chat
    .complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.2,
      maxTokens: 8192,
    })
    .then((res) => {
      const text = res.choices?.[0]?.message?.content ?? '';
      return parseModelOutput(text as string, prompt);
    });

  return Promise.race([generatePromise, timeoutPromise]);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateReactNativeApp(
  prompt: string,
  isPro: boolean,
  architecture?: AppArchitecture
): Promise<Record<string, string>> {
  const systemPrompt = buildSystemPrompt(prompt, isPro, architecture);

  // 1. Try Gemini cascade
  try {
    return await generateWithGemini(systemPrompt, prompt);
  } catch (geminiErr) {
    console.warn('[AI] Entire Gemini cascade exhausted — trying Mistral fallback');
  }

  // 2. Mistral fallback
  try {
    return await generateWithMistral(systemPrompt, prompt);
  } catch (mistralErr) {
    console.error('[AI] Mistral fallback also failed:', mistralErr);
    // 3. Last resort: hardcoded template
    console.warn('[AI] Both AI providers failed — using static fallback template');
    return generateFallbackTemplate(prompt);
  }
}

// ─── Static fallback template ────────────────────────────────────────────────

function generateFallbackTemplate(prompt: string): Record<string, string> {
  const appName =
    prompt.split(' ').slice(0, 3).join('').replace(/[^a-zA-Z]/g, '') || 'MyApp';

  return {
    'package.json': JSON.stringify(
      {
        name: appName.toLowerCase(),
        version: '1.0.0',
        main: 'expo-router/entry',
        scripts: {
          start: 'expo start',
          android: 'expo start --android',
          ios: 'expo start --ios',
        },
        dependencies: {
          expo: '~51.0.0',
          'expo-router': '^3.0.0',
          'expo-status-bar': '~1.12.1',
          react: '18.2.0',
          'react-native': '0.74.1',
          nativewind: '^4.0.1',
        },
        devDependencies: {
          '@babel/core': '^7.20.0',
          typescript: '^5.1.3',
        },
      },
      null,
      2
    ),
    'app.json': JSON.stringify(
      {
        expo: {
          name: appName,
          slug: appName.toLowerCase(),
          version: '1.0.0',
          orientation: 'portrait',
          scheme: appName.toLowerCase(),
          userInterfaceStyle: 'automatic',
          plugins: ['expo-router'],
        },
      },
      null,
      2
    ),
    'tsconfig.json': JSON.stringify(
      {
        extends: 'expo/tsconfig.base',
        compilerOptions: { strict: true },
      },
      null,
      2
    ),
    'App.tsx': `import { ExpoRoot } from 'expo-router';

export default function App() {
  return <ExpoRoot context={require.context('./app')} />;
}`,
    'app/_layout.tsx': `import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '${appName}' }} />
    </Stack>
  );
}`,
    'app/index.tsx': `import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${appName}</Text>
      <Text style={styles.subtitle}>Generated for: ${prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});`,
    '.gitignore': `node_modules/\n.expo/\ndist/\nnpm-debug.*\n*.jks\n*.p8\n*.p12\n*.key\n*.mobileprovision\n*.orig.*\nweb-build/\n.env`,
  };
}
