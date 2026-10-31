import { describe, it, expect } from 'vitest';
import {
  getWordsForGrade,
  selectSessionWords,
  SESSION_WORD_COUNT,
  type WordProgressStatus,
} from './words';

describe('words.ts — word selection and difficulty progression (Tasks 5.1, 5.2, 6.8, 6.9)', () => {
  it('selects 10 words for a fresh link ordered by frequencyRank within phoneticGroup (Task 5.1 & 5.2)', () => {
    const session = selectSessionWords(0, 'read', []);
    expect(session).toHaveLength(SESSION_WORD_COUNT);
    expect(session[0].word).toBe('the');
    expect(session[0].frequencyRank).toBe(1);
  });

  it('prioritises previously-missed words ahead of unseen words (Task 5.1 & 5.2)', () => {
    const existingProgress: WordProgressStatus[] = [
      { word: 'jump', mode: 'read', attempts: 3, mastered_at: null },
      { word: 'look', mode: 'read', attempts: 2, mastered_at: null },
      { word: 'the', mode: 'read', attempts: 1, mastered_at: 1700000000000 },
    ];

    const session = selectSessionWords(0, 'read', existingProgress);
    expect(session).toHaveLength(SESSION_WORD_COUNT);
    expect(session[0].word).toBe('jump');
    expect(session[1].word).toBe('look');
    expect(session.some((w) => w.word === 'the')).toBe(false);
  });

  it('continues returning 10 words when a link has seen and mastered every word in its grade (Task 5.2)', () => {
    const allGradeWords = getWordsForGrade(1, 'read');
    const allMastered: WordProgressStatus[] = allGradeWords.map((w) => ({
      word: w.word,
      mode: 'read',
      attempts: 1,
      mastered_at: 1700000000000,
    }));

    const session = selectSessionWords(1, 'read', allMastered);
    expect(session).toHaveLength(SESSION_WORD_COUNT);
  });

  it('restricts writing mode strictly to picturable words and escalates by word length then hint removal (Tasks 6.8 & 6.9)', () => {
    const session = selectSessionWords(0, 'write', []);
    expect(session).toHaveLength(SESSION_WORD_COUNT);

    for (let i = 0; i < session.length; i++) {
      expect(session[i].picturable).toBe(true);
      if (i > 0) {
        expect(session[i].word.length).toBeGreaterThanOrEqual(session[i - 1].word.length);
      }
    }

    // Earlier items in a fresh grade include the first-letter hint; later items remove it
    expect(session[0].prefillFirstLetter).toBe(true);
    expect(session[session.length - 1].prefillFirstLetter).toBe(false);
  });
});

