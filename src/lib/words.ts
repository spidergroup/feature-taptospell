import gradePreK from '../data/words/grade-pre-k.json';
import gradeK from '../data/words/grade-k.json';
import grade1 from '../data/words/grade-1.json';
import grade2 from '../data/words/grade-2.json';
import grade3 from '../data/words/grade-3.json';
import type { GradeNumber, WordEntry } from '../data/words/schema';
import type { SpellingLevelConfig } from '../data/levels/schema';
import { getSpellingLevelConfig } from './levels';

export type PracticeMode = 'read' | 'write';

export interface WordProgressStatus {
  word: string;
  mode: PracticeMode;
  attempts: number;
  hints_used?: number;
  mastered_at: number | null;
}

export interface SessionWordItem extends WordEntry {
  prefillFirstLetter: boolean;
}

const WORDS_BY_GRADE: Record<GradeNumber, WordEntry[]> = {
  0: gradePreK as WordEntry[],
  1: gradeK as WordEntry[],
  2: grade1 as WordEntry[],
  3: grade2 as WordEntry[],
  4: grade3 as WordEntry[],
};

export const SESSION_WORD_COUNT = 10;

export function getWordsForGrade(grade: GradeNumber, mode?: PracticeMode): WordEntry[] {
  const list = WORDS_BY_GRADE[grade] ?? [];
  if (mode === 'write') {
    return list.filter((w) => w.picturable);
  }
  return [...list];
}

/**
 * Orders words by frequencyRank first, grouped with phoneticGroup tie-breaking.
 */
export function sortWordsByFrequencyAndPhonetics(words: WordEntry[]): WordEntry[] {
  const sortedByFreq = [...words].sort((a, b) => a.frequencyRank - b.frequencyRank);
  const groupOrder: string[] = [];
  const groups = new Map<string, WordEntry[]>();

  for (const word of sortedByFreq) {
    if (!groups.has(word.phoneticGroup)) {
      groupOrder.push(word.phoneticGroup);
      groups.set(word.phoneticGroup, []);
    }
    groups.get(word.phoneticGroup)!.push(word);
  }

  const result: WordEntry[] = [];
  for (const groupName of groupOrder) {
    const groupItems = groups.get(groupName)!;
    groupItems.sort((a, b) => a.frequencyRank - b.frequencyRank);
    result.push(...groupItems);
  }
  return result;
}

function distanceToRange(length: number, min: number, max: number): number {
  if (length < min) return min - length;
  if (length > max) return length - max;
  return 0;
}

/**
 * Selects words for a spelling round driven by a SpellingLevelConfig (PRD 4.3 #34, Task 12.4):
 * - Draws from the link's grade list (`picturable: true`), expanding to adjacent grades' picturable words only if the grade itself has fewer than `questionsPerRound` picturable words.
 * - Prefers words matching the level's `wordLength` and `difficulty`.
 * - Within matching words, orders previously-missed words first, then unseen words, then mastered words, each ordered by `frequencyRank` within `phoneticGroup`.
 * - If fewer than `questionsPerRound` words match strictly, fills the remainder from nearest word lengths without repeating any word in the round.
 * - Sets `prefillFirstLetter` from `levelConfig.prefillFirstLetter`.
 */
