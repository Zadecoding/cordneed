import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReactNativeApp } from '@/lib/ai/generate';
import { generateAndStoreAppIcon } from '@/lib/ai/images';
import type { AppArchitecture } from '@/lib/ai/architect';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, name, architecture } = (await request.json()) as {
      prompt: string;
      name?: string;
      architecture?: AppArchitecture;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    // ── Subscription check ──────────────────────────────────────────────────
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    const plan = subscription?.plan || 'free';
    const isPro = plan === 'pro' || user.email === 'imsanju4141@gmail.com';

    // ── Free plan quota ─────────────────────────────────────────────────────
    if (!isPro) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);

      if ((count ?? 0) >= 2) {
        return NextResponse.json(
          {
            message:
              'You have reached your free plan limit of 2 projects per month. Upgrade to Pro for unlimited projects.',
          },
          { status: 403 }
        );
      }
    }

    // ── Derive app name ─────────────────────────────────────────────────────
    const appName =
      name?.trim() ||
      architecture?.suggestedName ||
      prompt
        .split(' ')
        .slice(1, 5)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim() ||
      'My App';

    // ── Create project record ───────────────────────────────────────────────
    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: appName,
        prompt: prompt.trim(),
        status: 'generating',
        watermark: !isPro,
      })
      .select()
      .single();

    if (createError || !project) {
      return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
    }

    // ── Generate code (Gemini → Mistral → template) ─────────────────────────
    let files: Record<string, string>;
    try {
      files = await generateReactNativeApp(prompt.trim(), isPro, architecture);
    } catch (aiError) {
      await supabase.from('projects').update({ status: 'error' }).eq('id', project.id);
      throw aiError;
    }

    // ── Generate app icon (non-blocking — fire & forget) ────────────────────
    // We don't await this so it doesn't add to latency; it updates the row when done.
    generateAndStoreAppIcon(
      project.id,
      appName,
      architecture?.description ?? prompt.slice(0, 80),
      architecture?.primaryColor ?? '#6C3DE8'
    )
      .then(async (iconUrl) => {
        if (iconUrl) {
          await supabase.from('projects').update({ icon_url: iconUrl }).eq('id', project.id);
          console.log(`[Generate] Icon stored for project ${project.id}: ${iconUrl}`);
        }
      })
      .catch((err) => console.warn('[Generate] Icon gen error (non-fatal):', err));

    // ── Save generated files ────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        files,
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (updateError) {
      return NextResponse.json({ message: 'Failed to save project' }, { status: 500 });
    }

    return NextResponse.json({ projectId: project.id, name: appName });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
