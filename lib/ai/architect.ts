import Groq from 'groq-sdk';
import { fetchDesignContent } from './generate';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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

/** Use Groq to decompose a user prompt into an app architecture blueprint */
export async function analyzePrompt(prompt: string, designLink?: string): Promise<AppArchitecture> {
  let designContent = "";
  if (designLink && designLink.trim().length > 0) {
    designContent = await fetchDesignContent(designLink.trim());
  }

  const designInstructions = designContent
    ? `\nDESIGN REFERENCE CONTENT:\n"""\n${designContent}\n"""\n\nCRITICAL: The user provided the above design reference. You MUST base your architecture (screens, features, colorTheme, primaryColor) completely off of this design. Extract the relevant color palette and screen structures from the design.`
    : (designLink ? `\nCRITICAL: The user provided a design reference URL: ${designLink}. Use this as context if possible.` : "");

  const systemPrompt = `You are an expert mobile app architect, product designer, and UI motion strategist. Analyze the user's app idea and return a JSON architecture blueprint optimized for a beautiful, modern, highly animated, premium-looking app UI.

RULES:

1.Return ONLY valid JSON — no markdown, no explanation, no code blocks.
2.The JSON must match this exact shape:
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
3.screens: 3-8 main screens the app will have.
4.features: 3-8 key technical features.
5.complexity: simple = 1-3 screens, moderate = 4-6, complex = 7+.
6.The output must be designed for a premium UI experience, meaning:
 .modern visual hierarchy
 .smooth transitions
 .elegant spacing
 .glassmorphism / gradient / soft-shadow friendly design
 .strong hero section
 .animated cards, buttons, and screen transitions
 .polished onboarding and empty states
 .visually rich but not cluttered
7.Prefer UI that feels:
 .futuristic
 .clean
 .high-end
 .mobile-first
 .App Store quality
8.For every app idea, choose a colorTheme and primaryColor that match the app's mood and improve visual appeal.
9.Do not create a dull, plain, or minimal-only blueprint. Always optimize for a beautiful, engaging, animated interface.
10.If the idea is vague, infer a strong premium consumer app direction and still return the best possible JSON.

Analyze this app idea: "${prompt}"${designInstructions}`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Groq architecture analysis timed out')), ANALYZE_TIMEOUT_MS)
  );

  const analyzePromise = groq.chat.completions
    .create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.3,
      max_tokens: 512,
    })
    .then((res) => {
      const text = res.choices?.[0]?.message?.content ?? '';
      return parseArchitecture(text, prompt);
    });

  try {
    return await Promise.race([analyzePromise, timeoutPromise]);
  } catch (err) {
    console.warn('[Architect] Groq failed, using heuristic fallback:', err);
    return buildFallbackArchitecture(prompt);
  }
}

function parseArchitecture(text: string, prompt: string): AppArchitecture {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();

  // Extract JSON object if surrounded by other text
  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }

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
