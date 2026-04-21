import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Mistral } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ─── Build the targeted-edit prompt ──────────────────────────────────────────

function buildEditPrompt(
  changeRequest: string,
  files: Record<string, string>
): string {
  // Only send the first ~4000 chars of each file to reduce token usage
  const filesSummary = Object.entries(files)
    .map(([path, content]) => {
      const preview = content.length > 2000 ? content.slice(0, 2000) + '\n... (truncated)' : content;
      return `=== ${path} ===\n${preview}`;
    })
    .join('\n\n');

  return `You are an expert React Native Expo developer. The user has an existing app and wants targeted changes made to it.

EXISTING PROJECT FILES:
${filesSummary}

USER'S CHANGE REQUEST:
${changeRequest}

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no code blocks.
2. The JSON must be an object where keys are ONLY the file paths that need to be changed.
3. ONLY include files you are actually modifying. Do NOT include unchanged files.
4. Return the COMPLETE new content for each modified file (not diffs — full file content).
5. You may create new files if the change requires them.
6. Keep all existing functionality intact unless explicitly asked to remove it.
7. The returned JSON shape: { "path/to/file.tsx": "full new content...", ... }

Make ONLY the changes needed to fulfill the request. Return the minimal set of files that need to change.`;
}

// ─── Try Gemini first, Mistral fallback ──────────────────────────────────────

async function applyEditsWithGemini(prompt: string): Promise<Record<string, string> | null> {
  const models = [
    'gemini-2.0-flash-lite',    // best free-tier quota
    'gemini-1.5-flash',         // stable free quota
    'gemini-1.5-pro',           // higher quality
  ];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await Promise.race<string>([
        model.generateContent(prompt).then((r) => r.response.text()),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 22_000)),
      ]);
      return parseEditOutput(result);
    } catch (err) {
      console.warn(`[Edit] Gemini ${modelName} failed:`, err);
    }
  }
  return null;
}

async function applyEditsWithMistral(prompt: string): Promise<Record<string, string> | null> {
  try {
    const res = await Promise.race<Record<string, string> | null>([
      mistral.chat
        .complete({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          maxTokens: 8192,
        })
        .then((r) => parseEditOutput(r.choices?.[0]?.message?.content as string ?? '')),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 50_000)),
    ]);
    return res;
  } catch (err) {
    console.warn('[Edit] Mistral fallback failed:', err);
    return null;
  }
}

function parseEditOutput(text: string): Record<string, string> | null {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.slice(7);
  if (clean.startsWith('```')) clean = clean.slice(3);
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  clean = clean.trim();
  try {
    const parsed = JSON.parse(clean);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch { /* fall through */ }
  return null;
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

    // Build prompt and call AI
    const editPrompt = buildEditPrompt(changeRequest.trim(), existingFiles);

    let changedFiles = await applyEditsWithGemini(editPrompt);
    if (!changedFiles) {
      changedFiles = await applyEditsWithMistral(editPrompt);
    }

    if (!changedFiles || Object.keys(changedFiles).length === 0) {
      return NextResponse.json(
        { message: 'AI could not process the change request. Please try rephrasing.' },
        { status: 422 }
      );
    }

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
