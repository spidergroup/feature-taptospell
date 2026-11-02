import type { WordDifficulty } from '../words/schema';

export type LevelId = 1 | 2 | 3 | 4 | 5;

export interface WordLengthRange {
  min: number;
  max: number;
}

export interface SpellingLevelConfig {
  id: LevelId;
  name: string;
  icon: string;
  wordLength: WordLengthRange;
  difficulty: WordDifficulty[];
  questionsPerRound: number;
  prefillFirstLetter: boolean;
  distractors?: number;
  pointsPerWord: number;
  wordsToAdvance: number;
}

export function isValidSpellingLevelConfig(entry: unknown): entry is SpellingLevelConfig {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  if (typeof e.id !== 'number' || ![1, 2, 3, 4, 5].includes(e.id)) return false;
  if (typeof e.name !== 'string' || e.name.trim().length === 0) return false;
  if (typeof e.icon !== 'string' || e.icon.trim().length === 0) return false;

  const wl = e.wordLength as Record<string, unknown> | undefined;
  if (
    !wl ||
    typeof wl !== 'object' ||
    typeof wl.min !== 'number' ||
    typeof wl.max !== 'number' ||
    !Number.isInteger(wl.min) ||
    !Number.isInteger(wl.max) ||
    wl.min < 1 ||
    wl.max < wl.min
  ) {
    return false;
  }

  if (
    !Array.isArray(e.difficulty) ||
    e.difficulty.length === 0 ||
    !e.difficulty.every(
      (d) => typeof d === 'string' && ['easy', 'medium', 'hard'].includes(d)
    )
  ) {
    return false;
  }

  if (
    typeof e.questionsPerRound !== 'number' ||
    !Number.isInteger(e.questionsPerRound) ||
    e.questionsPerRound < 1
  ) {
    return false;
  }

  if (typeof e.prefillFirstLetter !== 'boolean') return false;

  if (
    e.distractors !== undefined &&
    (typeof e.distractors !== 'number' ||
      !Number.isInteger(e.distractors) ||
      e.distractors < 0)
  ) {
    return false;
  }

  if (
    typeof e.pointsPerWord !== 'number' ||
    !Number.isInteger(e.pointsPerWord) ||
    e.pointsPerWord < 1
  ) {
    return false;
  }

  if (
    typeof e.wordsToAdvance !== 'number' ||
    !Number.isInteger(e.wordsToAdvance) ||
    e.wordsToAdvance < 1
  ) {
    return false;
  }

  return true;
}

export function validateSpellingLevelsList(list: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!Array.isArray(list)) {
    return { valid: false, errors: ['Levels config must be an array.'] };
  }
  if (list.length !== 5) {
    errors.push(`Expected exactly 5 levels, found ${list.length}.`);
  }

  const seenIds = new Set<number>();
  list.forEach((item, index) => {
    if (!isValidSpellingLevelConfig(item)) {
      errors.push(`Level at index ${index} does not match the SpellingLevelConfig schema.`);
    } else {
      seenIds.add(item.id);
    }
  });

  for (const expectedId of [1, 2, 3, 4, 5]) {
    if (!seenIds.has(expectedId)) {
      errors.push(`Missing level with id ${expectedId}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

