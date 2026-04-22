// import Groq from 'groq-sdk';
// import { fetchDesignContent } from './generate';

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// export interface AppArchitecture {
//   appType: string;
//   suggestedName: string;
//   description: string;
//   screens: string[];
//   features: string[];
//   complexity: 'simple' | 'moderate' | 'complex';
//   colorTheme: string;
//   primaryColor: string;
// }

// const ANALYZE_TIMEOUT_MS = 15_000;

// /** Use Groq to decompose a user prompt into an app architecture blueprint */
// export async function analyzePrompt(prompt: string, designLink?: string): Promise<AppArchitecture> {
//   let designContent = "";
//   if (designLink && designLink.trim().length > 0) {
//     designContent = await fetchDesignContent(designLink.trim());
//   }

//   const designInstructions = designContent
//     ? `\nDESIGN REFERENCE CONTENT:\n"""\n${designContent}\n"""\n\nCRITICAL: The user provided the above design reference. You MUST base your architecture (screens, features, colorTheme, primaryColor) completely off of this design. Extract the relevant color palette and screen structures from the design.`
//     : (designLink ? `\nCRITICAL: The user provided a design reference URL: ${designLink}. Use this as context if possible.` : "");

//   const systemPrompt = `You are a world-class mobile app product architect, UI/UX designer, and animation-first React Native builder.

// Your job is to take the user's app idea and generate a complete, unique, premium mobile app plan that never feels dull, repetitive, or generic.

// IMPORTANT GOAL:
// Design an app that feels modern, polished, high-end, and emotionally engaging. Every screen must have a clear purpose, a strong visual hierarchy, and at least one premium UI or motion idea. Avoid boring CRUD layouts, plain lists, empty white pages, and generic dashboard screens.

// RETURN FORMAT:
// Return ONLY valid JSON — no markdown, no explanation, no code blocks. The JSON must match this exact shape:
// {
//   "appType": "one of: e-commerce | social | productivity | fitness | education | finance | entertainment | travel | food | other",
//   "suggestedName": "A short, catchy app name",
//   "description": "One sentence describing what the app does",
//   "screens": ["Screen1", "Screen2", "Screen3"],
//   "features": ["feature1", "feature2", "feature3"],
//   "complexity": "simple | moderate | complex",
//   "colorTheme": "A brief color palette description e.g. 'dark purple with gold accents'",
//   "primaryColor": "A hex color code e.g. #6C3DE8"
// }
// Do not be vague. Do not skip screens. Do not reuse the same screen pattern for everything.

// CORE RULES:
// 1. First deeply understand the user's idea and infer the best possible version of the app.
// 2. Generate all necessary screens cautiously and completely.
// 3. Include only screens that are truly useful, but never miss important ones.
// 4. Make each screen visually distinct, purposeful, and premium.
// 5. Every screen should include a clear layout direction, content hierarchy, and animation approach.
// 6. Always think about onboarding, empty states, loading states, error states, success states, and navigation flow.
// 7. No dull screens. No plain forms without styling. No lifeless cards. No boring default UI.
// 8. Use modern design patterns like: glassmorphism, gradients, soft shadows, floating cards, animated hero sections, smooth bottom navigation, parallax headers, motion micro-interactions, premium empty states, skeleton loading, swipe gestures, transitions between screens.
// 9. Make the app feel like a top-tier product from a startup with a great design team.
// 10. The app must feel unique, not copied from common templates.

// SCREEN GENERATION RULES:
// - Include 3 to 10 screens depending on the app idea.
// - Every screen should have a unique role.
// - Do not create duplicate or near-duplicate screens.
// - Add screens for discovery, onboarding, main action, detail view, settings, profile, history, and checkout only when relevant.
// - If the app needs fewer screens, still make them rich and complete.
// - If the app is complex, include all major user journeys.

