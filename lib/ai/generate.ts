import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateReactNativeApp(prompt: string, isPro: boolean): Promise<Record<string, string>> {
  const systemPrompt = `You are an expert React Native Expo developer. Generate a complete, production-ready React Native Expo project based on the user's description.

IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no explanation, no code blocks.
2. The JSON must be an object where keys are file paths and values are file contents.
3. Always include these files: package.json, app.json, App.tsx, tsconfig.json, .gitignore
4. Use TypeScript (.tsx/.ts extensions)
5. Use Expo Router for navigation
6. Use NativeWind for styling (Tailwind for React Native)
7. Make the app fully functional with realistic data
8. Include proper navigation, screens, and components
9. App should look modern and professional
${!isPro ? '10. Add a subtle "Built with Cordneed" text at the bottom of the app' : ''}

The JSON structure example:
{
  "package.json": "{ \\"name\\": \\"my-app\\" ... }",
  "app.json": "{ \\"expo\\": { ... } }",
  "App.tsx": "import React from 'react'...",
  "app/(tabs)/index.tsx": "...",
  "components/Button.tsx": "..."
}

Generate a complete app for: ${prompt}`;

  const modelIds = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro'
  ];
  
  let text = '';
  
  for (const modelId of modelIds) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(systemPrompt);
      text = result.response.text();
      break; 
    } catch (error: any) {
      console.warn(`Model ${modelId} failed: ${error.message}`);
      // If we exhausted all options, throw the final error
      if (modelId === modelIds[modelIds.length - 1]) throw error;
    }
  }

  // Clean the response - remove any markdown wrapping
  let cleanJson = text.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.slice(7);
  }
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.slice(3);
  }
  if (cleanJson.endsWith('```')) {
    cleanJson = cleanJson.slice(0, -3);
  }
  cleanJson = cleanJson.trim();

  try {
    const files = JSON.parse(cleanJson);
    return files;
  } catch {
    // If parsing fails, return a basic template
    return generateFallbackTemplate(prompt);
  }
}

function generateFallbackTemplate(prompt: string): Record<string, string> {
  const appName = prompt.split(' ').slice(0, 3).join('').replace(/[^a-zA-Z]/g, '') || 'MyApp';
  
  return {
    'package.json': JSON.stringify({
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
        'nativewind': '^4.0.1',
      },
      devDependencies: {
        '@babel/core': '^7.20.0',
        typescript: '^5.1.3',
      },
    }, null, 2),
    'app.json': JSON.stringify({
      expo: {
        name: appName,
        slug: appName.toLowerCase(),
        version: '1.0.0',
        orientation: 'portrait',
        scheme: appName.toLowerCase(),
        userInterfaceStyle: 'automatic',
        plugins: ['expo-router'],
      },
    }, null, 2),
    'tsconfig.json': JSON.stringify({
      extends: 'expo/tsconfig.base',
      compilerOptions: { strict: true },
    }, null, 2),
    'App.tsx': `import { ExpoRoot } from 'expo-router';
import { requireNativeModule } from 'expo-modules-core';

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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});`,
    '.gitignore': `node_modules/\n.expo/\ndist/\nnpm-debug.*\n*.jks\n*.p8\n*.p12\n*.key\n*.mobileprovision\n*.orig.*\nweb-build/\n.env`,
  };
}
