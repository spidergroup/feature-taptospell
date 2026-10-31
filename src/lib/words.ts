import gradePreK from '../data/words/grade-pre-k.json';
import gradeK from '../data/words/grade-k.json';
import grade1 from '../data/words/grade-1.json';
import grade2 from '../data/words/grade-2.json';
import grade3 from '../data/words/grade-3.json';
import type { GradeNumber, WordEntry } from '../data/words/schema';

export type PracticeMode = 'read' | 'write';

export interface WordProgressStatus {
  word: string;
  mode: PracticeMode;
  attempts: number;
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

/**
 * Selects 10 words for a practice session:
 * 1. Previously-missed words first (attempts > 0 and mastered_at === null)
 * 2. Unseen words next (no progress record)
 * 3. Mastered words as fallback if missed + unseen < 10 (when a link has seen every word in its grade)
 *
 * For writing mode:
 * - Restricts exclusively to `picturable: true` words
 * - Escalates difficulty by ascending word length first, then removes the pre-filled first-letter hint
 */
export function selectSessionWords(
  grade: GradeNumber,
  mode: PracticeMode,
  existingProgress: WordProgressStatus[] = [],
  count: number = SESSION_WORD_COUNT
): SessionWordItem[] {
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
      // Stage 1: shorter words with first-letter hint on early items;
      // Stage 2: remove first-letter hint on later items in the session or once child has mastered words
      prefillFirstLetter: totalMasteredCount < 5 && idx < Math.ceil(lengthSorted.length / 2),
    }));
  }

  return combined.map((entry) => ({
    ...entry,
    prefillFirstLetter: false,
  }));
}

