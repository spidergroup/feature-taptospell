import fs from 'node:fs';
import path from 'node:path';
import { validateSpellingLevelsList, type SpellingLevelConfig } from '../src/data/levels/schema';
import { GRADE_LABELS, type GradeNumber, type WordEntry } from '../src/data/words/schema';

const LEVELS_PATH = path.resolve(process.cwd(), 'src/data/levels/spelling.json');
const WORDS_DIR = path.resolve(process.cwd(), 'src/data/words');

const GRADE_FILES: Record<GradeNumber, string> = {
  0: 'grade-pre-k.json',
  1: 'grade-k.json',
  2: 'grade-1.json',
  3: 'grade-2.json',
  4: 'grade-3.json',
};

function main() {
  if (!fs.existsSync(LEVELS_PATH)) {
    console.error(`ERROR: Missing levels file at ${LEVELS_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));
  const result = validateSpellingLevelsList(raw);
  if (!result.valid) {
    console.error('ERROR: Invalid spelling.json configuration:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const levels = raw as SpellingLevelConfig[];

  for (const [gradeStr, filename] of Object.entries(GRADE_FILES)) {
    const grade = Number(gradeStr) as GradeNumber;
    const filePath = path.join(WORDS_DIR, filename);
    const words = JSON.parse(fs.readFileSync(filePath, 'utf8')) as WordEntry[];
    const picturable = words.filter((w) => w.picturable);

    for (const level of levels) {
      const matching = picturable.filter(
        (w) =>
          w.word.length >= level.wordLength.min &&
          w.word.length <= level.wordLength.max &&
          level.difficulty.includes(w.difficulty)
      );
      if (matching.length < level.questionsPerRound) {
        console.warn(
          `WARN: ${GRADE_LABELS[grade]} × Level ${level.id} (${level.name}) has ${matching.length} strict matching picturable words (< questionsPerRound=${level.questionsPerRound}); nearest-length fallback will fill the round.`
        );
      }
    }
  }

  console.log('OK: Validated 5 spelling levels in src/data/levels/spelling.json.');
}

main();
