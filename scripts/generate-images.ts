import fs from 'node:fs';
import path from 'node:path';
import type { WordEntry } from '../src/data/words/schema';

/**
 * Fixed style prompt locked per PRD Section 6.1 and Tasks 3.6–3.7.
 */
export const WORD_IMAGE_STYLE_PROMPT =
  'Clean mobile-first web app illustration for young children, flat vector illustration style, soft rounded corners, generous whitespace, warm pastel palette of cream background with teal and coral accents, no gradients, no drop shadows, no clutter, no text or letters anywhere in the image. Single clear centered illustration of:';

const WORDS_DIR = path.resolve(process.cwd(), 'src/data/words');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/images/words');
const GRADE_FILES = [
  'grade-pre-k.json',
  'grade-k.json',
  'grade-1.json',
  'grade-2.json',
  'grade-3.json',
];

export interface GenerateOptions {
  batchSize?: number;
  maxRetries?: number;
  sampleLimit?: number;
  onlyWord?: string;
}

async function generateSingleWordImage(
  word: string,
  apiKey: string,
  maxRetries = 3
): Promise<Buffer> {
  const prompt = `${WORD_IMAGE_STYLE_PROMPT} a friendly ${word}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              outputOptions: { mimeType: 'image/webp' },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string }>;
      };
      const base64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!base64) {
        throw new Error(`No image bytes returned for "${word}"`);
      }
      return Buffer.from(base64, 'base64');
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError ?? new Error(`Failed to generate image for "${word}"`);
}

export async function runImageGeneration(options: GenerateOptions = {}): Promise<void> {
  const batchSize = options.batchSize ?? 5;
  const maxRetries = options.maxRetries ?? 3;
  const apiKey = process.env.GEMINI_API_KEY ?? '';

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allPicturable: WordEntry[] = [];
  for (const file of GRADE_FILES) {
    const entries = JSON.parse(
      fs.readFileSync(path.join(WORDS_DIR, file), 'utf-8')
    ) as WordEntry[];
    for (const entry of entries) {
      if (entry.picturable) {
        allPicturable.push(entry);
      }
    }
  }

  let targets = allPicturable.filter(
    (entry) => !fs.existsSync(path.join(OUTPUT_DIR, `${entry.word}.webp`))
  );

  if (options.onlyWord) {
    targets = allPicturable.filter((e) => e.word === options.onlyWord);
  } else if (options.sampleLimit) {
    targets = targets.slice(0, options.sampleLimit);
  }

  console.log(`Generating ${targets.length} word image(s) in batches of ${batchSize}...`);

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        const outPath = path.join(OUTPUT_DIR, `${entry.word}.webp`);
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is required to call the Gemini image API.');
        }
        const buf = await generateSingleWordImage(entry.word, apiKey, maxRetries);
        fs.writeFileSync(outPath, buf);
        console.log(`Saved ${outPath}`);
      })
    );
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const sampleIdx = process.argv.indexOf('--sample');
  const wordIdx = process.argv.indexOf('--word');
  const sampleLimit = sampleIdx !== -1 ? Number(process.argv[sampleIdx + 1] || 10) : undefined;
  const onlyWord = wordIdx !== -1 ? process.argv[wordIdx + 1] : undefined;

  runImageGeneration({ sampleLimit, onlyWord }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

