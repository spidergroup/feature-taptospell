import { describe, it, expect } from 'vitest';
import {
  getSpellingLevels,
  getSpellingLevelConfig,
  computeNextSpellingLevel,
} from './levels';
import { selectSpellingLevelWords } from './words';
import type { SpellingLevelConfig } from '../data/levels/schema';

describe('levels.ts — 5 spelling levels from JSON (Task 12.0)', () => {
  it('loads exactly 5 valid levels with ids 1..5 from src/data/levels/spelling.json (Tasks 12.1, 12.2)', () => {
    const levels = getSpellingLevels();
    expect(levels).toHaveLength(5);
    expect(levels.map((l) => l.id)).toEqual([1, 2, 3, 4, 5]);
    expect(levels[0].name).toBe('Spelling Safari');
    expect(levels[0].prefillFirstLetter).toBe(false);
    expect(levels[0].questionsPerRound).toBe(3);
    expect(levels[1].questionsPerRound).toBe(5);
    expect(levels[2].questionsPerRound).toBe(7);
    expect(levels[3].questionsPerRound).toBe(9);
    expect(levels[4].questionsPerRound).toBe(11);
    expect(levels[0].pointsPerWord).toBe(10);
    expect(levels[4].name).toBe('Space Adventure');
    expect(levels[4].pointsPerWord).toBe(30);
  });

  it('starts a fresh link at level 1, advances after wordsToAdvance mastered words, never goes down, and caps at level 5 (Tasks 12.5, 12.6)', () => {
    // Fresh link with 0 mastered words stays at level 1
    expect(computeNextSpellingLevel(1, 0)).toEqual({
      previousLevel: 1,
      nextLevel: 1,
      advanced: false,
    });

    // 2 mastered words (< 3 threshold) stays at level 1
    expect(computeNextSpellingLevel(1, 2)).toEqual({
      previousLevel: 1,
      nextLevel: 1,
      advanced: false,
    });

    // Exactly at threshold (3 mastered words) advances from level 1 to level 2
    expect(computeNextSpellingLevel(1, 3)).toEqual({
      previousLevel: 1,
      nextLevel: 2,
      advanced: true,
    });

    // Never goes down even if mastered count is 0 on a higher level
    expect(computeNextSpellingLevel(3, 0)).toEqual({
      previousLevel: 3,
      nextLevel: 3,
      advanced: false,
    });

    // Caps at level 5
    expect(computeNextSpellingLevel(5, 100)).toEqual({
      previousLevel: 5,
      nextLevel: 5,
      advanced: false,
    });
  });

  it('changes behaviour dynamically when the JSON config values change without a code change (Task 12.6)', () => {
    const customLevels: SpellingLevelConfig[] = getSpellingLevels().map((lvl) =>
      lvl.id === 1
        ? {
            ...lvl,
            questionsPerRound: 5,
            wordsToAdvance: 4,
            pointsPerWord: 50,
            prefillFirstLetter: false,
          }
        : lvl
    );

    const lvl1 = getSpellingLevelConfig(1, customLevels);
    expect(lvl1.questionsPerRound).toBe(5);
    expect(lvl1.pointsPerWord).toBe(50);

    // Advances at 4 words instead of 10
    expect(computeNextSpellingLevel(1, 4, customLevels).nextLevel).toBe(2);

    // Selects 5 words per round with prefillFirstLetter = false
    const roundWords = selectSpellingLevelWords(0, lvl1, []);
    expect(roundWords).toHaveLength(5);
    expect(roundWords.every((w) => w.prefillFirstLetter === false)).toBe(true);
    expect(roundWords.every((w) => w.picturable === true)).toBe(true);
    expect(roundWords.every((w) => w.word.length === 3)).toBe(true);
  });

  it('fills the round using nearest word lengths without duplicates when a grade has few strict matches (Task 12.4)', () => {
    const lvl5 = getSpellingLevelConfig(5);
    const roundWords = selectSpellingLevelWords(0, lvl5, []);
    expect(roundWords).toHaveLength(lvl5.questionsPerRound);
    const uniqueWords = new Set(roundWords.map((w) => w.word));
    expect(uniqueWords.size).toBe(roundWords.length);
  });
});