// UI QUALITY RULES:
// - Use strong visual hierarchy.
// - Make primary actions obvious.
// - Use bold headers and premium typography.
// - Use interactive elements that feel alive.
// - Make buttons, cards, tabs, and nav feel animated and tactile.
// - Choose a color theme that matches the app's mood.
// - Make the design suitable for mobile first.
// - Make the app feel "App Store ready."

// ANIMATION RULES:
// Every app should include motion suggestions such as: page transitions, card hover or tap lift, loading shimmer, subtle floating elements, animated counters, expanding sections, smooth modals, staggered list entry, progress animations, gesture-driven interactions.

// QUALITY CHECK BEFORE FINAL OUTPUT:
// Before responding, verify:
// - Did I return ONLY valid JSON matching the exact shape?
// - Did I include all important screens?
// - Does every screen add value?
// - Does the app feel premium and animated?
// - Are the UI patterns varied enough?
// - Did I avoid dull or generic layouts?
// - Did I make the app unique to the user's idea?

// NOW analyze the user's app idea and generate the best possible premium app blueprint with complete screens, features, animations, and design direction: "${prompt}"${designInstructions}`;

//   const timeoutPromise = new Promise<never>((_, reject) =>
//     setTimeout(() => reject(new Error('Groq architecture analysis timed out')), ANALYZE_TIMEOUT_MS)
//   );

//   const analyzePromise = groq.chat.completions
//     .create({
//       model: 'llama-3.3-70b-versatile',
//       messages: [{ role: 'user', content: systemPrompt }],
//       temperature: 0.3,
//       max_tokens: 512,
//     })
//     .then((res) => {
//       const text = res.choices?.[0]?.message?.content ?? '';
//       return parseArchitecture(text, prompt);
//     });

//   try {
//     return await Promise.race([analyzePromise, timeoutPromise]);
//   } catch (err) {
//     console.warn('[Architect] Groq failed, using heuristic fallback:', err);
//     return buildFallbackArchitecture(prompt);
//   }
// }

// function parseArchitecture(text: string, prompt: string): AppArchitecture {
//   let clean = text.trim();
//   if (clean.startsWith('```json')) clean = clean.slice(7);
//   if (clean.startsWith('```')) clean = clean.slice(3);
//   if (clean.endsWith('```')) clean = clean.slice(0, -3);
//   clean = clean.trim();

//   // Extract JSON object if surrounded by other text
//   const first = clean.indexOf('{');
//   const last = clean.lastIndexOf('}');
//   if (first !== -1 && last !== -1 && last > first) {
//     clean = clean.slice(first, last + 1);
//   }

//   try {
//     const parsed = JSON.parse(clean);
//     // Validate required fields
//     if (
//       typeof parsed.appType === 'string' &&
//       typeof parsed.suggestedName === 'string' &&
//       Array.isArray(parsed.screens) &&
//       Array.isArray(parsed.features)
//     ) {
//       return parsed as AppArchitecture;
//     }
//   } catch {
//     // fall through
//   }
//   return buildFallbackArchitecture(prompt);
// }

// function buildFallbackArchitecture(prompt: string): AppArchitecture {
//   const words = prompt.toLowerCase();
//   const isEcom = /shop|store|buy|sell|product|cart/.test(words);
//   const isSocial = /social|chat|message|friend|post|feed/.test(words);
//   const isFitness = /fitness|workout|gym|health|exercise/.test(words);
//   const isFinance = /finance|money|budget|expense|bank/.test(words);
//   const isFood = /food|recipe|restaurant|meal|cook/.test(words);

//   const appType = isEcom ? 'e-commerce' : isSocial ? 'social' : isFitness ? 'fitness'
//     : isFinance ? 'finance' : isFood ? 'food' : 'productivity';

//   const suggestedName = prompt.split(' ').slice(0, 3)
//     .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//     .join('').replace(/[^a-zA-Z]/g, '') || 'MyApp';