export function selectSpellingLevelWords(
  grade: GradeNumber,
  levelOrConfig: number | SpellingLevelConfig,
  existingProgress: WordProgressStatus[] = []
): SessionWordItem[] {
  const levelConfig =
    typeof levelOrConfig === 'number'
      ? getSpellingLevelConfig(levelOrConfig)
      : levelOrConfig;

  const targetCount = levelConfig.questionsPerRound;
  const gradePool = getWordsForGrade(grade, 'write');

  // If the grade has fewer picturable words than targetCount, supplement from other grades without duplicates
  const seenWords = new Set(gradePool.map((w) => w.word));
  const fullPool = [...gradePool];
  if (fullPool.length < targetCount) {
    for (const g of [0, 1, 2, 3, 4] as GradeNumber[]) {
      if (g === grade) continue;
      for (const w of getWordsForGrade(g, 'write')) {
        if (!seenWords.has(w.word)) {
          seenWords.add(w.word);
          fullPool.push(w);
        }
      }
    }
  }

  const progressMap = new Map<string, WordProgressStatus>();
  for (const row of existingProgress) {
    if (row.mode === 'write') {
      progressMap.set(row.word, row);
    }
  }

  const prioritizeBucket = (items: WordEntry[]): WordEntry[] => {
    const missed: WordEntry[] = [];
    const unseen: WordEntry[] = [];
    const mastered: WordEntry[] = [];

    for (const entry of items) {
      const status = progressMap.get(entry.word);
      if (!status) {
        unseen.push(entry);
      } else if (status.mastered_at === null && status.attempts > 0) {
        missed.push(entry);
      } else {
        mastered.push(entry);
      }
    }

    return [
      ...sortWordsByFrequencyAndPhonetics(missed),
      ...sortWordsByFrequencyAndPhonetics(unseen),
      ...sortWordsByFrequencyAndPhonetics(mastered),
    ];
  };

  const { min, max } = levelConfig.wordLength;
  const allowedDifficulties = new Set(levelConfig.difficulty);

  // Tier 1: exact length range + matching difficulty in grade
  const tier1 = gradePool.filter(
    (w) =>
      w.word.length >= min &&
      w.word.length <= max &&
      allowedDifficulties.has(w.difficulty)
  );

  // Tier 2: exact length range (any difficulty) in grade
  const tier1Set = new Set(tier1.map((w) => w.word));
  const tier2 = gradePool.filter(
    (w) => !tier1Set.has(w.word) && w.word.length >= min && w.word.length <= max
  );

  // Tier 3: remaining words in fullPool sorted by nearest word length distance, then priority
  const usedSoFar = new Set([...tier1, ...tier2].map((w) => w.word));
  const remaining = fullPool.filter((w) => !usedSoFar.has(w.word));

  const distanceBuckets = new Map<number, WordEntry[]>();
  for (const w of remaining) {
    const dist = distanceToRange(w.word.length, min, max);
    if (!distanceBuckets.has(dist)) {
      distanceBuckets.set(dist, []);
    }
    distanceBuckets.get(dist)!.push(w);
  }
  const sortedDistances = Array.from(distanceBuckets.keys()).sort((a, b) => a - b);
  const tier3Ordered: WordEntry[] = [];
  for (const d of sortedDistances) {
    tier3Ordered.push(...prioritizeBucket(distanceBuckets.get(d)!));
  }

  const chosen: WordEntry[] = [
    ...prioritizeBucket(tier1),
    ...prioritizeBucket(tier2),
    ...tier3Ordered,
  ].slice(0, targetCount);

  return chosen.map((entry) => ({
    ...entry,
    prefillFirstLetter: levelConfig.prefillFirstLetter,
  }));
}

/**
 * Selects words for a practice session (Tasks 5.1, 6.8, 12.4):
 * - When `levelOrConfig` is provided for `'write'` mode, delegates to `selectSpellingLevelWords`.
 * - Otherwise preserves backwards-compatible selection for reading and default sessions.
 */
export function selectSessionWords(
  grade: GradeNumber,
  mode: PracticeMode,
  existingProgress: WordProgressStatus[] = [],
  count: number = SESSION_WORD_COUNT,
  levelOrConfig?: number | SpellingLevelConfig
): SessionWordItem[] {
  if (mode === 'write' && levelOrConfig !== undefined) {
    return selectSpellingLevelWords(grade, levelOrConfig, existingProgress);
  }

  const pool = getWordsForGrade(grade, mode);
  const progressMap = new Map<string, WordProgressStatus>();

  for (const row of existingProgress) {
    if (row.mode === mode) {
      progressMap.set(row.word, row);
    }
  }

  const missed: WordEntry[] = [];
  const unseen: WordEntry[] = [];
  const mastered: WordEntry[] = [];

  for (const entry of pool) {
    const status = progressMap.get(entry.word);
    if (!status) {
      unseen.push(entry);
    } else if (status.mastered_at === null && status.attempts > 0) {
      missed.push(entry);
    } else {
      mastered.push(entry);
    }
  }

  const orderedMissed = sortWordsByFrequencyAndPhonetics(missed);
  const orderedUnseen = sortWordsByFrequencyAndPhonetics(unseen);
  const orderedMastered = sortWordsByFrequencyAndPhonetics(mastered);

  const combined = [...orderedMissed, ...orderedUnseen, ...orderedMastered].slice(0, count);

  if (mode === 'write') {
    const lengthSorted = [...combined].sort((a, b) => {
      if (a.word.length !== b.word.length) {
        return a.word.length - b.word.length;
      }
      return a.frequencyRank - b.frequencyRank;
    });

    const totalMasteredCount = mastered.length;
    return lengthSorted.map((entry, idx) => ({
      ...entry,
      prefillFirstLetter: totalMasteredCount < 5 && idx < Math.ceil(lengthSorted.length / 2),
    }));
  }

  return combined.map((entry) => ({
    ...entry,
    prefillFirstLetter: false,
  }));
}
