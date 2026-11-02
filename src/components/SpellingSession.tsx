import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { MuteToggle } from './MuteToggle';
import { AlphabetKeyboard } from './AlphabetKeyboard';
import { LetterBoxes } from './LetterBoxes';
import { HintBulbs } from './HintBulbs';
import { MaterialIcon } from './MaterialIcon';
import { buildLetterBank, type LetterTile } from '../lib/letter-bank';
import {
  applyHintReveal,
  createInitialBoxes,
  getHintBulbCounts,
  type BoxSlotState,
} from '../lib/hints';
import {
  CONFETTI_DURATION_MS,
  runThreeSecondConfetti,
  type ConfettiController,
  type ConfettiFireFn,
} from '../lib/confetti';
import { getSpellingLevelConfig } from '../lib/levels';
import type { SpellingLevelConfig } from '../data/levels/schema';
import type { SessionWordItem } from '../lib/words';
import type { SessionItemResult } from '../lib/progress';
import { getSoundManager, type SoundManager } from '../lib/audio';

export interface SpellingSessionProps {
  words: SessionWordItem[];
  level?: number | SpellingLevelConfig;
  initialPoints?: number;
  initialIndex?: number;
  initialFilledLetters?: string[];
  initialConsumedTileIds?: string[];
  initialBoxes?: BoxSlotState[];
  initialUsedHintBulbs?: number;
  initialResults?: SessionItemResult[];
  soundManager?: SoundManager;
  confettiDurationMs?: number;
  confettiFireFn?: ConfettiFireFn;
  randomFn?: () => number;
  shareBanner?: React.ReactNode;
  onBackToLinkHome?: () => void;
  onStateChange?: (state: {
    currentIndex: number;
    filledLetters: string[];
    consumedTileIds: string[];
    boxes: BoxSlotState[];
    usedHintBulbs: number;
    results: SessionItemResult[];
  }) => void;
  onComplete: (results: SessionItemResult[], roundPointsEarned: number) => void;
}

/**
 * Spelling mode game page rebuilt from `UI_TEMPLATES/kids_spelling_word_game` (PRD 4.2, 4.3, 4.4, 4.5; Tasks 13.0, 14.0, 15.0).
 * - Layout top to bottom: header (back to LinkHome, stars, mute), level badge ("Level N • {name}"),
 *   tactile striped progress bar + "Word N of M" pill, prompt banner ("Spell the N-letter word!"),
 *   picture card with "+N pts" badge, light-bulb hint buttons (`word.length - 1`), letter boxes,
 *   and alphabetical letter keyboard with Backspace and neutral Reset.
 * - Free letter entry with automatic answer check the moment the last empty box is filled (no "Check answer" button).
 * - Correct answer: boxes turn success colour, plays one success sound, fires canvas-confetti for 3 seconds,
 *   awards `pointsPerWord` stars into the header, disables input during the 3-second celebration, then advances.
 * - Incorrect answer: plays retry sound, gently shakes boxes, returns only the incorrectly placed child letters
 *   to the bank (correctly placed letters stay). Zero red colouring, zero "Oops" / "Wrong" text, zero attempt counter.
 */
