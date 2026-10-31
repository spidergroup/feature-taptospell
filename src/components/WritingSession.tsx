import React, { useEffect, useMemo, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { MuteToggle } from './MuteToggle';
import { AlphabetKeyboard } from './AlphabetKeyboard';
import { buildLetterBank, type LetterTile } from '../lib/letter-bank';
import type { SessionWordItem } from '../lib/words';
import type { SessionItemResult } from '../lib/progress';
import { getSoundManager, type SoundManager } from '../lib/audio';

export interface WritingSessionProps {
  words: SessionWordItem[];
  initialIndex?: number;
  initialFilledLetters?: string[];
  initialConsumedTileIds?: string[];
  initialResults?: SessionItemResult[];
  soundManager?: SoundManager;
  onStateChange?: (state: {
    currentIndex: number;
    filledLetters: string[];
    consumedTileIds: string[];
    results: SessionItemResult[];
  }) => void;
  onComplete: (results: SessionItemResult[]) => void;
}

/**
 * Writing mode UI (Screen 4 & Screen 5 mockups — Tasks 6.5–6.10, 7.13).
 * Top: illustration in a soft rounded frame.
 * Middle: one letter box per letter of the answer (first box pre-filled when `prefillFirstLetter` is true).
 * Bottom: alphabetical letter bank.
 * Strictly communicates zero failure: no red X, no buzzer, no "Wrong", no attempt counter.
 */
export function WritingSession({
  words,
  initialIndex = 0,
  initialFilledLetters,
  initialConsumedTileIds,
  initialResults = [],
  soundManager = getSoundManager(),
  onStateChange,
  onComplete,
}: WritingSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [results, setResults] = useState<SessionItemResult[]>(initialResults);
  const [attemptsOnWord, setAttemptsOnWord] = useState(1);
  const [hadMissOnWord, setHadMissOnWord] = useState(false);
  const [shakingTileId, setShakingTileId] = useState<string | null>(null);

  const currentItem = words[currentIndex];

  const initialBoxesForWord = (item: SessionWordItem | undefined): string[] => {
    if (!item) return [];
    return item.prefillFirstLetter ? [item.word[0]] : [];
  };

  const [filledLetters, setFilledLetters] = useState<string[]>(
    () => initialFilledLetters ?? initialBoxesForWord(currentItem)
  );
  const [consumedTileIds, setConsumedTileIds] = useState<string[]>(
    () => initialConsumedTileIds ?? []
  );

  useEffect(() => {
    soundManager.preloadAll();
  }, [soundManager]);

  const tiles = useMemo(() => {
    if (!currentItem) return [];
    return buildLetterBank(currentItem.word, {
      skipFirstLetter: currentItem.prefillFirstLetter,
    });
  }, [currentItem?.word, currentItem?.prefillFirstLetter]);

  if (!currentItem) {
    return null;
  }

  const targetLetters = currentItem.word.split('');
  const nextExpectedIndex = filledLetters.length;
  const nextExpectedLetter = targetLetters[nextExpectedIndex];

  const handleTileTap = async (tile: LetterTile) => {
    soundManager.unlockOnFirstInteraction();

    if (tile.letter === nextExpectedLetter) {
      const nextFilled = [...filledLetters, tile.letter];
      const nextConsumed = [...consumedTileIds, tile.id];

      if (nextFilled.length === targetLetters.length) {
        const wordResult: SessionItemResult = {
          word: currentItem.word,
          mode: 'write',
          attempts: attemptsOnWord,
          mastered: !hadMissOnWord,
        };
        const nextResults = [...results, wordResult];
        const nextIdx = currentIndex + 1;

        if (nextIdx >= words.length) {
          onComplete(nextResults);
        } else {
          const nextWord = words[nextIdx];
          const resetFilled = initialBoxesForWord(nextWord);
          setResults(nextResults);
          setCurrentIndex(nextIdx);
          setFilledLetters(resetFilled);
          setConsumedTileIds([]);
          setAttemptsOnWord(1);
          setHadMissOnWord(false);
          setShakingTileId(null);
          onStateChange?.({
            currentIndex: nextIdx,
            filledLetters: resetFilled,
            consumedTileIds: [],
            results: nextResults,
          });
        }
      } else {
        setFilledLetters(nextFilled);
        setConsumedTileIds(nextConsumed);
        onStateChange?.({
          currentIndex,
          filledLetters: nextFilled,
          consumedTileIds: nextConsumed,
          results,
        });
      }
    } else {
      // Incorrect tap path (Screen 5 mockup — Task 6.7 & 7.13):
      // Shake the tile, play playful retry sound, return tile to bank. No penalty or error UI.
      setShakingTileId(tile.id);
      setAttemptsOnWord((prev) => prev + 1);
      setHadMissOnWord(true);
      await soundManager.play('retry');
      setTimeout(() => {
        setShakingTileId((current) => (current === tile.id ? null : current));
      }, 280);
    }
  };

  return (
    <main
      data-testid="writing-session"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px 20px',
        backgroundColor: '#FAF6EE',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <ProgressBar completed={currentIndex} total={words.length} />
        </div>
        <MuteToggle />
      </header>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          margin: '12px 0',
        }}
      >
        <div
          data-testid="word-illustration-frame"
          style={{
            width: '180px',
            height: '180px',
            maxHeight: '180px',
            borderRadius: '24px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #E6E1D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '12px',
          }}
        >
          <img
            src={`/images/words/${currentItem.word}.webp`}
            alt={currentItem.word}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
            }}
          />
        </div>

        <div
          data-testid="letter-boxes"
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {targetLetters.map((_, boxIdx) => {
            const filledChar = filledLetters[boxIdx] ?? '';
            return (
              <div
                key={boxIdx}
                data-testid={`letter-box-${boxIdx}`}
                data-filled={filledChar ? 'true' : 'false'}
                style={{
                  width: '48px',
                  height: '54px',
                  borderRadius: '14px',
                  border: filledChar ? '2px solid #1E8A8A' : '2px dashed #B8B0A0',
                  backgroundColor: filledChar ? '#E6F4F1' : '#FFFFFF',
                  color: '#1D3537',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {filledChar}
              </div>
            );
          })}
        </div>
      </section>

      <footer style={{ paddingBottom: '12px' }}>
        <AlphabetKeyboard
          tiles={tiles}
          consumedTileIds={new Set(consumedTileIds)}
          shakingTileId={shakingTileId}
          onTileTap={handleTileTap}
        />
      </footer>
    </main>
  );
}