//   return {
//     appType,
//     suggestedName,
//     description: `A ${appType} app: ${prompt.slice(0, 80)}`,
//     screens: ['Home', 'Dashboard', 'Profile', 'Settings'],
//     features: ['authentication', 'data persistence', 'navigation'],
//     complexity: 'moderate',
//     colorTheme: 'dark with vibrant accents',
//     primaryColor: '#6C3DE8',
//   };
// }


import Groq from 'groq-sdk';
import { fetchDesignContent } from './generate';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

type Complexity = 'simple' | 'moderate' | 'complex';

export interface AppScreen {
  name: string;
  purpose: string;
  layout: string;
  uiStyle: string;
  animations: string[];
}

export interface AppFeature {
  name: string;
  value: string;
}

export interface AppArchitecture {
  appType: string;
  suggestedName: string;
  tagline: string;
  description: string;
  targetAudience: string;
  screens: AppScreen[];
  features: AppFeature[];
  monetization: string[];
  complexity: Complexity;
  colorTheme: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
  designStyle: string;
  motionStyle: string;
  navigationStyle: string;
  heroStyle: string;
  emptyStateStyle: string;
  premiumTouches: string[];
}

const ANALYZE_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are Cordneed AI, a world-class mobile app architect, UI/UX designer, motion designer, and product strategist.

Your job is to transform any user idea into a premium, highly animated, visually unique mobile app blueprint that is suitable for generating an App Store quality app.

You must avoid dull, generic, template-like, or basic CRUD-style outputs.

HARD RULES:
1. Return ONLY valid JSON.
2. No markdown, no code fences, no explanation, no extra text.
3. The JSON must follow the exact schema requested.
4. The app must feel premium, modern, animated, and polished.
5. Each screen must have a unique purpose and distinct UI treatment.
6. Always include motion ideas for every screen.
7. Prefer glassmorphism, gradients, soft shadows, premium typography, floating cards, and strong visual hierarchy.
8. Never generate a boring default app with only Home / Dashboard / Profile / Settings unless truly justified.
9. Infer the best possible version of the app idea even if the user prompt is vague.
10. Make it feel like a top-tier startup product.

OUTPUT JSON SHAPE:
{
  "appType": "one of: e-commerce | social | productivity | fitness | education | finance | entertainment | travel | food | ai | business | creator | lifestyle | health | other",
  "suggestedName": "short premium brandable app name",
  "tagline": "one-line marketing tagline",
  "description": "one sentence describing what the app does",
  "targetAudience": "who this app is for",
  "screens": [
    {
      "name": "Screen Name",
      "purpose": "what this screen does",
      "layout": "brief layout description",
      "uiStyle": "premium UI style for this screen",
      "animations": ["animation1", "animation2"]
    }
  ],
  "features": [
    {
      "name": "Feature Name",
      "value": "why users love it"
    }
  ],
  "monetization": ["subscription", "ads", "one-time purchase", "freemium", "marketplace", "other"],
  "complexity": "simple | moderate | complex",
  "colorTheme": "premium palette description",
  "primaryColor": "#000000",
  "secondaryColor": "#000000",
  "fontStyle": "modern font style",
  "designStyle": "glassmorphism | neumorphism | futuristic | luxury minimal | vibrant modern | dark premium",
  "motionStyle": "smooth, premium, micro-interactions, fluid transitions",
  "navigationStyle": "bottom tabs | top tabs | side menu | guided flow | mixed",
  "heroStyle": "short description of the home/landing hero",
  "emptyStateStyle": "how empty states should look and feel",
  "premiumTouches": ["touch1", "touch2", "touch3"]
}

SCREEN RULES:
- 3 to 10 screens depending on app complexity.
- Every screen must be useful and visually distinct.
- Include onboarding, discovery, main action, detail, settings, profile, history, or checkout only when relevant.
- Add animations to every screen.
- Never repeat the same screen pattern across all screens.

QUALITY CHECK:
Before responding, verify:
- JSON is valid and complete.
- Screens are rich and non-basic.
- UI feels premium and animated.
- The output is unique to the user’s idea.
- No dull screens, no generic layout planning.

