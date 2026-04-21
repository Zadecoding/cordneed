import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePrompt } from '@/lib/ai/architect';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, designLink } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    const architecture = await analyzePrompt(prompt.trim(), designLink);

    return NextResponse.json({ architecture });
  } catch (error) {
    console.error('[/api/analyze] Error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
