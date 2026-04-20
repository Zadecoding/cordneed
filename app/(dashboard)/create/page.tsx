'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Wand2, ChevronRight, Loader2, CheckCircle2, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  { label: '🏃 Fitness Tracker', prompt: 'Build a fitness tracker app with workout logging, progress charts, calorie counter, and dark mode' },
  { label: '🛒 E-Commerce', prompt: 'Create an e-commerce app with product listings, cart, checkout flow, and order history' },
  { label: '📝 Todo & Kanban', prompt: 'Build a task manager app with drag-and-drop kanban board, due dates, and categories' },
  { label: '💬 Social Feed', prompt: 'Make a social media app with posts feed, likes, comments, user profiles, and stories' },
  { label: '🧘 Meditation', prompt: 'Create a meditation app with guided sessions, breathing timer, mood tracker, and calming animations' },
  { label: '🍕 Food Delivery', prompt: 'Build a food delivery app with restaurant listing, menu, cart, real-time order tracking' },
  { label: '📚 Learning App', prompt: 'Build an e-learning app with video courses, quizzes, progress tracking, and certificates' },
  { label: '💰 Finance Tracker', prompt: 'Create a personal finance app with expense tracking, budgets, charts, and financial goals' },
];

const generationSteps = [
  'Analyzing your prompt...',
  'Designing app architecture...',
  'Generating screens & navigation...',
  'Building components...',
  'Adding authentication flow...',
  'Optimizing TypeScript types...',
  'Finalizing project structure...',
  'Almost done...',
];

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) { toast.error('Please describe your app first'); return; }

    setLoading(true);
    setCurrentStep(0);
    setDone(false);
    setErrorMsg(null);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= generationSteps.length - 1) { clearInterval(stepInterval); return prev; }
        return prev + 1;
      });
    }, 1800);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), name: appName.trim() || undefined }),
      });
      clearInterval(stepInterval);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }
      const { projectId } = await response.json();
      setDone(true);
      setTimeout(() => router.push(`/projects/${projectId}`), 1000);
    } catch (error: unknown) {
      clearInterval(stepInterval);
      setLoading(false);
      setCurrentStep(0);
      const message = error instanceof Error ? error.message : 'Generation failed. Please try again.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="p-6 lg:p-10 w-full" style={{ padding: '32px', maxWidth: '896px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Create New App
          </h1>
        </div>
        <p className="text-slate-400 text-sm ml-10">
          Describe your app in plain English and AI will generate the complete React Native code.
        </p>
      </div>

      {/* Generation loading UI */}
      {loading && (
        <div className="glass rounded-3xl border border-indigo-500/30 p-8 mb-8 text-center shadow-2xl">
          {done ? (
            <div>
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">App Generated!</h3>
              <p className="text-slate-400 text-sm">Redirecting to your project...</p>
            </div>
          ) : (
            <>
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-2xl animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                <div className="relative flex items-center justify-center h-full">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generating Your App</h3>
              <p className="text-indigo-300 text-sm font-medium mb-6">{generationSteps[currentStep]}</p>

              <div className="space-y-2 text-left max-w-xs mx-auto">
                {generationSteps.slice(0, currentStep + 1).map((step, i) => (
                  <div key={step}
                    className={`flex items-center gap-2 text-xs ${i === currentStep ? 'text-indigo-300' : 'text-slate-600'}`}>
                    {i < currentStep
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      : <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />}
                    {step}
                  </div>
                ))}
              </div>

              <div className="mt-6 w-full bg-slate-800 rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((currentStep + 1) / generationSteps.length) * 100, 95)}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">This may take 15–30 seconds</p>
            </>
          )}
        </div>
      )}
      {/* Error UI */}
      {errorMsg && !loading && (
        <div className="glass overflow-hidden rounded-3xl border border-rose-500/30 p-8 mb-8 text-center shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500" />
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center h-full bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <ServerCrash className="w-8 h-8 text-rose-400 animate-bounce delay-150" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Generation Overloaded</h3>
          <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
            {errorMsg.toLowerCase().includes('high demand') 
              ? "Google's AI models are currently experiencing extremely high demand. This is temporary. Please try again in a few moments."
              : errorMsg}
          </p>
          <button
            onClick={() => setErrorMsg(null)}
            className="px-8 py-3 bg-white hover:bg-rose-50 border border-white rounded-xl text-sm font-bold text-rose-600 transition-all duration-200 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]"
          >
            ← Back to Prompt
          </button>
        </div>
      )}

      {!loading && !errorMsg && (
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Prompt */}
          <div className="glass rounded-3xl border border-slate-800 p-5">
            <label className="block text-sm font-semibold text-white mb-3">
              Describe your app *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Build a fitness tracker app with login, workout logging, progress charts, and dark mode. Include a home screen with daily steps, a workout screen with exercise library, and a profile screen."
              className="input-glass w-full rounded-2xl text-sm resize-none"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-600">
                Be specific for better results — mention screens, features, and styling
              </span>
              <span className={`text-xs ${prompt.length > 500 ? 'text-amber-400' : 'text-slate-600'}`}>
                {prompt.length}
              </span>
            </div>
          </div>

          {/* App Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              App Name <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. FitTrack Pro"
              className="input-glass w-full rounded-xl text-sm"
            />
          </div>

          {/* Templates */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Or start from a template</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setPrompt(t.prompt)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                    prompt === t.prompt
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate App with AI
            <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-slate-600">
            Generation typically takes 15–30 seconds. The AI will create a complete React Native Expo project.
          </p>
        </form>
      )}
    </div>
  );
}
