import React, { useEffect, useState } from 'react';
import { ProgressBar } from './ProgressBar';
import { MuteToggle } from './MuteToggle';
import type { SessionWordItem } from '../lib/words';
import type { SessionItemResult } from '../lib/progress';
import { getSoundManager, type SoundManager } from '../lib/audio';

export interface ReadingSessionProps {
  words: SessionWordItem[];
  initialIndex?: number;
  initialResults?: SessionItemResult[];
  soundManager?: SoundManager;
  onStateChange?: (index: number, results: SessionItemResult[]) => void;
  onComplete: (results: SessionItemResult[]) => void;
}

/**
 * Reading mode UI (Screen 3 mockup — Tasks 5.3, 7.11, 7.13).
 * Displays one word at a time, large and centred, with a thin fill-only progress bar
 * and mute toggle. No back button, no menu, no numeric score.
 */
export function ReadingSession({
  words,
  initialIndex = 0,
  initialResults = [],
  soundManager = getSoundManager(),
  onStateChange,
  onComplete,
}: ReadingSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [results, setResults] = useState<SessionItemResult[]>(initialResults);
  const [currentAttempts, setCurrentAttempts] = useState(1);
  const [missedOnCurrent, setMissedOnCurrent] = useState(false);

  useEffect(() => {
    soundManager.preloadAll();
  }, [soundManager]);

  const currentItem = words[currentIndex];
  if (!currentItem) {
    return null;
  }

  const handleCorrectTap = async () => {
    soundManager.unlockOnFirstInteraction();
    await soundManager.play('success');

    const itemResult: SessionItemResult = {
      word: currentItem.word,
      mode: 'read',
      attempts: currentAttempts,
      mastered: !missedOnCurrent,
    };

    const nextResults = [...results, itemResult];
    const nextIndex = currentIndex + 1;

    if (nextIndex >= words.length) {
      onComplete(nextResults);
    } else {
      setResults(nextResults);
      setCurrentIndex(nextIndex);
      setCurrentAttempts(1);
      setMissedOnCurrent(false);
      onStateChange?.(nextIndex, nextResults);
    }
  };

  const handleRetryTap = async () => {
    soundManager.unlockOnFirstInteraction();
    await soundManager.play('retry');
    setCurrentAttempts((prev) => prev + 1);
    setMissedOnCurrent(true);
  };

  return (
    <main
      data-testid="reading-session"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '20px 24px',
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
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px 0',
        }}
      >
        <div
          data-testid="reading-word"
          onClick={handleCorrectTap}
          style={{
            fontSize: '4rem',
            fontWeight: 800,
            color: '#1D3537',
            letterSpacing: '0.02em',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {currentItem.word}
        </div>
      </section>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          paddingBottom: '16px',
        }}
      >
        <button
          type="button"
          data-testid="reading-retry-button"
          aria-label="Practice word again"
          onClick={handleRetryTap}
          style={{
            minWidth: '64px',
            minHeight: '56px',
            padding: '12px 24px',
            borderRadius: '18px',
            border: '2px solid #D5CFC2',
            backgroundColor: '#FFFFFF',
            color: '#234E52',
            fontSize: '1.25rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↻
        </button>
        <button
          type="button"
          data-testid="reading-next-button"
          aria-label="Got it, next word"
          onClick={handleCorrectTap}
          style={{
            minWidth: '140px',
            minHeight: '56px',
            padding: '12px 32px',
            borderRadius: '18px',
            border: '2px solid #1E8A8A',
            backgroundColor: '#1E8A8A',
            color: '#FFFFFF',
            fontSize: '1.25rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ✓
        </button>
      </footer>
    </main>
  );
}

