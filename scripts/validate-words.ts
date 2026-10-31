import fs from 'node:fs';
import path from 'node:path';
import { isValidWordEntry, type WordEntry } from '../src/data/words/schema';

const WORDS_DIR = path.resolve(process.cwd(), 'src/data/words');
const IMAGES_DIR = path.resolve(process.cwd(), 'public/images/words');

const GRADE_FILES: Array<{ file: string; expectedGrade: number }> = [
  { file: 'grade-pre-k.json', expectedGrade: 0 },
  { file: 'grade-k.json', expectedGrade: 1 },
  { file: 'grade-1.json', expectedGrade: 2 },
  { file: 'grade-2.json', expectedGrade: 3 },
  { file: 'grade-3.json', expectedGrade: 4 },
];

export interface ValidationResult {
  valid: boolean;
  schemaErrors: string[];
  duplicates: string[];
  missingImages: string[];
  totalWords: number;
  picturableWords: number;
}

export function validateWordLists(
  wordsDir = WORDS_DIR,
  imagesDir = IMAGES_DIR,
  requireAllImages = false
): ValidationResult {
  const schemaErrors: string[] = [];
  const duplicates: string[] = [];
  const missingImages: string[] = [];
  const seenWords = new Map<string, string>();
  let totalWords = 0;
  let picturableWords = 0;

  for (const { file, expectedGrade } of GRADE_FILES) {
    const filePath = path.join(wordsDir, file);
    if (!fs.existsSync(filePath)) {
      schemaErrors.push(`Missing grade file: ${file}`);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      schemaErrors.push(`Invalid JSON in ${file}: ${(err as Error).message}`);
      continue;
    }

    if (!Array.isArray(parsed)) {
      schemaErrors.push(`${file} root must be a JSON array`);
      continue;
    }

    parsed.forEach((entry, idx) => {
      totalWords++;
      if (!isValidWordEntry(entry)) {
        schemaErrors.push(`${file}[${idx}] fails schema validation: ${JSON.stringify(entry)}`);
        return;
      }

      const typedEntry = entry as WordEntry;
      if (typedEntry.grade !== expectedGrade) {
        schemaErrors.push(
          `${file}[${idx}] ("${typedEntry.word}") has grade=${typedEntry.grade}, expected ${expectedGrade}`
        );
      }

      const prevFile = seenWords.get(typedEntry.word);
      if (prevFile) {
        duplicates.push(`Duplicate word "${typedEntry.word}" in ${file} (already in ${prevFile})`);
      } else {
        seenWords.set(typedEntry.word, file);
      }

      if (typedEntry.picturable) {
        picturableWords++;
        const imgPath = path.join(imagesDir, `${typedEntry.word}.webp`);
        if (!fs.existsSync(imgPath)) {
          missingImages.push(typedEntry.word);
        }
      }
    });
  }

  const valid =
    schemaErrors.length === 0 &&
    duplicates.length === 0 &&
    (!requireAllImages || missingImages.length === 0);

  return {
    valid,
    schemaErrors,
    duplicates,
    missingImages,
    totalWords,
    picturableWords,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const requireAllImages = process.argv.includes('--require-all-images');
  const result = validateWordLists(WORDS_DIR, IMAGES_DIR, requireAllImages);

  console.log(`Checked ${result.totalWords} words (${result.picturableWords} picturable).`);

  if (result.schemaErrors.length > 0) {
    console.error('Schema Errors:\n  - ' + result.schemaErrors.join('\n  - '));
  }
  if (result.duplicates.length > 0) {
    console.error('Duplicates:\n  - ' + result.duplicates.join('\n  - '));
  }
  if (result.missingImages.length > 0) {
    console.warn(
      `Picturable words missing .webp image (${result.missingImages.length}): ${result.missingImages.join(', ')}`
    );
  }

  if (!result.valid) {
    process.exit(1);
  }
}

