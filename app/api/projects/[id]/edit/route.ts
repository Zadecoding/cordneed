import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

export const maxDuration = 300; // Allow maximum Vercel limit for Pro workspaces

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Build the targeted-edit prompt ──────────────────────────────────────────

function buildEditPrompt(
  changeRequest: string,
  files: Record<string, string>
): string {
  // Only send the first ~2500 chars of each file to reduce token usage
  const filesSummary = Object.entries(files)
    .map(([path, content]) => {
      const preview = content.length > 2500 ? content.slice(0, 2500) + '\n... (truncated)' : content;
      return `=== ${path} ===\n${preview}`;
    })
    .join('\n\n');

  return `You are an expert React Native Expo developer. Your goal is to make a surgical change to a codebase.

EXISTING PROJECT FILES (partial context):
${filesSummary}

USER'S CHANGE REQUEST:
${changeRequest}

CRITICAL RULES FOR SURGICAL EDITS (FAILURE IS NOT AN OPTION):
1. Return ONLY valid JSON — no markdown, no explanation before or after.
2. The JSON keys MUST be exactly the file paths.
3. EXTREME IMPORTANCE: ONLY include files you are actually modifying to fulfill the request. If a file does not need to change, DO NOT output it.
4. If you output unchanged files, the system will fail. We only want the edited files.
5. For the files you DO modify, return their COMPLETE new content. No diffs.
6. The JSON shape: { "path/to/file.tsx": "full new content...", ... }

Start your response with { immediately and keep your output as short as possible.`;
}

// ─── Groq Edit Call Logic ─────────────────────────────────────────────────────

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

async function callGroqEdit(prompt: string, model: string): Promise<Record<string, string> | null> {
  console.log(`[Edit] Groq trying: ${model}`);
  try {
    const res = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 6000, // Reduced to fit under 12k TPM
    });

    const text = (res.choices?.[0]?.message?.content as string) ?? '';
    return parseEditOutput(text);
  } catch (err) {
    console.warn(`[Edit] Groq ${model} failed:`, (err as Error).message);
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

    // Build prompt and call Groq
    const editPrompt = buildEditPrompt(changeRequest.trim(), existingFiles);

    // Use llama-3.3-70b-versatile (fast, high quality, large context)
    let changedFiles = await callGroqEdit(editPrompt, 'llama-3.3-70b-versatile');

    // Fallback to smaller model if primary fails
    if (!changedFiles || Object.keys(changedFiles).length === 0) {
      console.warn('[Edit] Primary model failed, trying llama-3.1-8b-instant...');
      changedFiles = await callGroqEdit(editPrompt, 'llama-3.1-8b-instant');
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
