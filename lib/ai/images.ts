import { InferenceClient } from '@huggingface/inference';
import { createClient } from '@/lib/supabase/server';

// Models accessible via HuggingFace Inference API Serverless
const HF_MODEL   = 'stabilityai/stable-diffusion-xl-base-1.0'; 
const HF_FALLBACK = 'black-forest-labs/FLUX.1-schnell'; // High-quality, fast fallback

const IMAGE_TIMEOUT_MS = 40_000; // HF free inference can be slow (cold start)

async function runTextToImage(
  hf: InferenceClient,
  model: string,
  inputs: string
): Promise<Blob> {
  // Note: If you encounter 403 'insufficient permissions', ensure your token has Serverless API access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return hf.textToImage({ model, inputs, parameters: { width: 512, height: 512 } } as any) as unknown as Promise<Blob>;
}

/** Generate an app icon using Hugging Face and store it in Supabase Storage.
 *  Returns the public URL or null if generation/storage fails (non-blocking). */
export async function generateAndStoreAppIcon(
  projectId: string,
  appName: string,
  description: string,
  primaryColor: string = '#6C3DE8'
): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === 'your_huggingface_api_key') {
    console.warn('[Images] HuggingFace API key not set — skipping icon generation');
    return null;
  }

  // plain InferenceClient — provider is set per-call in runTextToImage args
  const hf = new InferenceClient(apiKey);

  const iconPrompt = [
    `App icon for "${appName}", ${description}.`,
    `Minimalist flat design, bold ${primaryColor} as primary color.`,
    'Clean vector style, rounded square frame, professional mobile app icon.',
    'No text, high contrast, 512x512.',
  ].join(' ');

  let blob: Blob | null = null;

  // ── Primary model ──────────────────────────────────────────────────────────
  try {
    const result = await Promise.race<Blob>([
      runTextToImage(hf, HF_MODEL, iconPrompt),
      new Promise<Blob>((_, reject) =>
        setTimeout(() => reject(new Error('HuggingFace timed out')), IMAGE_TIMEOUT_MS)
      ),
    ]);
    blob = result;
    console.log(`[Images] Icon generated via ${HF_MODEL}`);
  } catch (primaryErr) {
    console.warn(`[Images] ${HF_MODEL} failed:`, (primaryErr as Error).message);

    // ── Fallback model ───────────────────────────────────────────────────────
    try {
      const result = await Promise.race<Blob>([
        runTextToImage(hf, HF_FALLBACK, iconPrompt),
        new Promise<Blob>((_, reject) =>
          setTimeout(() => reject(new Error('Fallback timed out')), IMAGE_TIMEOUT_MS)
        ),
      ]);
      blob = result;
      console.log(`[Images] Icon generated via fallback ${HF_FALLBACK}`);
    } catch (fallbackErr) {
      console.warn('[Images] Fallback also failed — skipping icon:', (fallbackErr as Error).message);
      return null;
    }
  }

  if (!blob) return null;

  // ── Upload to Supabase Storage ─────────────────────────────────────────────
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = `icons/${projectId}.png`;

    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error('[Images] Supabase upload failed:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (storeErr) {
    console.error('[Images] Storage error:', storeErr);
    return null;
  }
}
