import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export interface AppArchitecture {
  appType: string;
  suggestedName: string;
  description: string;
  screens: string[];
  features: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  colorTheme: string;
  primaryColor: string;
}

const ANALYZE_TIMEOUT_MS = 15_000;

/** Use Mistral to decompose a user prompt into an app architecture blueprint */
export async function analyzePrompt(prompt: string): Promise<AppArchitecture> {
  const systemPrompt = `You are an expert mobile app architect. Analyze the user's app idea and return a JSON architecture blueprint.

RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no code blocks.
2. The JSON must match this exact shape:
{
  "appType": "one of: e-commerce | social | productivity | fitness | education | finance | entertainment | travel | food | other",
  "suggestedName": "A short, catchy app name",
  "description": "One sentence describing what the app does",
  "screens": ["Screen1", "Screen2", "Screen3"],
  "features": ["feature1", "feature2", "feature3"],
  "complexity": "simple | moderate | complex",
  "colorTheme": "A brief color palette description e.g. 'dark purple with gold accents'",
  "primaryColor": "A hex color code e.g. #6C3DE8"
}
3. screens: 3-8 main screens the app will have
4. features: 3-8 key technical features (auth, payments, camera, maps, etc.)
5. complexity: simple = 1-3 screens, moderate = 4-6, complex = 7+

Analyze this app idea: ${prompt}`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Mistral architecture analysis timed out')), ANALYZE_TIMEOUT_MS)
  );

  const analyzePromise = mistral.chat
    .complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.3,
      maxTokens: 512,
    })
    .then((res) => {
      const text = res.choices?.[0]?.message?.content ?? '';
      return parseArchitecture(text as string, prompt);
    });

  try {
    return await Promise.race([analyzePromise, timeoutPromise]);
  } catch (err) {
    console.warn('[Architect] Mistral failed, using heuristic fallback:', err);
    return buildFallbackArchitecture(prompt);
  }
}

function parseArchitecture(text: string, prompt: string): AppArchitecture {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  try {
    const parsed = JSON.parse(clean);
    // Validate required fields
    if (
      typeof parsed.appType === 'string' &&
      typeof parsed.suggestedName === 'string' &&
      Array.isArray(parsed.screens) &&
      Array.isArray(parsed.features)
    ) {
      return parsed as AppArchitecture;
    }
  } catch {
    // fall through
  }
  return buildFallbackArchitecture(prompt);
}

function buildFallbackArchitecture(prompt: string): AppArchitecture {
  const words = prompt.toLowerCase();
  const isEcom = /shop|store|buy|sell|product|cart/.test(words);
  const isSocial = /social|chat|message|friend|post|feed/.test(words);
  const isFitness = /fitness|workout|gym|health|exercise/.test(words);
  const isFinance = /finance|money|budget|expense|bank/.test(words);
  const isFood = /food|recipe|restaurant|meal|cook/.test(words);

  const appType = isEcom ? 'e-commerce' : isSocial ? 'social' : isFitness ? 'fitness'
    : isFinance ? 'finance' : isFood ? 'food' : 'productivity';

  const suggestedName = prompt.split(' ').slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('').replace(/[^a-zA-Z]/g, '') || 'MyApp';

  return {
    appType,
    suggestedName,
    description: `A ${appType} app: ${prompt.slice(0, 80)}`,
    screens: ['Home', 'Dashboard', 'Profile', 'Settings'],
    features: ['authentication', 'data persistence', 'navigation'],
    complexity: 'moderate',
    colorTheme: 'dark with vibrant accents',
    primaryColor: '#6C3DE8',
  };
}
