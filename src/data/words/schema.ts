export type WordDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Grade integer mapping matching D1 `links.grade`:
 * 0 = Pre-Primer (Pre-K)
 * 1 = Primer (Kindergarten)
 * 2 = 1st Grade
 * 3 = 2nd Grade
 * 4 = 3rd Grade
 */
export type GradeNumber = 0 | 1 | 2 | 3 | 4;

export interface WordEntry {
  word: string;
  grade: GradeNumber;
  difficulty: WordDifficulty;
  picturable: boolean;
  frequencyRank: number;
  phoneticGroup: string;
}

export const GRADE_LABELS: Record<GradeNumber, string> = {
  0: 'Pre-K',
  1: 'Kindergarten',
  2: '1st Grade',
  3: '2nd Grade',
  4: '3rd Grade',
};

export function isValidWordEntry(entry: unknown): entry is WordEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.word === 'string' &&
    e.word.trim().length > 0 &&
    /^[a-z]+$/.test(e.word) &&
    typeof e.grade === 'number' &&
    [0, 1, 2, 3, 4].includes(e.grade) &&
    typeof e.difficulty === 'string' &&
    ['easy', 'medium', 'hard'].includes(e.difficulty) &&
    typeof e.picturable === 'boolean' &&
    typeof e.frequencyRank === 'number' &&
    Number.isInteger(e.frequencyRank) &&
    e.frequencyRank >= 1 &&
    typeof e.phoneticGroup === 'string' &&
    e.phoneticGroup.trim().length > 0
  );
}

