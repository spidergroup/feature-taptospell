import React, { useEffect, useMemo, useState } from 'react';
import { SpellingSession } from '../components/SpellingSession';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { ParentView } from '../components/ParentView';
import { LinkHome } from '../components/LinkHome';
import { ShareBanner } from '../components/ShareBanner';
import {
  getWordsForGrade,
  selectSpellingLevelWords,
  type PracticeMode,
  type WordProgressStatus,
} from '../lib/words';
import {
  clearMidSessionState,
  loadDeviceState,
  loadMidSessionState,
  loadPerLinkState,
  markShareBannerShown,
  saveMidSessionState,
  savePerLinkState,
  type PerLinkLocalState,
  type StorageLike,
} from '../lib/local-state';
import {
  flushPendingRounds,
  flushPendingRoundsWithBeacon,
  generateRoundId,
  mergeServerStateWithPending,
  queueCompletedRoundLocally,
  type AuthoritativeLinkState,
} from '../lib/sync';
import { computeNextSpellingLevel, getSpellingLevelConfig } from '../lib/levels';
import type { ParentProgressSummary, SessionItemResult } from '../lib/progress';
import type { GradeNumber } from '../data/words/schema';

export interface PracticeLinkData {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  points?: number;
  currentLevel?: number;
  progress: WordProgressStatus[];
}

export interface PracticeRouteProps {
  slug: string;
  isParentView?: boolean;
  /** Version 1.0 always runs spelling ('write') mode per PRD 4.12 & Task 17.2 */
  initialMode?: PracticeMode;
  linkData?: PracticeLinkData | null;
  parentSummary?: ParentProgressSummary | null;
  storage?: StorageLike | null;
  onPersistSessionBatch?: (slug: string, results: SessionItemResult[]) => Promise<void>;
}

/**
 * Practice page at `/{slug}` (PRD 4.1, 4.2, 4.6, 4.7, 4.8, 4.12; Tasks 11.7, 12.5, 13.9, 16.5, 16.6, 17.2).
 * - If `?parent` is present, renders `ParentView` (and refreshes fresh server state on mount).
 * - If slug is invalid or expired, renders `InvalidLinkScreen`.
 * - Otherwise starts a spelling session immediately — rendering from local state first when available
 *   and merging authoritative server state in the background.
 * - Shows `ShareBanner` once over the loaded game ONLY on the device that created the link.
 */
