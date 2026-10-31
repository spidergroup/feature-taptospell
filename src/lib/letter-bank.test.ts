import { describe, it, expect } from 'vitest';
import {
  buildLetterBank,
  getDistractorCount,
  sortTilesAlphabetically,
} from './letter-bank';

describe('letter-bank.ts — scaled distractors and alphabetical sorting (Tasks 6.1–6.4)', () => {
  it('adds 4 distractors for 3–4 letter words with no distractor duplicating an answer letter', () => {
    expect(getDistractorCount(3)).toBe(4);
    expect(getDistractorCount(4)).toBe(4);

    const bank = buildLetterBank('cat');
    expect(bank).toHaveLength(3 + 4);

    const distractors = bank.filter((t) => t.isDistractor);
    expect(distractors).toHaveLength(4);
    for (const d of distractors) {
      expect(['c', 'a', 't'].includes(d.letter)).toBe(false);
    }
  });

  it('adds 3 distractors for 5–6 letter words with no distractor duplicating an answer letter', () => {
    expect(getDistractorCount(5)).toBe(3);
    expect(getDistractorCount(6)).toBe(3);

    const bank = buildLetterBank('garden');
    expect(bank).toHaveLength(6 + 3);

    const distractors = bank.filter((t) => t.isDistractor);
    expect(distractors).toHaveLength(3);
    for (const d of distractors) {
      expect('garden'.includes(d.letter)).toBe(false);
    }
  });

  it('adds 2 distractors for 7+ letter words with no distractor duplicating an answer letter', () => {
    expect(getDistractorCount(7)).toBe(2);
    expect(getDistractorCount(8)).toBe(2);

    const bank = buildLetterBank('picture');
    expect(bank).toHaveLength(7 + 2);

    const distractors = bank.filter((t) => t.isDistractor);
    expect(distractors).toHaveLength(2);
    for (const d of distractors) {
      expect('picture'.includes(d.letter)).toBe(false);
    }
  });

  it('arranges tiles in strict alphabetical order for AlphabetKeyboard (Task 6.4)', () => {
    const bank = buildLetterBank('dog');
    const sorted = sortTilesAlphabetically(bank);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].letter >= sorted[i - 1].letter).toBe(true);
    }
  });
});

