import type { LetterTile } from './letter-bank';

export type BoxSource = 'empty' | 'prefill' | 'hint' | 'child';

export interface BoxSlotState {
  index: number;
  expectedLetter: string;
  filledLetter: string;
  source: BoxSource;
  tileId: string | null;
}

export interface HintCountInfo {
  totalBulbs: number;
  initialUsedBulbs: number;
  availableBulbs: number;
}

/**
 * Computes light-bulb hint counts for a word (PRD 4.4 #36, Task 14.1):
 * - Total bulbs = `word.length - 1` (e.g. 4-letter word -> 3 bulbs).
 * - On levels where the first letter is pre-filled, one bulb starts already used,
 *   so the child always places at least one letter themselves.
 */
export function getHintBulbCounts(word: string, prefillFirstLetter: boolean): HintCountInfo {
  const totalBulbs = Math.max(0, word.trim().length - 1);
  const initialUsedBulbs = prefillFirstLetter && totalBulbs > 0 ? 1 : 0;
  return {
    totalBulbs,
    initialUsedBulbs,
    availableBulbs: Math.max(0, totalBulbs - initialUsedBulbs),
  };
}

/**
 * Creates the initial array of letter box states for a word.
 */
export function createInitialBoxes(word: string, prefillFirstLetter: boolean): BoxSlotState[] {
  const chars = word.trim().toLowerCase().split('');
  return chars.map((ch, idx) => {
    if (prefillFirstLetter && idx === 0) {
      return {
        index: idx,
        expectedLetter: ch,
        filledLetter: ch,
        source: 'prefill',
        tileId: null,
      };
    }
    return {
      index: idx,
      expectedLetter: ch,
      filledLetter: '',
      source: 'empty',
      tileId: null,
    };
  });
}

/**
 * Picks a box index at random among boxes that are not yet locked (`prefill` or `hint`)
 * and do not already hold the correct letter (PRD 4.4 #37, Task 14.1).
 * Returns `null` if no eligible box remains.
 */
export function pickRevealIndex(
  boxes: readonly BoxSlotState[],
  randomFn: () => number = Math.random
): number | null {
  const candidates: number[] = [];
  for (const box of boxes) {
    if (box.source === 'prefill' || box.source === 'hint') {
      continue;
    }
    if (box.filledLetter !== box.expectedLetter) {
      candidates.push(box.index);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const pick = Math.min(
    candidates.length - 1,
    Math.max(0, Math.floor(randomFn() * candidates.length))
  );
  return candidates[pick];
}

export interface ApplyHintResult {
  revealedIndex: number | null;
  boxes: BoxSlotState[];
  consumedTileIds: string[];
  allBoxesFilled: boolean;
}

/**
 * Applies one light-bulb hint reveal to the current box state and consumed tile set (PRD 4.4 #37, Task 14.2):
 * 1. Picks a random eligible box index via `pickRevealIndex`.
 * 2. If that box held an incorrect child letter, returns that tile to the bank (removes from `consumedTileIds`).
 * 3. Finds an unconsumed tile in the bank matching the target letter (preferring the non-distractor tile for that answer index, or any unconsumed matching letter tile; if all matching tiles were placed by the child into wrong boxes, reclaims one from a wrong child box).
 * 4. Marks the revealed box with `source: 'hint'` (locked) and consumes the matching tile.
 */
export function applyHintReveal(
  boxes: readonly BoxSlotState[],
  tiles: readonly LetterTile[],
  consumedTileIds: readonly string[],
  randomFn: () => number = Math.random
): ApplyHintResult {
  const targetIdx = pickRevealIndex(boxes, randomFn);
  if (targetIdx === null) {
    return {
      revealedIndex: null,
      boxes: boxes.map((b) => ({ ...b })),
      consumedTileIds: [...consumedTileIds],
      allBoxesFilled: boxes.every((b) => b.filledLetter.length > 0),
    };
  }

  const nextBoxes = boxes.map((b) => ({ ...b }));
  const consumedSet = new Set(consumedTileIds);
  const targetBox = nextBoxes[targetIdx];
  const neededLetter = targetBox.expectedLetter;

  // Step 1: If targetBox held a child-placed tile, return it to the bank first
  if (targetBox.source === 'child' && targetBox.tileId) {
    consumedSet.delete(targetBox.tileId);
  }

  // Step 2: Find an unconsumed tile with `neededLetter`
  // Prefer the exact answerIndex tile if unconsumed, otherwise any unconsumed non-distractor tile with neededLetter
  let chosenTile =
    tiles.find(
      (t) =>
        !consumedSet.has(t.id) &&
        t.letter === neededLetter &&
        t.answerIndex === targetIdx
    ) ??
    tiles.find(
      (t) => !consumedSet.has(t.id) && !t.isDistractor && t.letter === neededLetter
    ) ??
    tiles.find((t) => !consumedSet.has(t.id) && t.letter === neededLetter);

  // Step 3: If the child had placed all tiles of `neededLetter` into other wrong boxes, reclaim one from a wrong child box
  if (!chosenTile) {
    const donorBox = nextBoxes.find(
      (b) =>
        b.index !== targetIdx &&
        b.source === 'child' &&
        b.filledLetter === neededLetter &&
        b.expectedLetter !== neededLetter &&
        b.tileId !== null
    );
    if (donorBox && donorBox.tileId) {
      chosenTile = tiles.find((t) => t.id === donorBox.tileId);
      donorBox.filledLetter = '';
      donorBox.source = 'empty';
      donorBox.tileId = null;
    }
  }

  if (chosenTile) {
    consumedSet.add(chosenTile.id);
  }

  targetBox.filledLetter = neededLetter;
  targetBox.source = 'hint';
  targetBox.tileId = chosenTile?.id ?? null;

  const allBoxesFilled = nextBoxes.every((b) => b.filledLetter.length > 0);

  return {
    revealedIndex: targetIdx,
    boxes: nextBoxes,
    consumedTileIds: Array.from(consumedSet),
    allBoxesFilled,
  };
}