Now generate the best possible app blueprint.`;

function inferCategory(prompt: string): string {
  const words = prompt.toLowerCase();
  const isEcom = /shop|store|buy|sell|product|cart|checkout|catalog/.test(words);
  const isSocial = /social|chat|message|friend|post|feed|community|follow/.test(words);
  const isFitness = /fitness|workout|gym|health|exercise|wellness|training/.test(words);
  const isFinance = /finance|money|budget|expense|bank|investment|crypto|wallet/.test(words);
  const isFood = /food|recipe|restaurant|meal|cook|delivery|cafe/.test(words);
  const isTravel = /travel|trip|hotel|flight|tour|booking|itinerary/.test(words);
  const isEdu = /learn|education|course|study|class|tutor|school|exam/.test(words);
  const isEntertainment = /music|video|movie|game|entertainment|stream|podcast/.test(words);
  const isAi = /ai|assistant|generator|prompt|automation|workflow|chatgpt|llm/.test(words);
  const isBusiness = /business|crm|sales|lead|client|invoice|company|startup|saas/.test(words);
  const isCreator = /creator|content|design|video edit|editing|publish|studio|portfolio/.test(words);
  const isLifestyle = /lifestyle|habit|daily|planner|journal|routine|self care/.test(words);
  const isHealth = /doctor|medical|clinic|healthcare|symptom|medicine|appointment/.test(words);

  if (isEcom) return 'e-commerce';
  if (isSocial) return 'social';
  if (isFitness) return 'fitness';
  if (isFinance) return 'finance';
  if (isFood) return 'food';
  if (isTravel) return 'travel';
  if (isEdu) return 'education';
  if (isEntertainment) return 'entertainment';
  if (isAi) return 'ai';
  if (isBusiness) return 'business';
  if (isCreator) return 'creator';
  if (isLifestyle) return 'lifestyle';
  if (isHealth) return 'health';
  return 'other';
}

function generateFallbackName(prompt: string): string {
  const words = prompt
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  if (words.length === 0) return 'CordFlow';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
    .slice(0, 18);
}

function colorFromCategory(appType: string): { primary: string; secondary: string; theme: string } {
  switch (appType) {
    case 'e-commerce':
      return { primary: '#6C3DE8', secondary: '#F59E0B', theme: 'deep violet with warm gold accents' };
    case 'social':
      return { primary: '#2563EB', secondary: '#EC4899', theme: 'electric blue with vibrant pink accents' };
    case 'fitness':
      return { primary: '#16A34A', secondary: '#14B8A6', theme: 'fresh emerald with teal accents' };
    case 'finance':
      return { primary: '#0F766E', secondary: '#22C55E', theme: 'dark teal with emerald accents' };
    case 'food':
      return { primary: '#EA580C', secondary: '#F97316', theme: 'warm orange with coral accents' };
    case 'travel':
      return { primary: '#0284C7', secondary: '#8B5CF6', theme: 'ocean blue with lavender accents' };
    case 'education':
      return { primary: '#4F46E5', secondary: '#06B6D4', theme: 'indigo with cyan accents' };
    case 'entertainment':
      return { primary: '#7C3AED', secondary: '#DB2777', theme: 'purple with neon magenta accents' };
    case 'ai':
      return { primary: '#111827', secondary: '#8B5CF6', theme: 'dark graphite with neon violet accents' };
    case 'business':
      return { primary: '#1D4ED8', secondary: '#0EA5E9', theme: 'royal blue with sky accents' };
    case 'creator':
      return { primary: '#9333EA', secondary: '#F43F5E', theme: 'creative violet with rose accents' };
    case 'lifestyle':
      return { primary: '#8B5CF6', secondary: '#22D3EE', theme: 'soft violet with cyan accents' };
    case 'health':
      return { primary: '#059669', secondary: '#38BDF8', theme: 'calm green with sky accents' };
    default:
      return { primary: '#6C3DE8', secondary: '#22D3EE', theme: 'dark purple with cyan accents' };
  }
}

function complexityFromScreens(count: number): Complexity {
  if (count <= 3) return 'simple';
  if (count <= 6) return 'moderate';
  return 'complex';
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function normalizeScreens(value: unknown, fallback: AppScreen[]): AppScreen[] {
  if (!Array.isArray(value)) return fallback;

  const screens = value
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          name: item.trim(),
          purpose: `Core screen ${index + 1} for the app flow.`,
          layout: 'premium card-based layout with clear hierarchy',
          uiStyle: 'glassmorphism with smooth gradients',
          animations: ['fade-in transition', 'staggered card reveal'],
        } satisfies AppScreen;
      }

      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : `Screen ${index + 1}`;
        const purpose = typeof obj.purpose === 'string' ? obj.purpose.trim() : 'Main app screen';
        const layout = typeof obj.layout === 'string'
          ? obj.layout.trim()
          : 'premium mobile-first layout with hero section and floating cards';
        const uiStyle = typeof obj.uiStyle === 'string'
          ? obj.uiStyle.trim()
          : 'modern premium UI with gradients, rounded cards, and soft shadows';
        const animations = normalizeStringArray(obj.animations, ['page transition', 'micro-interactions']);

        return { name, purpose, layout, uiStyle, animations } satisfies AppScreen;
      }

      return null;
    })
    .filter((v): v is AppScreen => Boolean(v));

  return screens.length ? screens : fallback;
}

function normalizeFeatures(value: unknown, fallback: AppFeature[]): AppFeature[] {
  if (!Array.isArray(value)) return fallback;

  const features = value
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          name: item.trim(),
          value: 'Useful core capability',
        } satisfies AppFeature;
      }

      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name.trim() : `Feature ${index + 1}`;
        const featureValue = typeof obj.value === 'string' ? obj.value.trim() : 'Useful core capability';
        return { name, value: featureValue } satisfies AppFeature;
      }

      return null;
    })
    .filter((v): v is AppFeature => Boolean(v));

  return features.length ? features : fallback;
}

function normalizeArchitecture(parsed: unknown, prompt: string): AppArchitecture {
  const appType = typeof (parsed as Record<string, unknown>)?.appType === 'string'
    ? String((parsed as Record<string, unknown>).appType)
    : inferCategory(prompt);

  const suggestedName =
    typeof (parsed as Record<string, unknown>)?.suggestedName === 'string'
      ? String((parsed as Record<string, unknown>).suggestedName).trim()
      : generateFallbackName(prompt);

  const fallbackColors = colorFromCategory(appType);

  const fallbackScreens: AppScreen[] = [
    {
      name: 'Onboarding',
      purpose: 'Introduce the app value with a premium first impression.',
      layout: 'full-screen hero, feature cards, and one primary CTA',
      uiStyle: 'dark premium with gradient hero and floating elements',
      animations: ['hero fade-in', 'card stagger', 'CTA pulse'],
    },
    {
      name: 'Home',
      purpose: 'Show the main experience with engaging discovery content.',
      layout: 'hero banner, content feed, and floating action areas',
      uiStyle: 'glassmorphism cards with strong hierarchy and rich spacing',
      animations: ['parallax header', 'list stagger', 'card lift'],
    },
    {
      name: 'Detail',
      purpose: 'Display a focused deep-dive into a selected item or result.',
      layout: 'image-led top section, structured details, sticky CTA',
      uiStyle: 'premium detail page with layered panels and soft shadows',
      animations: ['expand transition', 'content reveal', 'button ripple'],
    },
  ];

  const rawScreens = normalizeScreens((parsed as Record<string, unknown>)?.screens, fallbackScreens);
  const rawFeatures = normalizeFeatures((parsed as Record<string, unknown>)?.features, [
    { name: 'Authentication', value: 'Secure sign-in and onboarding flow' },
    { name: 'Dynamic content', value: 'Responsive app content generation' },
    { name: 'Smooth navigation', value: 'Modern transitions and intuitive flow' },
  ]);

  const screenCount = rawScreens.length;
  const complexity =
    typeof (parsed as Record<string, unknown>)?.complexity === 'string' &&
      ['simple', 'moderate', 'complex'].includes(String((parsed as Record<string, unknown>).complexity))
      ? (String((parsed as Record<string, unknown>).complexity) as Complexity)
      : complexityFromScreens(screenCount);

  return {
    appType,
    suggestedName,
    tagline:
      typeof (parsed as Record<string, unknown>)?.tagline === 'string'
        ? String((parsed as Record<string, unknown>).tagline).trim()
        : 'Build a premium app from one prompt',
    description:
      typeof (parsed as Record<string, unknown>)?.description === 'string'
        ? String((parsed as Record<string, unknown>).description).trim()
        : `A ${appType} app built from the user prompt.`,
    targetAudience:
      typeof (parsed as Record<string, unknown>)?.targetAudience === 'string'
        ? String((parsed as Record<string, unknown>).targetAudience).trim()
        : 'People who want a polished, modern mobile experience',
    screens: rawScreens,
    features: rawFeatures,
    monetization: normalizeStringArray((parsed as Record<string, unknown>)?.monetization, ['freemium', 'subscription']),
    complexity,
    colorTheme:
      typeof (parsed as Record<string, unknown>)?.colorTheme === 'string'
        ? String((parsed as Record<string, unknown>).colorTheme).trim()
        : fallbackColors.theme,
    primaryColor:
      typeof (parsed as Record<string, unknown>)?.primaryColor === 'string'
        ? String((parsed as Record<string, unknown>).primaryColor).trim()
        : fallbackColors.primary,
    secondaryColor:
      typeof (parsed as Record<string, unknown>)?.secondaryColor === 'string'
        ? String((parsed as Record<string, unknown>).secondaryColor).trim()
        : fallbackColors.secondary,
    fontStyle:
      typeof (parsed as Record<string, unknown>)?.fontStyle === 'string'
        ? String((parsed as Record<string, unknown>).fontStyle).trim()
        : 'modern sans-serif with bold headings and clean body text',
    designStyle:
      typeof (parsed as Record<string, unknown>)?.designStyle === 'string'
        ? String((parsed as Record<string, unknown>).designStyle).trim()
        : 'dark premium',
    motionStyle:
      typeof (parsed as Record<string, unknown>)?.motionStyle === 'string'
        ? String((parsed as Record<string, unknown>).motionStyle).trim()
        : 'smooth, premium, micro-interactions, fluid transitions',
    navigationStyle:
      typeof (parsed as Record<string, unknown>)?.navigationStyle === 'string'
        ? String((parsed as Record<string, unknown>).navigationStyle).trim()
        : 'bottom tabs',
    heroStyle:
      typeof (parsed as Record<string, unknown>)?.heroStyle === 'string'
        ? String((parsed as Record<string, unknown>).heroStyle).trim()
        : 'bold hero section with premium CTA and floating visual elements',
    emptyStateStyle:
      typeof (parsed as Record<string, unknown>)?.emptyStateStyle === 'string'
        ? String((parsed as Record<string, unknown>).emptyStateStyle).trim()
        : 'beautiful empty states with illustrations, concise copy, and one clear action',
    premiumTouches: normalizeStringArray((parsed as Record<string, unknown>)?.premiumTouches, [
      'glassmorphism panels',
      'animated hero section',
      'premium micro-interactions',
    ]),
  };
}

/** Use Groq to decompose a user prompt into an app architecture blueprint */
export async function analyzePrompt(prompt: string, designLink?: string): Promise<AppArchitecture> {
  let designContent = '';

  if (designLink && designLink.trim().length > 0) {
    try {
      designContent = await fetchDesignContent(designLink.trim());
    } catch (error) {
      console.warn('[Architect] Failed to fetch design content:', error);
    }
  }

  const designInstructions = designContent
    ? `\n\nDESIGN REFERENCE CONTENT:
"""
${designContent}
"""

IMPORTANT:
- Use this as a strong visual reference.
- Extract the color mood, spacing, layout rhythm, and screen structure.
- Do not copy text exactly.
- Make the result feel inspired by the reference, but still unique and premium.`
    : designLink
      ? `\n\nDESIGN REFERENCE URL:
${designLink}
Use it only if it is accessible and relevant.`
      : '';

  const userPrompt = `USER APP IDEA:
${prompt}${designInstructions}`;

  const timeoutPromise = new Promise<never>((_, reject) => {
    const t = setTimeout(() => reject(new Error('Groq architecture analysis timed out')), ANALYZE_TIMEOUT_MS);
    void t;
  });

  const analyzePromise = groq.chat.completions
    .create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.15,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
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

  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }

  try {
    const parsed = JSON.parse(clean);
    return normalizeArchitecture(parsed, prompt);
  } catch (error) {
    console.warn('[Architect] JSON parse failed, falling back:', error);
    return buildFallbackArchitecture(prompt);
  }
}

function buildFallbackArchitecture(prompt: string): AppArchitecture {
  const appType = inferCategory(prompt);
  const colors = colorFromCategory(appType);
  const suggestedName = generateFallbackName(prompt);

  const fallbackScreensByType: Record<string, AppScreen[]> = {
    'e-commerce': [
      {
        name: 'Shop Home',
        purpose: 'Highlight featured products and high-conversion collections.',
        layout: 'hero banner, category chips, featured product grid, sticky cart entry',
        uiStyle: 'premium storefront with large product cards and gradient accents',
        animations: ['hero parallax', 'card stagger', 'add-to-cart bounce'],
      },
      {
        name: 'Product Detail',
        purpose: 'Show product images, variants, reviews, and strong purchase CTAs.',
        layout: 'image carousel, floating CTA bar, specs section, review cards',
        uiStyle: 'luxury product page with layered panels and soft shadows',
        animations: ['image carousel swipe', 'CTA glow', 'section expand'],
      },
      {
        name: 'Cart & Checkout',
        purpose: 'Drive purchase completion with a clean, high-trust checkout flow.',
        layout: 'order summary, payment methods, promo area, checkout button',
        uiStyle: 'clean premium checkout with focused hierarchy',
        animations: ['subtotal count-up', 'checkout button pulse', 'success check'],
      },
      {
        name: 'Profile',
        purpose: 'Manage user account, orders, addresses, and preferences.',
        layout: 'profile header, order history, saved items, settings shortcuts',
        uiStyle: 'soft card-based profile with elegant spacing',
        animations: ['profile header fade', 'list stagger', 'toggle morph'],
      },
    ],
    social: [
      {
        name: 'Feed',
        purpose: 'Show discovery posts with a visually rich social timeline.',
        layout: 'story row, post cards, reaction bar, composer shortcut',
        uiStyle: 'modern social feed with floating composer and rich cards',
        animations: ['post stagger', 'reaction micro-interactions', 'story scroll snap'],
      },
      {
        name: 'Create Post',
        purpose: 'Let users compose posts, media, and captions with ease.',
        layout: 'media picker, caption editor, audience selector, publish CTA',
        uiStyle: 'creative composer with layered panels and bold CTA',
        animations: ['sheet slide-up', 'button ripple', 'preview morph'],
      },
      {
        name: 'Messages',
        purpose: 'Enable fast private communication with polished chat UI.',
        layout: 'conversation list, chat threads, typing indicators, attachments',
        uiStyle: 'messenger-style premium chat with smooth bubbles',
        animations: ['message appear', 'typing dots', 'sheet transitions'],
      },
      {
        name: 'Profile',
        purpose: 'Show identity, stats, media, and social activity.',
        layout: 'profile hero, stats strip, tabbed content, highlights',
        uiStyle: 'creator-style profile with vivid visuals',
        animations: ['hero parallax', 'stats count-up', 'tab slide'],
      },
    ],
    ai: [
      {
        name: 'Prompt Studio',
        purpose: 'Turn user prompts into outputs with a premium first impression.',
        layout: 'hero input, example chips, recent prompts, generate CTA',
        uiStyle: 'futuristic dark interface with glowing input and glass cards',
        animations: ['input glow', 'button pulse', 'card fade-in'],
      },
      {
        name: 'Results',
        purpose: 'Show generated results with actions to edit, copy, and refine.',
        layout: 'result cards, code blocks, tabs, refinement actions',
        uiStyle: 'developer-friendly premium workspace with structured panels',
        animations: ['result reveal', 'copy toast', 'section expand'],
      },
      {
        name: 'History',
        purpose: 'Track previous generations, versions, and saves.',
        layout: 'timeline list, filters, version cards, quick reopen actions',
        uiStyle: 'organized, premium history drawer with soft shadows',
        animations: ['timeline slide', 'filter chip morph', 'card lift'],
      },
      {
        name: 'Settings',
        purpose: 'Manage model, style, billing, and preferences.',
        layout: 'grouped settings panels with switch controls and sliders',
        uiStyle: 'clean control center with clear hierarchy',
        animations: ['toggle spring', 'panel expand', 'subtle fade'],
      },
    ],
  };

  const fallbackScreens =
    fallbackScreensByType[appType] ?? [
      {
        name: 'Onboarding',
        purpose: 'Introduce the app value and guide the first action.',
        layout: 'full-screen hero, benefit cards, and a prominent CTA',
        uiStyle: 'premium mobile-first layout with gradient hero and floating panels',
        animations: ['hero fade-in', 'card stagger', 'CTA pulse'],
      },
      {
        name: 'Home',
        purpose: 'Present the main experience with a polished layout.',
        layout: 'hero header, featured content, and action cards',
        uiStyle: 'glassmorphism cards with strong hierarchy and balanced spacing',
        animations: ['parallax header', 'list stagger', 'card lift'],
      },
      {
        name: 'Detail',
        purpose: 'Allow focused interaction with a selected item or result.',
        layout: 'visual top section, structured details, sticky CTA',
        uiStyle: 'premium detail screen with layered panels and smooth shadows',
        animations: ['expand transition', 'content reveal', 'button ripple'],
      },
      {
        name: 'Profile',
        purpose: 'Manage account, preferences, and saved content.',
        layout: 'profile hero, stats, tabs, and saved items',
        uiStyle: 'soft card-based profile with elegant spacing',
        animations: ['profile fade', 'stats count-up', 'tab slide'],
      },
    ];

  return {
    appType,
    suggestedName,
    tagline: 'Build a premium app from one prompt',
    description: `A ${appType} app built from the user's idea with a premium, animated UI.`,
    targetAudience: 'Users who want a polished, modern mobile experience',
    screens: fallbackScreens,
    features: [
      { name: 'Authentication', value: 'Secure sign-in and onboarding flow' },
      { name: 'Premium UI', value: 'Animated, App Store-quality visual design' },
      { name: 'Smooth navigation', value: 'Modern transitions and intuitive flow' },
      { name: 'Responsive layouts', value: 'Mobile-first screens that adapt beautifully' },
    ],
    monetization: ['freemium', 'subscription'],
    complexity: complexityFromScreens(fallbackScreens.length),
    colorTheme: colors.theme,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    fontStyle: 'modern sans-serif with bold headings and clean body text',
    designStyle: appType === 'ai' ? 'futuristic' : 'dark premium',
    motionStyle: 'smooth, premium, micro-interactions, fluid transitions',
    navigationStyle: 'bottom tabs',
    heroStyle: 'bold hero section with premium CTA and floating visual elements',
    emptyStateStyle: 'beautiful empty states with illustrations, concise copy, and one clear action',
    premiumTouches: ['glassmorphism panels', 'animated hero section', 'premium micro-interactions'],
  };
}