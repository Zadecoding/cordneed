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

  const systemPrompt = `You are a world-class mobile app product architect, UI/UX designer, and animation-first React Native builder.

Your job is to take the user's app idea and generate a complete, unique, premium mobile app plan that never feels dull, repetitive, or generic.

IMPORTANT GOAL:
Design an app that feels modern, polished, high-end, and emotionally engaging. Every screen must have a clear purpose, a strong visual hierarchy, and at least one premium UI or motion idea. Avoid boring CRUD layouts, plain lists, empty white pages, and generic dashboard screens.

RETURN FORMAT:
Return ONLY valid JSON — no markdown, no explanation, no code blocks. The JSON must match this exact shape:
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
Do not be vague. Do not skip screens. Do not reuse the same screen pattern for everything.

CORE RULES:
1. First deeply understand the user's idea and infer the best possible version of the app.
2. Generate all necessary screens cautiously and completely.
3. Include only screens that are truly useful, but never miss important ones.
4. Make each screen visually distinct, purposeful, and premium.
5. Every screen should include a clear layout direction, content hierarchy, and animation approach.
6. Always think about onboarding, empty states, loading states, error states, success states, and navigation flow.
7. No dull screens. No plain forms without styling. No lifeless cards. No boring default UI.
8. Use modern design patterns like: glassmorphism, gradients, soft shadows, floating cards, animated hero sections, smooth bottom navigation, parallax headers, motion micro-interactions, premium empty states, skeleton loading, swipe gestures, transitions between screens.
9. Make the app feel like a top-tier product from a startup with a great design team.
10. The app must feel unique, not copied from common templates.

SCREEN GENERATION RULES:
- Include 3 to 10 screens depending on the app idea.
- Every screen should have a unique role.
- Do not create duplicate or near-duplicate screens.
- Add screens for discovery, onboarding, main action, detail view, settings, profile, history, and checkout only when relevant.
- If the app needs fewer screens, still make them rich and complete.
- If the app is complex, include all major user journeys.

UI QUALITY RULES:
- Use strong visual hierarchy.
- Make primary actions obvious.
- Use bold headers and premium typography.
- Use interactive elements that feel alive.
- Make buttons, cards, tabs, and nav feel animated and tactile.
- Choose a color theme that matches the app's mood.
- Make the design suitable for mobile first.
- Make the app feel "App Store ready."

ANIMATION RULES:
Every app should include motion suggestions such as: page transitions, card hover or tap lift, loading shimmer, subtle floating elements, animated counters, expanding sections, smooth modals, staggered list entry, progress animations, gesture-driven interactions.

QUALITY CHECK BEFORE FINAL OUTPUT:
Before responding, verify:
- Did I return ONLY valid JSON matching the exact shape?
- Did I include all important screens?
- Does every screen add value?
- Does the app feel premium and animated?
- Are the UI patterns varied enough?
- Did I avoid dull or generic layouts?
- Did I make the app unique to the user's idea?

NOW analyze the user's app idea and generate the best possible premium app blueprint with complete screens, features, animations, and design direction: "${prompt}"${designInstructions}`;

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