export function SpellingSession({
  words,
  level = 1,
  initialPoints = 0,
  initialIndex = 0,
  initialFilledLetters,
  initialConsumedTileIds,
  initialBoxes,
  initialUsedHintBulbs,
  initialResults = [],
  soundManager = getSoundManager(),
  confettiDurationMs = CONFETTI_DURATION_MS,
  confettiFireFn,
  randomFn = Math.random,
  shareBanner,
  onBackToLinkHome,
  onStateChange,
  onComplete,
}: SpellingSessionProps) {
  const levelConfig = useMemo(
    () => (typeof level === 'number' ? getSpellingLevelConfig(level) : level),
    [level]
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [results, setResults] = useState<SessionItemResult[]>(initialResults);
  const [displayedPoints, setDisplayedPoints] = useState(initialPoints);
  const [earnedPointsInRound, setEarnedPointsInRound] = useState(0);
  const [attemptsOnWord, setAttemptsOnWord] = useState(1);
  const [hadMissOnWord, setHadMissOnWord] = useState(false);
  const [isCelebratingWord, setIsCelebratingWord] = useState(false);
  const [isShakingBoxes, setIsShakingBoxes] = useState(false);

  const confettiControllerRef = useRef<ConfettiController | null>(null);

  const currentItem = words[currentIndex];
  const effectivePrefill =
    currentItem?.prefillFirstLetter ?? levelConfig.prefillFirstLetter;

  const tiles = useMemo(() => {
    if (!currentItem) return [];
    return buildLetterBank(currentItem.word, {
      skipFirstLetter: effectivePrefill,
      distractorsOverride: levelConfig.distractors,
    });
  }, [currentItem?.word, effectivePrefill, levelConfig.distractors]);

  const buildInitialBoxesForItem = (
    item: SessionWordItem | undefined,
    legacyFilled?: string[]
  ): BoxSlotState[] => {
    if (!item) return [];
    const prefill = item.prefillFirstLetter ?? levelConfig.prefillFirstLetter;
    const base = createInitialBoxes(item.word, prefill);
    if (legacyFilled && legacyFilled.length > 0) {
      return base.map((box, idx) => {
        if (box.source === 'prefill') return box;
        const ch = legacyFilled[idx] ?? '';
        if (!ch) return box;
        return {
          ...box,
          filledLetter: ch.toLowerCase(),
          source: 'child',
        };
      });
    }
    return base;
  };

  const [boxes, setBoxes] = useState<BoxSlotState[]>(() =>
    initialBoxes && initialBoxes.length === (currentItem?.word.length ?? 0)
      ? initialBoxes
      : buildInitialBoxesForItem(currentItem, initialFilledLetters)
  );

  const [consumedTileIds, setConsumedTileIds] = useState<string[]>(
    () => initialConsumedTileIds ?? []
  );

  const hintCounts = useMemo(
    () =>
      currentItem
        ? getHintBulbCounts(currentItem.word, effectivePrefill)
        : { totalBulbs: 0, initialUsedBulbs: 0, availableBulbs: 0 },
    [currentItem?.word, effectivePrefill]
  );

  const [usedHintBulbs, setUsedHintBulbs] = useState<number>(
    () => initialUsedHintBulbs ?? hintCounts.initialUsedBulbs
  );

  useEffect(() => {
    soundManager.preloadAll();
    return () => {
      confettiControllerRef.current?.cancel();
    };
  }, [soundManager]);

  if (!currentItem) {
    return null;
  }

  const childHintsUsedOnWord = Math.max(
    0,
    usedHintBulbs - hintCounts.initialUsedBulbs
  );

  const emitStateChange = (
    nextIdx: number,
    nextBoxes: BoxSlotState[],
    nextConsumed: string[],
    nextUsedBulbs: number,
    nextResults: SessionItemResult[]
  ) => {
    onStateChange?.({
      currentIndex: nextIdx,
      filledLetters: nextBoxes.map((b) => b.filledLetter),
      consumedTileIds: nextConsumed,
      boxes: nextBoxes,
      usedHintBulbs: nextUsedBulbs,
      results: nextResults,
    });
  };

  const evaluateCompletedBoxes = async (
    completedBoxes: BoxSlotState[],
    currentConsumedIds: string[],
    currentUsedBulbs: number
  ) => {
    const spelled = completedBoxes.map((b) => b.filledLetter).join('');
    const target = currentItem.word.toLowerCase();

    if (spelled === target) {
      // PRD 4.5 #39-40: Correct answer sequence
      setIsCelebratingWord(true);
      void soundManager.play('success');

      const wordPoints = levelConfig.pointsPerWord;
      const nextRoundEarned = earnedPointsInRound + wordPoints;
      setEarnedPointsInRound(nextRoundEarned);
      setDisplayedPoints((p) => p + wordPoints);

      const hintsUsedCount = Math.max(
        0,
        currentUsedBulbs - hintCounts.initialUsedBulbs
      );
      // PRD 4.7 #56: A word solved with one or more hints counts towards stars but is not marked mastered
      const wordResult: SessionItemResult = {
        word: currentItem.word,
        mode: 'write',
        attempts: attemptsOnWord,
        hintsUsed: hintsUsedCount,
        mastered: !hadMissOnWord && hintsUsedCount === 0,
      };
      const nextResults = [...results, wordResult];

      confettiControllerRef.current?.cancel();
      confettiControllerRef.current = runThreeSecondConfetti(
        () => {
          const nextIdx = currentIndex + 1;
          if (nextIdx >= words.length) {
            setIsCelebratingWord(false);
            onComplete(nextResults, nextRoundEarned);
          } else {
            const nextWord = words[nextIdx];
            const nextPrefill =
              nextWord.prefillFirstLetter ?? levelConfig.prefillFirstLetter;
            const nextBoxes = createInitialBoxes(nextWord.word, nextPrefill);
            const nextHintInfo = getHintBulbCounts(nextWord.word, nextPrefill);

            setResults(nextResults);
            setCurrentIndex(nextIdx);
            setBoxes(nextBoxes);
            setConsumedTileIds([]);
            setUsedHintBulbs(nextHintInfo.initialUsedBulbs);
            setAttemptsOnWord(1);
            setHadMissOnWord(false);
            setIsCelebratingWord(false);
            emitStateChange(
              nextIdx,
              nextBoxes,
              [],
              nextHintInfo.initialUsedBulbs,
              nextResults
            );
          }
        },
        {
          durationMs: confettiDurationMs,
          fireFn: confettiFireFn,
        }
      );
    } else {
      // PRD 4.2 #25 & Task 13.4: Incorrect answer path
      // Play retry sound, gently shake boxes, return ONLY the incorrectly placed child letters to the bank;
      // correctly placed letters stay!
      setAttemptsOnWord((prev) => prev + 1);
      setHadMissOnWord(true);
      setIsShakingBoxes(true);
      void soundManager.play('retry');

      const keptConsumed = new Set(currentConsumedIds);
      const cleanedBoxes = completedBoxes.map((box) => {
        if (box.source === 'prefill' || box.source === 'hint') {
          return box;
        }
        if (box.filledLetter === box.expectedLetter) {
          return box;
        }
        if (box.tileId) {
          keptConsumed.delete(box.tileId);
        }
        return {
          ...box,
          filledLetter: '',
          source: 'empty' as const,
          tileId: null,
        };
      });

      const nextConsumed = Array.from(keptConsumed);
      setBoxes(cleanedBoxes);
      setConsumedTileIds(nextConsumed);
      emitStateChange(
        currentIndex,
        cleanedBoxes,
        nextConsumed,
        currentUsedBulbs,
        results
      );

      setTimeout(() => {
        setIsShakingBoxes(false);
      }, 240);
    }
  };

  const handleTileTap = async (tile: LetterTile) => {
    if (isCelebratingWord) return;
    soundManager.unlockOnFirstInteraction();

    // Find next empty box (skipping pre-filled, hint-locked, and already-filled boxes)
    const nextEmptyIdx = boxes.findIndex((b) => b.filledLetter === '');
    if (nextEmptyIdx === -1) return;

    const nextBoxes = boxes.map((b, idx) =>
      idx === nextEmptyIdx
        ? {
            ...b,
            filledLetter: tile.letter,
            source: 'child' as const,
            tileId: tile.id,
          }
        : b
    );
    const nextConsumed = [...consumedTileIds, tile.id];

    setBoxes(nextBoxes);
    setConsumedTileIds(nextConsumed);

    const allFilled = nextBoxes.every((b) => b.filledLetter.length > 0);
    if (allFilled) {
      await evaluateCompletedBoxes(nextBoxes, nextConsumed, usedHintBulbs);
    } else {
      emitStateChange(
        currentIndex,
        nextBoxes,
        nextConsumed,
        usedHintBulbs,
        results
      );
    }
  };

  const handleBackspace = () => {
    if (isCelebratingWord) return;
    // Remove the most recently placed child letter (rightmost box with source === 'child')
    let lastChildIdx = -1;
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (boxes[i].source === 'child' && boxes[i].filledLetter.length > 0) {
        lastChildIdx = i;
        break;
      }
    }
    if (lastChildIdx === -1) return;

    const removedTileId = boxes[lastChildIdx].tileId;
    const nextBoxes = boxes.map((b, idx) =>
      idx === lastChildIdx
        ? { ...b, filledLetter: '', source: 'empty' as const, tileId: null }
        : b
    );
    const nextConsumed = removedTileId
      ? consumedTileIds.filter((id) => id !== removedTileId)
      : [...consumedTileIds];

    setBoxes(nextBoxes);
    setConsumedTileIds(nextConsumed);
    emitStateChange(
      currentIndex,
      nextBoxes,
      nextConsumed,
      usedHintBulbs,
      results
    );
  };

  const handleReset = () => {
    if (isCelebratingWord) return;
    const returnedTileIds = new Set<string>();
    const nextBoxes = boxes.map((b) => {
      if (b.source === 'child') {
        if (b.tileId) returnedTileIds.add(b.tileId);
        return { ...b, filledLetter: '', source: 'empty' as const, tileId: null };
      }
      return b;
    });
    const nextConsumed = consumedTileIds.filter((id) => !returnedTileIds.has(id));
    setBoxes(nextBoxes);
    setConsumedTileIds(nextConsumed);
    emitStateChange(
      currentIndex,
      nextBoxes,
      nextConsumed,
      usedHintBulbs,
      results
    );
  };

  const handleUseHint = async () => {
    if (isCelebratingWord) return;
    if (usedHintBulbs >= hintCounts.totalBulbs) return;

    soundManager.unlockOnFirstInteraction();
    const outcome = applyHintReveal(boxes, tiles, consumedTileIds, randomFn);
    if (outcome.revealedIndex === null) return;

    const nextUsedBulbs = usedHintBulbs + 1;
    setBoxes(outcome.boxes);
    setConsumedTileIds(outcome.consumedTileIds);
    setUsedHintBulbs(nextUsedBulbs);

    if (outcome.allBoxesFilled) {
      await evaluateCompletedBoxes(
        outcome.boxes,
        outcome.consumedTileIds,
        nextUsedBulbs
      );
    } else {
      emitStateChange(
        currentIndex,
        outcome.boxes,
        outcome.consumedTileIds,
        nextUsedBulbs,
        results
      );
    }
  };

  return (
    <div
      data-testid="writing-session"
      data-spelling-session="true"
      data-celebrating={isCelebratingWord ? 'true' : 'false'}
      data-child-hints-used={String(childHintsUsedOnWord)}
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9f9ff',
        color: '#121c2c',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header adapted from UI_TEMPLATES/kids_spelling_word_game */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 50,
          backgroundColor: 'rgba(249, 249, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            height: '80px',
            maxWidth: '480px',
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToLinkHome && (
              <button
                type="button"
                aria-label="Go to link home"
                data-testid="spelling-back-button"
                onClick={onBackToLinkHome}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#dee8ff',
                  color: '#121c2c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 0 0 #c4d5f2',
                  cursor: 'pointer',
                }}
              >
                <MaterialIcon name="arrow_back" size={22} color="#121c2c" />
              </button>
            )}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                backgroundColor: '#04a8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 0 0 #006399',
              }}
            >
              <MaterialIcon name="spellcheck" size={20} color="#ffffff" />
            </div>
            <h1
              style={{
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#7c5800',
                margin: 0,
              }}
            >
              Tap To Spell
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              data-testid="spelling-header-stars"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#ffb800',
                color: '#6b4c00',
                padding: '6px 12px',
                borderRadius: '9999px',
                boxShadow: '0 3px 0 0 #d49b00',
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              <MaterialIcon name="star" size={18} color="#6b4c00" />
              <span>{displayedPoints}</span>
            </div>
            <MuteToggle />
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          width: '100%',
          paddingTop: '88px',
          paddingBottom: '32px',
        }}
      >
        <div
          style={{
            maxWidth: '448px',
            margin: '0 auto',
            padding: '8px 16px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            userSelect: 'none',
          }}
        >
          {shareBanner}

          {/* Level Header & Tactile Striped Progress Tracker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div
                data-testid="level-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ebdcff',
                  color: '#270058',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  boxShadow: '0 3px 0 0 #bca1e8',
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <MaterialIcon
                  name={levelConfig.icon}
                  size={18}
                  color="#7825ea"
                />
                <span>{`Level ${levelConfig.id} • ${levelConfig.name}`}</span>
              </div>

              <div
                data-testid="word-position-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dee8ff',
                  color: '#006399',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 0 0 #c5d7f2',
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <MaterialIcon name="emoji_events" size={16} color="#006399" />
                <span>{`Word ${currentIndex + 1} of ${words.length}`}</span>
              </div>
            </div>

            <ProgressBar completed={currentIndex} total={words.length} />
          </div>

          {/* Chunky Prompt Question Banner (without out-of-scope TTS speaker button) */}
          <div
            data-testid="prompt-banner"
            style={{
              backgroundColor: '#ffb800',
              color: '#6b4c00',
              borderRadius: '20px',
              padding: '14px 16px',
              boxShadow: '0 6px 0 0 #c48800',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                color: '#7c5800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 0 0 #ecd38c',
                flexShrink: 0,
              }}
            >
              <MaterialIcon name="help" size={24} color="#7c5800" />
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'Rubik, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#6b4c00',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                What is this picture?
              </p>
              <p
                style={{
                  fontFamily: '"Nunito Sans", system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#6b4c00',
                  margin: '2px 0 0 0',
                }}
              >
                {`Spell the ${currentItem.word.length}-letter word!`}
              </p>
            </div>
          </div>

          {/* Center Stage Visual Frame with "+N pts" badge */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              data-testid="points-per-word-badge"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-4px',
                zIndex: 10,
                backgroundColor: '#cde5ff',
                color: '#001d32',
                padding: '4px 10px',
                borderRadius: '9999px',
                boxShadow: '0 3px 0 0 #91bde6',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transform: 'rotate(6deg)',
                fontFamily: 'Rubik, system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <MaterialIcon name="star" size={16} color="#006399" />
              <span>{`+${levelConfig.pointsPerWord} pts`}</span>
            </div>

            <div
              data-testid="word-illustration-frame"
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '12px',
                boxShadow:
                  '0 10px 25px -4px rgba(39, 49, 66, 0.12), 0 6px 0 0 #cbd7ed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '180px',
                  maxHeight: '180px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#dee8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={`/images/words/${currentItem.word}.webp`}
                  alt={currentItem.word}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Light-bulb Hint Row (word.length - 1 bulbs) */}
          <HintBulbs
            totalBulbs={hintCounts.totalBulbs}
            usedBulbs={usedHintBulbs}
            disabled={isCelebratingWord}
            onUseHint={handleUseHint}
          />

          {/* Interactive Letter Entry Slots */}
          <LetterBoxes
            boxes={boxes}
            isCelebrationSuccess={isCelebratingWord}
            isShaking={isShakingBoxes}
          />

          {/* Interactive Tactile Letter Keyboard */}
          <AlphabetKeyboard
            tiles={tiles}
            consumedTileIds={new Set(consumedTileIds)}
            disabled={isCelebratingWord}
            onTileTap={handleTileTap}
            onBackspace={handleBackspace}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}

export default SpellingSession;
