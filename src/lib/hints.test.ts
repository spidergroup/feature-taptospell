import { describe, it, expect } from 'vitest';
import {
  getHintBulbCounts,
  createInitialBoxes,
  pickRevealIndex,
  applyHintReveal,
} from './hints';
import { buildLetterBank } from './letter-bank';

describe('hints.ts — light-bulb hints logic (Task 14.0)', () => {
  it('computes word length - 1 bulbs, with 1 pre-used when prefillFirstLetter is true (Tasks 14.1, 14.3)', () => {
    // 4-letter word without prefill -> 3 bulbs, 0 used, 3 available
    expect(getHintBulbCounts('fish', false)).toEqual({
      totalBulbs: 3,
      initialUsedBulbs: 0,
      availableBulbs: 3,
    });

    // 3-letter word with prefill -> 2 bulbs total, 1 pre-used, 1 available
    expect(getHintBulbCounts('cat', true)).toEqual({
      totalBulbs: 2,
      initialUsedBulbs: 1,
      availableBulbs: 1,
    });
  });

  it('never targets a pre-filled, hint-locked, or already-correct box (Task 14.3)', () => {
    const boxes = createInitialBoxes('fish', true);
    // Box 0 is prefilled ('f'). Suppose child correctly placed 's' in box 2.
    boxes[2] = {
      ...boxes[2],
      filledLetter: 's',
      source: 'child',
      tileId: 'ans-2-s',
    };

    // Only indices 1 and 3 are eligible
    const picked0 = pickRevealIndex(boxes, () => 0.0);
    const picked1 = pickRevealIndex(boxes, () => 0.99);
    expect(picked0).toBe(1);
    expect(picked1).toBe(3);
  });

  it('returns an overwritten wrong child tile to the bank and consumes the right tile including repeated letters (Tasks 14.2, 14.3)', () => {
    const word = 'ball';
    const tiles = buildLetterBank(word, { skipFirstLetter: false });
    const boxes = createInitialBoxes(word, false);

    // Put a wrong distractor tile into box 2 (which expects 'l')
    const distractorTile = tiles.find((t) => t.isDistractor)!;
    boxes[2] = {
      ...boxes[2],
      filledLetter: distractorTile.letter,
      source: 'child',
      tileId: distractorTile.id,
    };

    // Force reveal on index 2 (rng picks index 2 among [0, 1, 2, 3])
    const reveal1 = applyHintReveal(boxes, tiles, [distractorTile.id], () => 0.6);
    expect(reveal1.revealedIndex).toBe(2);
    expect(reveal1.boxes[2].filledLetter).toBe('l');
    expect(reveal1.boxes[2].source).toBe('hint');
    // Distractor tile was returned to bank
    expect(reveal1.consumedTileIds.includes(distractorTile.id)).toBe(false);
    // Exactly one 'l' tile was consumed
    const consumedLTiles = tiles.filter(
      (t) => t.letter === 'l' && reveal1.consumedTileIds.includes(t.id)
    );
    expect(consumedLTiles).toHaveLength(1);

    // Reveal the second 'l' at index 3
    const reveal2 = applyHintReveal(
      reveal1.boxes,
      tiles,
      reveal1.consumedTileIds,
      () => 0.99
    );
    expect(reveal2.revealedIndex).toBe(3);
    expect(reveal2.boxes[3].filledLetter).toBe('l');
    expect(reveal2.boxes[3].source).toBe('hint');
    const bothLTilesConsumed = tiles.filter(
      (t) => t.letter === 'l' && reveal2.consumedTileIds.includes(t.id)
    );
    expect(bothLTilesConsumed).toHaveLength(2);
  });

  it('flags allBoxesFilled = true when a hint reveal fills the last empty box (Task 14.3)', () => {
    const word = 'cat';
    const tiles = buildLetterBank(word, { skipFirstLetter: true });
    const boxes = createInitialBoxes(word, true);

    // Child fills box 1 with 'a'
    const aTile = tiles.find((t) => t.letter === 'a')!;
    boxes[1] = {
      ...boxes[1],
      filledLetter: 'a',
      source: 'child',
      tileId: aTile.id,
    };

    // Now only box 2 is empty; using the hint reveals box 2 and completes all boxes
    const outcome = applyHintReveal(boxes, tiles, [aTile.id], () => 0);
    expect(outcome.revealedIndex).toBe(2);
    expect(outcome.allBoxesFilled).toBe(true);
    expect(outcome.boxes.map((b) => b.filledLetter).join('')).toBe('cat');
  });
});