export function PracticeRoute({
  slug,
  isParentView = false,
  linkData,
  parentSummary,
  storage,
  onPersistSessionBatch,
}: PracticeRouteProps) {
  // Version 1.0 is spelling-only: always 'write' mode
  const mode: PracticeMode = 'write';

  const initialPerLinkState = useMemo((): PerLinkLocalState | null => {
    const cached = loadPerLinkState(slug, storage);
    if (cached) return cached;
    if (!linkData) return null;
    return {
      version: 1,
      slug: linkData.slug,
      grade: linkData.grade,
      label: linkData.label,
      points: linkData.points ?? 0,
      currentLevel: linkData.currentLevel ?? 1,
      progress: linkData.progress.map((p) => ({
        word: p.word,
        mode: p.mode,
        attempts: p.attempts,
        hints_used: p.hints_used ?? 0,
        mastered_at: p.mastered_at,
      })),
      pendingRounds: [],
      lastSyncedAt: Date.now(),
    };
  }, [slug, linkData, storage]);

  const [linkState, setLinkState] = useState<PerLinkLocalState | null>(
    initialPerLinkState
  );
  const [liveParentSummary, setLiveParentSummary] = useState<ParentProgressSummary | null>(
    parentSummary ?? null
  );
  const [phase, setPhase] = useState<'practising' | 'celebration' | 'all-done'>('practising');
  const [roundCounter, setRoundCounter] = useState(0);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);

  const [showShareBanner, setShowShareBanner] = useState<boolean>(() => {
    const device = loadDeviceState(storage);
    const entry = device.recentLinks.find((l) => l.slug === slug);
    return Boolean(entry && entry.createdHere && !entry.shareBannerShown);
  });

  // Background refresh from server + online/pagehide listeners for local-first sync (Tasks 16.5, 16.6, 16.9)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isParentView) {
      fetch(`/api/links/${slug}?parent`)
        .then((res) => (res.ok ? res.json() : null))
        .then((fresh) => {
          if (fresh) setLiveParentSummary(fresh as ParentProgressSummary);
        })
        .catch(() => {});
      return;
    }

    // Flush any pending offline rounds first, then fetch latest server state and merge
    flushPendingRounds(slug, { storage })
      .then(() => fetch(`/api/links/${slug}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (!serverData) return;
        const s = serverData as {
          slug: string;
          grade: GradeNumber;
          label: string | null;
          points?: number;
          currentLevel?: number;
          last_active?: number;
          progress?: Array<{
            word: string;
            mode: PracticeMode;
            attempts: number;
            hints_used?: number;
            mastered_at: number | null;
          }>;
        };
        const authoritative: AuthoritativeLinkState = {
          slug: s.slug,
          grade: s.grade,
          label: s.label ?? null,
          points: s.points ?? 0,
          currentLevel: s.currentLevel ?? 1,
          lastActive: s.last_active ?? Date.now(),
          progress: (s.progress ?? []).map((p) => ({
            word: p.word,
            mode: p.mode,
            attempts: p.attempts,
            hints_used: p.hints_used ?? 0,
            mastered_at: p.mastered_at,
          })),
        };
        const merged = mergeServerStateWithPending(
          authoritative,
          loadPerLinkState(slug, storage),
          new Set(),
          storage
        );
        setLinkState(merged);
      })
      .catch(() => {});

    const handleOnline = () => {
      flushPendingRounds(slug, { storage }).then((updated) => {
        if (updated) setLinkState(updated);
      });
    };

    const handleVisibilityOrHide = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingRoundsWithBeacon(slug, storage);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handleVisibilityOrHide);
    document.addEventListener('visibilitychange', handleVisibilityOrHide);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handleVisibilityOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityOrHide);
    };
  }, [slug, isParentView, storage]);

  if (isParentView) {
    if (!liveParentSummary) {
      return <InvalidLinkScreen />;
    }
    return <ParentView summary={liveParentSummary} />;
  }

  if (!linkState) {
    return <InvalidLinkScreen />;
  }

  const currentLevel = linkState.currentLevel ?? 1;
  const levelConfig = getSpellingLevelConfig(currentLevel);

  const savedMidSession = useMemo(
    () => loadMidSessionState(slug, mode, storage),
    [slug, mode, roundCounter, storage]
  );

  const sessionWords = useMemo(() => {
    const selected = selectSpellingLevelWords(
      linkState.grade,
      levelConfig,
      linkState.progress
    );
    if (savedMidSession && savedMidSession.words.length === selected.length) {
      const byWord = new Map(
        getWordsForGrade(linkState.grade, mode).map((w) => [w.word, w])
      );
      const restored = savedMidSession.words
        .map((w, idx) => {
          const entry = byWord.get(w);
          if (!entry) return null;
          return {
            ...entry,
            prefillFirstLetter:
              savedMidSession.prefillFlags?.[idx] ?? levelConfig.prefillFirstLetter,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (restored.length === savedMidSession.words.length) {
        return restored;
      }
    }
    return selected;
  }, [linkState.grade, levelConfig, linkState.progress, savedMidSession]);

  const handleDismissShareBanner = () => {
    markShareBannerShown(slug, storage);
    setShowShareBanner(false);
  };

  const handleCompleteRound = async (
    results: SessionItemResult[],
    roundPointsEarned: number
  ) => {
    clearMidSessionState(slug, mode, storage);

    const nowMs = Date.now();
    // Calculate how many total mastered words the link will have after this round
    const masteredSet = new Set(
      linkState.progress.filter((p) => p.mastered_at !== null).map((p) => p.word)
    );
    for (const r of results) {
      const hintsUsed = r.hintsUsed ?? 0;
      if (r.mastered && hintsUsed === 0) {
        masteredSet.add(r.word);
      }
    }

    const advancement = computeNextSpellingLevel(currentLevel, masteredSet.size);
    const roundId = generateRoundId();

    const updatedLocal = queueCompletedRoundLocally(
      linkState,
      {
        roundId,
        slug,
        level: currentLevel,
        pointsEarned: roundPointsEarned,
        nextLevel: advancement.nextLevel,
        results: results.map((r) => ({
          word: r.word,
          mode: r.mode,
          attempts: r.attempts,
          hintsUsed: r.hintsUsed ?? 0,
          mastered: r.mastered,
        })),
        completedAt: nowMs,
      },
      storage
    );

    setLinkState(updatedLocal);
    setLastRoundPoints(roundPointsEarned);
    setLeveledUpTo(advancement.advanced ? advancement.nextLevel : null);
    setPhase('celebration');

    try {
      if (onPersistSessionBatch) {
        await onPersistSessionBatch(slug, results);
      } else {
        const synced = await flushPendingRounds(slug, {
          storage,
          initialState: updatedLocal,
        });
        if (synced) {
          setLinkState(synced);
        }
      }
    } catch {
      // Offline / transient network errors stay queued in pendingRounds
    }
  };

  if (phase === 'celebration') {
    const nextLevelCfg = leveledUpTo ? getSpellingLevelConfig(leveledUpTo) : null;
    return (
      <CelebrationScreen
        roundPointsEarned={lastRoundPoints}
        leveledUpTo={leveledUpTo}
        levelName={nextLevelCfg?.name}
        onOneMoreRound={() => {
          clearMidSessionState(slug, mode, storage);
          setLeveledUpTo(null);
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
    const totalWords = getWordsForGrade(linkState.grade, 'write').length;
    const masteredWords = new Set(
      linkState.progress.filter((p) => p.mastered_at !== null).map((p) => p.word)
    ).size;

    return (
      <LinkHome
        label={linkState.label}
        currentLevel={linkState.currentLevel}
        points={linkState.points}
        masteredWordsCount={masteredWords}
        totalGradeWordsCount={totalWords}
        onStartSpellingRound={() => {
          setLeveledUpTo(null);
          setRoundCounter((c) => c + 1);
          setPhase('practising');
        }}
      />
    );
  }

  return (
    <SpellingSession
      key={`spell-${roundCounter}-${currentLevel}`}
      words={sessionWords}
      level={levelConfig}
      initialPoints={linkState.points}
      initialIndex={savedMidSession?.currentIndex ?? 0}
      initialFilledLetters={savedMidSession?.filledLetters}
      initialConsumedTileIds={savedMidSession?.consumedTileIds}
      initialBoxes={savedMidSession?.boxes}
      initialUsedHintBulbs={savedMidSession?.usedHintBulbs}
      initialResults={savedMidSession?.results ?? []}
      shareBanner={
        showShareBanner ? (
          <ShareBanner slug={slug} onDismiss={handleDismissShareBanner} />
        ) : undefined
      }
      onBackToLinkHome={() => setPhase('all-done')}
      onStateChange={(next) => {
        saveMidSessionState(
          {
            slug,
            mode: 'write',
            level: currentLevel,
            words: sessionWords.map((w) => w.word),
            prefillFlags: sessionWords.map((w) => w.prefillFirstLetter),
            currentIndex: next.currentIndex,
            filledLetters: next.filledLetters,
            consumedTileIds: next.consumedTileIds,
            boxes: next.boxes,
            usedHintBulbs: next.usedHintBulbs,
            results: next.results,
            startedAt: savedMidSession?.startedAt ?? Date.now(),
          },
          storage
        );
      }}
      onComplete={handleCompleteRound}
    />
  );
}

export function InvalidLinkScreen() {
  return (
    <main
      data-testid="invalid-link-screen"
      style={{
        minHeight: '100vh',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#dfe7f7',
        color: '#121c2c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '20px',
        fontFamily: '"Nunito Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontFamily: 'Rubik, system-ui, sans-serif',
          fontSize: '28px',
          fontWeight: 800,
          margin: 0,
        }}
      >
        Practice link not found
      </h1>
      <p style={{ color: '#514532', margin: 0, fontSize: '17px', fontWeight: 600 }}>
        This practice link is not available. You can create a new practice link in seconds.
      </p>
      <a
        href="/"
        data-testid="create-new-link-anchor"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '54px',
          padding: '12px 24px',
          borderRadius: '18px',
          backgroundColor: '#ffb800',
          color: '#271900',
          boxShadow: '0 6px 0 0 #6b4c00',
          textDecoration: 'none',
          fontFamily: 'Rubik, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
        }}
      >
        Create a new practice link
      </a>
    </main>
  );
}

export default PracticeRoute;
