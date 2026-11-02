const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export interface LetterTile {
  id: string;
  letter: string;
  isDistractor: boolean;
  /** Answer character index (0..word.length-1) when isDistractor is false */
  answerIndex?: number;
}

/**
 * Returns the scaled distractor count based on word length:
 * - 3–4 letters (and <=4): 4 distractors
 * - 5–6 letters: 3 distractors
 * - 7+ letters: 2 distractors
 */
export function getDistractorCount(wordLength: number): number {
  if (wordLength <= 4) return 4;
  if (wordLength <= 6) return 3;
  return 2;
}

/**
 * Builds the letter bank from the answer's required letters (duplicates included, e.g. "ball" -> two "l" tiles)
 * plus scaled distractors drawn exclusively from letters not in the answer, then shuffles the bank (Tasks 6.1, 6.2, 13.5).
 */
export function buildLetterBank(
  word: string,
  options?: {
    skipFirstLetter?: boolean;
    distractorsOverride?: number;
    randomFn?: () => number;
  }
): LetterTile[] {
  const normalized = word.trim().toLowerCase();
  const rand = options?.randomFn ?? Math.random;
  const distractorCount =
    typeof options?.distractorsOverride === 'number'
      ? Math.max(0, options.distractorsOverride)
      : getDistractorCount(normalized.length);

  const fullWordLetters = normalized.split('');
  const answerTiles: LetterTile[] = [];
  fullWordLetters.forEach((letter, idx) => {
    if (options?.skipFirstLetter && idx === 0) {
      return;
    }
    answerTiles.push({
      id: `ans-${idx}-${letter}`,
      letter,
      isDistractor: false,
      answerIndex: idx,
    });
  });

  const uniqueWordLetters = new Set(fullWordLetters);
  const candidateDistractors = ALPHABET.filter((ch) => !uniqueWordLetters.has(ch));

  // Shuffle candidate distractors with Fisher-Yates to draw unique non-answer letters
  const poolCopy = [...candidateDistractors];
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
  }

  const chosenDistractors = poolCopy.slice(0, distractorCount);

  const tiles: LetterTile[] = [
    ...answerTiles,
    ...chosenDistractors.map((letter, idx) => ({
      id: `dist-${idx}-${letter}`,
      letter,
      isDistractor: true,
    })),
  ];

  // Shuffle the whole bank
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

/**
 * Arranges a letter bank in alphabetical order for the on-screen keyboard (PRD 4.2 #20).
 */
export function sortTilesAlphabetically(tiles: LetterTile[]): LetterTile[] {
  return [...tiles].sort((a, b) => {
    const cmp = a.letter.localeCompare(b.letter);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}
