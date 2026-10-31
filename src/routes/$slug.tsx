import React, { useMemo, useState } from 'react';
import { ReadingSession } from '../components/ReadingSession';
import { WritingSession } from '../components/WritingSession';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { ParentView } from '../components/ParentView';
import { ProgressBar } from '../components/ProgressBar';
import {
  getWordsForGrade,
  selectSessionWords,
  type PracticeMode,
  type WordProgressStatus,
} from '../lib/words';
import {
  clearMidSessionState,
  loadMidSessionState,
  saveMidSessionState,
  type StorageLike,
} from '../lib/local-state';
import type { ParentProgressSummary, SessionItemResult } from '../lib/progress';
import type { GradeNumber } from '../data/words/schema';

export interface PracticeLinkData {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  progress: WordProgressStatus[];
}

export interface PracticeRouteProps {
  slug: string;
  isParentView?: boolean;
  initialMode?: PracticeMode;
  linkData?: PracticeLinkData | null;
  parentSummary?: ParentProgressSummary | null;
  storage?: StorageLike | null;
  onPersistSessionBatch?: (slug: string, results: SessionItemResult[]) => Promise<void>;
}

/**
 * Practice page at `/{slug}` (Tasks 5.5, 5.6, 8.3, 8.4, 8.5, 8.10).
 * - If `?parent` is present, renders `ParentView`.
 * - If slug is invalid or expired, renders a friendly message with a link to create a new one.
 * - Otherwise starts practice immediately — no splash screen, no start button, no interstitial.
 */
