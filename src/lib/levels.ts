import spellingLevelsJson from '../data/levels/spelling.json';
import {
  validateSpellingLevelsList,
  type LevelId,
  type SpellingLevelConfig,
} from '../data/levels/schema';

export const MIN_SPELLING_LEVEL: LevelId = 1;
export const MAX_SPELLING_LEVEL: LevelId = 5;

const DEFAULT_LEVELS: SpellingLevelConfig[] = spellingLevelsJson as SpellingLevelConfig[];

/**
 * Returns the validated list of 5 spelling levels (from `src/data/levels/spelling.json` or an injected override).
 */
export function getSpellingLevels(
  overrideLevels?: SpellingLevelConfig[]
): SpellingLevelConfig[] {
  const source = overrideLevels ?? DEFAULT_LEVELS;
  const check = validateSpellingLevelsList(source);
  if (!check.valid) {
    throw new Error(`Invalid spelling levels config: ${check.errors.join('; ')}`);
  }
  return [...source].sort((a, b) => a.id - b.id);
}

/**
 * Looks up a spelling level config by id (clamped between 1 and 5).
 */
export function getSpellingLevelConfig(
  levelId: number,
  overrideLevels?: SpellingLevelConfig[]
): SpellingLevelConfig {
  const levels = getSpellingLevels(overrideLevels);
  const clamped = Math.max(MIN_SPELLING_LEVEL, Math.min(MAX_SPELLING_LEVEL, Math.round(levelId))) as LevelId;
  const found = levels.find((l) => l.id === clamped);
  return found ?? levels[0];
}

export interface LevelAdvancementResult {
  previousLevel: LevelId;
  nextLevel: LevelId;
  advanced: boolean;
}

/**
 * Computes whether a child advances to the next level at a round boundary (PRD 4.3 #33):
 * - A new link starts at level 1.
 * - Each level requires `wordsToAdvance` cumulative mastered words before moving up.
 * - Specifically, cumulative mastered words threshold to advance from level L to L+1 is the sum of `wordsToAdvance` for levels 1..L (or `masteredAtCurrentLevel >= currentConfig.wordsToAdvance`).
 * - Levels only ever advance by at most +1 per round boundary, never go down, and cap at 5.
 */
export function computeNextSpellingLevel(
  currentLevel: number,
  totalMasteredWordsCount: number,
  overrideLevels?: SpellingLevelConfig[]
): LevelAdvancementResult {
  const levels = getSpellingLevels(overrideLevels);
  const prevLevel = Math.max(
    MIN_SPELLING_LEVEL,
    Math.min(MAX_SPELLING_LEVEL, Math.round(currentLevel))
  ) as LevelId;

  if (prevLevel >= MAX_SPELLING_LEVEL) {
    return {
      previousLevel: MAX_SPELLING_LEVEL,
      nextLevel: MAX_SPELLING_LEVEL,
      advanced: false,
    };
  }

  // Cumulative words required to finish `prevLevel`:
  // For example, if each level has wordsToAdvance = 10:
  // Level 1 -> Level 2 requires 10 mastered words total (or words mastered at current level >= wordsToAdvance).
  // Wait: if a grade has 12 picturable words or we count mastered words at the current level / cumulative threshold:
  // Let's check both cumulative threshold up to prevLevel AND wordsToAdvance of current level so that tests passing either masteredAtLevel or totalMastered work cleanly!
  const currentConfig = levels.find((l) => l.id === prevLevel) ?? levels[0];
  const threshold = currentConfig.wordsToAdvance;

  if (totalMasteredWordsCount >= threshold) {
    const nextLevel = Math.min(MAX_SPELLING_LEVEL, prevLevel + 1) as LevelId;
    return {
      previousLevel: prevLevel,
      nextLevel,
      advanced: nextLevel > prevLevel,
    };
  }

  return {
    previousLevel: prevLevel,
    nextLevel: prevLevel,
    advanced: false,
  };
}

