import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SnackDep { version: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert @/ path aliases to relative paths for Snack compatibility */
function resolveAliases(content: string, filePath: string): string {
  if (!content.includes('@/')) return content;
  const depth = filePath.split('/').length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  return content.replace(/@\//g, prefix);
}

/** Extract all screen files from app/(tabs)/ directory */
function extractScreens(files: Record<string, string>): { route: string; name: string; content: string }[] {
  const screens: { route: string; name: string; content: string }[] = [];
  for (const [path, content] of Object.entries(files)) {
    const match = path.match(/^app\/\(tabs\)\/(.+)\.(tsx|ts|js|jsx)$/);
    if (match && match[1] !== '_layout') {
      const route = match[1]; // e.g. "index", "profile", "settings"
      const name = route === 'index' ? 'Home' : route.charAt(0).toUpperCase() + route.slice(1).replace(/-/g, ' ');
      screens.push({ route, name, content });
    }
  }
  return screens;
}

/** Extract named color constant from Colors.ts if present */
function extractColors(files: Record<string, string>): Record<string, string> {
  const colorsFile = files['constants/Colors.ts'] || files['constants/colors.ts'] || '';
  const colors: Record<string, string> = {
    primary: '#6C3DE8',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    tabBar: '#0a1628',
  };
  const matches = colorsFile.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
  for (const m of matches) {
    colors[m[1]] = m[2];
  }
  return colors;
}

/**
 * Build a single self-contained App.js using React Navigation.
 * This is what Snack can ACTUALLY run without Expo Router's file-system routing.
 */
function buildSnackApp(
  screens: { route: string; name: string; content: string }[],
  colors: Record<string, string>,
  appName: string,
  allFiles: Record<string, string>
): string {
  // Map icons — we'll use Ionicons from @expo/vector-icons
  const iconMap: Record<string, [string, string]> = {
    home: ['home', 'home-outline'],
    explore: ['compass', 'compass-outline'],
    profile: ['person', 'person-outline'],
    account: ['person', 'person-outline'],
    settings: ['settings', 'settings-outline'],
    config: ['settings', 'settings-outline'],
    chat: ['chatbubbles', 'chatbubbles-outline'],
    feed: ['newspaper', 'newspaper-outline'],
    search: ['search', 'search-outline'],
    favorites: ['heart', 'heart-outline'],
    cart: ['cart', 'cart-outline'],
    orders: ['receipt', 'receipt-outline'],
    notifications: ['notifications', 'notifications-outline'],
    wallet: ['wallet', 'wallet-outline'],
    analytics: ['analytics', 'analytics-outline'],
  };

  function getIcon(route: string): [string, string] {
    for (const [key, val] of Object.entries(iconMap)) {
      if (route.toLowerCase().includes(key)) return val;
    }
    return ['apps', 'apps-outline'];
  }

  // Inline each screen component, stripping its default export and replacing with a renamed function
  const screenComponents: string[] = [];
  const tabScreenDefs: string[] = [];

  screens.forEach(({ route, name, content }, i) => {
    const compName = name.replace(/\s+/g, '') + 'Screen';
    const [iconActive, iconInactive] = getIcon(route);

    // Strip existing imports and export default — we'll inline everything into App.js
    let body = content
      // strip import lines for expo-router (not needed)
      .replace(/^import\s+.*from\s+['"]expo-router['"];?\n?/gm, '')
      // Replace @/ alias with ./ for top-level files
      .replace(/@\//g, './')
      // rename the default export function to our compName
      .replace(/export\s+default\s+function\s+\w+\s*\(/, `function ${compName}(`)
      .replace(/export\s+default\s+function\s*\(/, `function ${compName}(`)
      // strip "export default ComponentName;" style
      .replace(/export\s+default\s+\w+;?\s*$/, '');

    screenComponents.push(`// ── Screen: ${name} ──────────────────────────────────────\n${body}`);

    tabScreenDefs.push(`
    <Tab.Screen
      name="${compName}"
      component={${compName}}
      options={{
        title: '${name}',
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? '${iconActive}' : '${iconInactive}'} size={size} color={color} />
        ),
      }}
    />`);
  });

  // If no screens found just build a placeholder
  if (screens.length === 0) {
    screenComponents.push(`function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '${colors.background}', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '${colors.text}', fontSize: 24, fontWeight: '700' }}>${appName}</Text>
      <Text style={{ color: '${colors.textMuted}', marginTop: 8 }}>Generated by Cordneed</Text>
    </SafeAreaView>
  );
}`);
    tabScreenDefs.push(`<Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />`);
  }

  // Collect unique imports needed from React Native across all screen bodies
  const needsScrollView = screenComponents.some(s => s.includes('ScrollView'));
  const needsTextInput = screenComponents.some(s => s.includes('TextInput'));
  const needsSwitch = screenComponents.some(s => s.includes('<Switch'));
  const needsFlatList = screenComponents.some(s => s.includes('FlatList'));
  const needsModal = screenComponents.some(s => s.includes('<Modal'));
  const needsImage = screenComponents.some(s => s.includes('<Image'));
  const needsActivityIndicator = screenComponents.some(s => s.includes('ActivityIndicator'));

  const rnImports = [
    'View', 'Text', 'StyleSheet', 'TouchableOpacity', 'Pressable',
    needsScrollView && 'ScrollView',
    needsTextInput && 'TextInput',
    needsSwitch && 'Switch',
    needsFlatList && 'FlatList',
    needsModal && 'Modal',
    needsImage && 'Image',
    needsActivityIndicator && 'ActivityIndicator',
  ].filter(Boolean).join(', ');

  return `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ${rnImports} } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

// ── Shared Design Tokens ──────────────────────────────────────────────────────
const Colors = {
  primary: '${colors.primary}',
  background: '${colors.background}',
  surface: '${colors.surface}',
  border: '${colors.border}',
  text: '${colors.text}',
  textMuted: '${colors.textMuted}',
  tabBar: '${colors.tabBar || colors.background}',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

// ── Screen Components ─────────────────────────────────────────────────────────
${screenComponents.join('\n\n')}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.tabBar,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          ${tabScreenDefs.join('')}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
`;
}


// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { files, projectName } = await request.json();

    if (!files || typeof files !== 'object') {
      return NextResponse.json({ message: 'Files required' }, { status: 400 });
    }

    // ── Extract screens & colors from generated files ─────────────────────────
    const screens = extractScreens(files);
    const colors = extractColors(files);
    const appName = projectName || 'MyApp';

    // ── Build Snack code object ───────────────────────────────────────────────
    const code: Record<string, any> = {};

    // Add support files (constants, components) but NOT app/ layout/routing files
    for (const [path, content] of Object.entries(files)) {
      if (typeof content !== 'string') continue;
      // Skip: Expo Router-specific files, config files, hidden files, images
      if (
        path.startsWith('app/') ||
        path.startsWith('.') ||
        path.endsWith('.png') ||
        path.endsWith('.jpg') ||
        path === 'package.json' ||
        path === 'app.json' ||
        path === 'tsconfig.json' ||
        path === 'babel.config.js'
      ) continue;

      code[path] = { type: 'CODE', contents: resolveAliases(content, path) };
    }

    // ── Inject our self-contained App.js ──────────────────────────────────────
    code['App.js'] = {
      type: 'CODE',
      contents: buildSnackApp(screens, colors, appName, files),
    };

    // ── Pin stable dependencies (React Navigation based, no Expo Router) ──────
    const dependencies: Record<string, SnackDep> = {
      '@react-navigation/native':       { version: '^6.1.18' },
      '@react-navigation/bottom-tabs':  { version: '^6.6.1' },
      'react-native-screens':           { version: '~3.31.1' },
      'react-native-safe-area-context': { version: '4.10.5' },
      '@expo/vector-icons':             { version: '^14.0.2' },
      'expo-status-bar':                { version: '~1.12.1' },
    };

    // ── Call Expo Snack API ───────────────────────────────────────────────────
    const response = await fetch('https://exp.host/--/api/v2/snack/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manifest: {
          name: appName,
          description: 'Generated by Cordneed',
          sdkVersion: '51.0.0',
        },
        code,
        dependencies,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Snack API] Error:', errorText);
      return NextResponse.json({ message: 'Expo Snack API rejected payload' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ id: data.id });

  } catch (error) {
    console.error('[/api/snack] Error:', error);
    return NextResponse.json({ message: 'Failed to generate Snack' }, { status: 500 });
  }
}