export function PracticeRoute({
  slug,
  isParentView = false,
  initialMode = 'read',
  linkData,
  parentSummary,
  storage,
  onPersistSessionBatch,
}: PracticeRouteProps) {
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [progressList, setProgressList] = useState<WordProgressStatus[]>(
    () => linkData?.progress ?? []
  );
  const [phase, setPhase] = useState<'practising' | 'celebration' | 'all-done'>('practising');
  const [roundCounter, setRoundCounter] = useState(0);

  if (isParentView) {
    if (!parentSummary) {
      return <InvalidLinkScreen />;
    }
    return <ParentView summary={parentSummary} />;
  }

  if (!linkData) {
    return <InvalidLinkScreen />;
  }

  const savedMidSession = useMemo(
    () => loadMidSessionState(slug, mode, storage),
    [slug, mode, roundCounter, storage]
  );

  const sessionWords = useMemo(() => {
    const selected = selectSessionWords(linkData.grade, mode, progressList);
    if (savedMidSession && savedMidSession.words.length === selected.length) {
      const byWord = new Map(
        getWordsForGrade(linkData.grade, mode).map((w) => [w.word, w])
      );
      const restored = savedMidSession.words
        .map((w, idx) => {
          const entry = byWord.get(w);
          if (!entry) return null;
          return {
            ...entry,
            prefillFirstLetter: savedMidSession.prefillFlags?.[idx] ?? false,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (restored.length === savedMidSession.words.length) {
        return restored;
      }
    }
    return selected;
  }, [linkData.grade, mode, progressList, savedMidSession]);

  const handleCompleteSession = async (results: SessionItemResult[]) => {
    clearMidSessionState(slug, mode, storage);

    const nowMs = Date.now();
    const updatedProgress = [...progressList];
    for (const item of results) {
      const existingIdx = updatedProgress.findIndex(
        (p) => p.word === item.word && p.mode === item.mode
      );
      if (existingIdx >= 0) {
        const prev = updatedProgress[existingIdx];
        updatedProgress[existingIdx] = {
          ...prev,
          attempts: prev.attempts + item.attempts,
          mastered_at: item.mastered ? prev.mastered_at ?? nowMs : prev.mastered_at,
        };
      } else {
        updatedProgress.push({
          word: item.word,
          mode: item.mode,
          attempts: item.attempts,
          mastered_at: item.mastered ? nowMs : null,
        });
      }
    }
    setProgressList(updatedProgress);
    setPhase('celebration');

    try {
      if (onPersistSessionBatch) {
        await onPersistSessionBatch(slug, results);
      } else {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, results }),
        });
      }
    } catch {
      // Offline / transient network errors do not block the child's celebration screen
    }
  };

  if (phase === 'celebration') {
    return (
      <CelebrationScreen
        onOneMoreRound={() => {
          clearMidSessionState(slug, mode, storage);
          setRoundCounter((c) => c + 1);
          setPhase('practising');
        }}
        onAllDone={() => {
          setPhase('all-done');
        }}
      />
    );
  }

  if (phase === 'all-done') {
    const totalWords = getWordsForGrade(linkData.grade).length;
    const masteredWords = new Set(
      progressList.filter((p) => p.mastered_at !== null).map((p) => p.word)
    ).size;

    return (
      <main
        data-testid="all-done-home"
        style={{
          minHeight: '100vh',
          maxWidth: '420px',
          margin: '0 auto',
          padding: '32px 24px',
          backgroundColor: '#FAF6EE',
          color: '#1D3537',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {linkData.label && (
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{linkData.label}</h1>
        )}
        <div style={{ width: '100%' }}>
          <ProgressBar completed={masteredWords} total={totalWords} />
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            data-testid="start-reading-button"
            onClick={() => {
              setMode('read');
              setRoundCounter((c) => c + 1);
              setPhase('practising');
            }}
            style={{
              flex: 1,
              minHeight: '56px',
              borderRadius: '16px',
              border: '2px solid #1E8A8A',
              backgroundColor: '#FFFFFF',
              color: '#1D3537',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📖 Read
          </button>
          <button
            type="button"
            data-testid="start-writing-button"
            onClick={() => {
              setMode('write');
              setRoundCounter((c) => c + 1);
              setPhase('practising');
            }}
            style={{
              flex: 1,
              minHeight: '56px',
              borderRadius: '16px',
              border: '2px solid #1E8A8A',
              backgroundColor: '#FFFFFF',
              color: '#1D3537',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔤 Spell
          </button>
        </div>
      </main>
    );
  }

  if (mode === 'write') {
    return (
      <WritingSession
        key={`write-${roundCounter}`}
        words={sessionWords}
        initialIndex={savedMidSession?.currentIndex ?? 0}
        initialFilledLetters={savedMidSession?.filledLetters}
        initialConsumedTileIds={savedMidSession?.consumedTileIds}
        initialResults={savedMidSession?.results ?? []}
        onStateChange={(next) => {
          saveMidSessionState(
            {
              slug,
              mode: 'write',
              words: sessionWords.map((w) => w.word),
              prefillFlags: sessionWords.map((w) => w.prefillFirstLetter),
              currentIndex: next.currentIndex,
              filledLetters: next.filledLetters,
              consumedTileIds: next.consumedTileIds,
              results: next.results,
              startedAt: savedMidSession?.startedAt ?? Date.now(),
            },
            storage
          );
        }}
        onComplete={handleCompleteSession}
      />
    );
  }

  return (
    <ReadingSession
      key={`read-${roundCounter}`}
      words={sessionWords}
      initialIndex={savedMidSession?.currentIndex ?? 0}
      initialResults={savedMidSession?.results ?? []}
      onStateChange={(nextIndex, nextResults) => {
        saveMidSessionState(
          {
            slug,
            mode: 'read',
            words: sessionWords.map((w) => w.word),
            prefillFlags: sessionWords.map((w) => w.prefillFirstLetter),
            currentIndex: nextIndex,
            filledLetters: [],
            consumedTileIds: [],
            results: nextResults,
            startedAt: savedMidSession?.startedAt ?? Date.now(),
          },
          storage
        );
      }}
      onComplete={handleCompleteSession}
    />
  );
}

export function InvalidLinkScreen() {
  return (
    <main
      data-testid="invalid-link-screen"
      style={{
        minHeight: '100vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#FAF6EE',
        color: '#1D3537',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
        Practice link not found
      </h1>
      <p style={{ color: '#375A5E', margin: 0, fontSize: '1.05rem' }}>
        This practice link is not available. You can create a new practice link in seconds.
      </p>
      <a
        href="/"
        data-testid="create-new-link-anchor"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '52px',
          padding: '12px 24px',
          borderRadius: '16px',
          backgroundColor: '#1E8A8A',
          color: '#FFFFFF',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1.1rem',
        }}
      >
        Create a new practice link
      </a>
    </main>
  );
}

export default PracticeRoute;

