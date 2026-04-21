import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Mistral } from '@mistralai/mistralai';

export const maxDuration = 60; // Vercel limit

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ─── Build the targeted-edit prompt ──────────────────────────────────────────

function buildEditPrompt(
  changeRequest: string,
  files: Record<string, string>
): string {
  // Only send the first ~4000 chars of each file to reduce token usage
  const filesSummary = Object.entries(files)
    .map(([path, content]) => {
      const preview = content.length > 2500 ? content.slice(0, 2500) + '\n... (truncated)' : content;
      return `=== ${path} ===\n${preview}`;
    })
    .join('\n\n');

  return `You are an expert React Native Expo developer. The user has an existing app and wants targeted changes made to it.

EXISTING PROJECT FILES:
${filesSummary}

USER'S CHANGE REQUEST:
${changeRequest}

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no explanation before or after.
2. The JSON must be an object where keys are ONLY the file paths that need to be changed.
3. ONLY include files you are actually modifying. Do NOT include unchanged files.
4. Return the COMPLETE new content for each modified file (not diffs — full file content).
5. You may create new files if the change requires them.
6. Keep all existing functionality intact unless explicitly asked to remove it.
7. The returned JSON shape: { "path/to/file.tsx": "full new content...", ... }

Make ONLY the changes needed to fulfill the request. Return the minimal set of files that need to change. start your response with { immediately.`;
}

// ─── Mistral Edit Call Logic ──────────────────────────────────────────────────

function parseEditOutput(raw: string): Record<string, string> | null {
  let text = raw.trim();

  // Strip markdown fences
  const jsonFence = text.match(/```json\s*([\s\S]*?)```/);
  const plainFence = text.match(/```\s*([\s\S]*?)```/);
  if (jsonFence) text = jsonFence[1].trim();
  else if (plainFence) text = plainFence[1].trim();

  // Slice from first { to last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch (err) {
    console.warn('[Edit] JSON parse failed:', (err as Error).message.slice(0, 50));
  }
  return null;
}

async function callMistralEdit(prompt: string, model: string, timeoutMs: number): Promise<Record<string, string> | null> {
  console.log(`[Edit] Mistral trying: ${model}`);
  try {
    const text = await Promise.race<string>([
      mistral.chat
        .complete({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          maxTokens: 12000,
        })
        .then((r) => (r.choices?.[0]?.message?.content as string) ?? ''),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return parseEditOutput(text);
  } catch (err) {
    console.warn(`[Edit] Mistral ${model} failed:`, (err as Error).message);
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { changeRequest } = await request.json();
    if (!changeRequest?.trim()) {
      return NextResponse.json({ message: 'Change request is required' }, { status: 400 });
    }

    // Fetch existing project files
    const { data: project } = await supabase
      .from('projects')
      .select('files, user_id')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    const existingFiles = (project.files as Record<string, string>) || {};

    // Build prompt and call AI (Mistral only)
    const editPrompt = buildEditPrompt(changeRequest.trim(), existingFiles);

    // Try mistral-small first (fast)
    let changedFiles = await callMistralEdit(editPrompt, 'mistral-small-latest', 45_000);
    
    // Fallback to mistral-large if small fails
    if (!changedFiles || Object.keys(changedFiles).length === 0) {
      console.log('[Edit] mistral-small failed or no files modified, falling back to mistral-large');
      changedFiles = await callMistralEdit(editPrompt, 'mistral-large-latest', 58_000);
    }

    if (!changedFiles || Object.keys(changedFiles).length === 0) {
      return NextResponse.json(
        { message: 'AI could not process the change request. Please try rephrasing.' },
        { status: 422 }
      );
    }

    console.log(`[Edit] Successfully modified ${Object.keys(changedFiles).length} files`);

    // Merge changed files into existing files
    const updatedFiles = { ...existingFiles, ...changedFiles };

    const { error: updateError } = await supabase
      .from('projects')
      .update({ files: updatedFiles, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ message: 'Failed to save changes' }, { status: 500 });
    }

    return NextResponse.json({
      changedFiles: Object.keys(changedFiles),
      files: updatedFiles,
    });
  } catch (error) {
    console.error('[/api/projects/:id/edit] Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Edit failed' },
      { status: 500 }
    );
  }
}
