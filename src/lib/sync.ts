import type { GradeNumber } from '../data/words/schema';
import { getWordsForGrade, type PracticeMode, type WordProgressStatus } from './words';
import { getSpellingLevelConfig, MAX_SPELLING_LEVEL, MIN_SPELLING_LEVEL } from './levels';
import {
  loadPerLinkState,
  savePerLinkState,
  type PendingRoundSyncItem,
  type PerLinkLocalState,
  type PerLinkWordStat,
  type SessionWordResult,
  type StorageLike,
} from './local-state';

export interface AuthoritativeLinkState {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  points: number;
  currentLevel: number;
  lastActive: number;
  progress: PerLinkWordStat[];
  duplicateIgnored?: boolean;
}

export interface ParentProgressSummary {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  points: number;
  currentLevel: number;
  currentLevelName: string;
  totalGradeWords: number;
  masteredCount: number;
  remainingCount: number;
  lastPractisedAt: number;
  lastSyncedAt: number;
  workingOnWords: string[];
  neededHintsWords: string[];
}

export interface SyncRoundRequestPayload {
  roundId: string;
  slug: string;
  level: number;
  pointsEarned: number;
  nextLevel?: number;
  results: SessionWordResult[];
}

export function generateRoundId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rnd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Reads all progress rows for a link slug (including `hints_used`).
 */
export async function getProgressForLink(
  db: D1Database,
  slug: string
): Promise<PerLinkWordStat[]> {
  const { results } = await db
    .prepare(
      'SELECT word, mode, attempts, hints_used, mastered_at FROM progress WHERE slug = ?'
    )
    .bind(slug)
    .all<PerLinkWordStat>();

  return (results ?? []).map((r) => ({
    word: r.word,
    mode: r.mode,
    attempts: Number(r.attempts ?? 0),
    hints_used: Number(r.hints_used ?? 0),
    mastered_at: r.mastered_at ?? null,
  }));
}

/**
 * Fetches the authoritative server state for a link slug.
 */
export async function getAuthoritativeLinkState(
  db: D1Database,
  slug: string
): Promise<AuthoritativeLinkState | null> {
  const row = await db
    .prepare(
      'SELECT slug, grade, label, points, current_level, last_active FROM links WHERE slug = ? LIMIT 1'
    )
    .bind(slug)
    .first<{
      slug: string;
      grade: GradeNumber;
      label: string | null;
      points: number;
      current_level: number;
      last_active: number;
    }>();

  if (!row) return null;

  const progress = await getProgressForLink(db, slug);

  return {
    slug: row.slug,
    grade: row.grade,
    label: row.label ?? null,
    points: Number(row.points ?? 0),
    currentLevel: Number(row.current_level ?? 1),
    lastActive: Number(row.last_active),
    progress,
  };
}

/**
 * Processes a round batch on the server idempotently in a single D1 batch (PRD 4.7 #50-52, Task 16.3):
 * - Checks `rounds` for `roundId`. If already present, returns current authoritative state without double-counting.
 * - Otherwise, in a single `db.batch(...)`:
 *   1. Inserts the `rounds` row.
 *   2. Upserts all per-word results (`attempts` summed, `hints_used` summed, earliest `mastered_at` kept; words solved with hints are not marked mastered per PRD 4.7 #56).
 *   3. Updates `links`: adds `pointsEarned` to `points`, sets `current_level = MAX(current_level, targetLevel)`, updates `last_active`.
 * - Returns the updated authoritative state.
 */
export async function recordRoundSyncOnServer(
  db: D1Database,
  payload: SyncRoundRequestPayload,
  nowMs: number = Date.now()
): Promise<AuthoritativeLinkState | null> {
  const existingRound = await db
    .prepare('SELECT round_id FROM rounds WHERE round_id = ? LIMIT 1')
    .bind(payload.roundId)
    .first<{ round_id: string }>();

  if (existingRound) {
    const current = await getAuthoritativeLinkState(db, payload.slug);
    return current ? { ...current, duplicateIgnored: true } : null;
  }

  const clampedLevel = Math.max(
    MIN_SPELLING_LEVEL,
    Math.min(MAX_SPELLING_LEVEL, Math.round(payload.nextLevel ?? payload.level))
  );
  const safePoints = Math.max(0, Math.round(payload.pointsEarned));

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO rounds (round_id, slug, level, points, received_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(payload.roundId, payload.slug, payload.level, safePoints, nowMs),
  ];

  if (payload.results.length > 0) {
    const placeholders = payload.results.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const bindings: Array<string | number | null> = [];

    for (const item of payload.results) {
      const hintsUsed = Math.max(0, Math.round(item.hintsUsed ?? 0));
      // PRD 4.7 #56: A word solved with one or more hints counts towards stars but is not marked mastered
      const isMastered = item.mastered && hintsUsed === 0;
      bindings.push(
        payload.slug,
        item.word,
        item.mode,
        Math.max(1, Math.round(item.attempts)),
        hintsUsed,
        isMastered ? nowMs : null
      );
    }

    const upsertSql = `
      INSERT INTO progress (slug, word, mode, attempts, hints_used, mastered_at)
      VALUES ${placeholders}
      ON CONFLICT(slug, word, mode) DO UPDATE SET
        attempts = progress.attempts + excluded.attempts,
        hints_used = progress.hints_used + excluded.hints_used,
        mastered_at = COALESCE(progress.mastered_at, excluded.mastered_at)
    `;
    statements.push(db.prepare(upsertSql).bind(...bindings));
  }

  statements.push(
    db
      .prepare(
        `UPDATE links
         SET points = points + ?,
             current_level = CASE WHEN current_level >= ? THEN current_level ELSE ? END,
             last_active = ?
         WHERE slug = ?`
      )
      .bind(safePoints, clampedLevel, clampedLevel, nowMs, payload.slug)
  );

  await db.batch(statements);

  return getAuthoritativeLinkState(db, payload.slug);
}

/**
 * Computes the Parent Progress View summary for `?parent` (PRD Section 4.8, Task 16.9).
 */
export async function getParentProgressSummary(
  db: D1Database,
  slug: string
): Promise<ParentProgressSummary | null> {
  const state = await getAuthoritativeLinkState(db, slug);
  if (!state) return null;

  // Version 1.0 is spelling-only: grade words for spelling are picturable words, or total grade words
  const gradeWords = getWordsForGrade(state.grade);
  const totalGradeWords = gradeWords.length;

  const masteredWordsSet = new Set<string>();
  const missedWordsSet = new Set<string>();
  const hintedWordsSet = new Set<string>();

  for (const row of state.progress) {
    if (row.mastered_at !== null) {
      masteredWordsSet.add(row.word);
    }
    if (row.hints_used > 0) {
      hintedWordsSet.add(row.word);
    }
  }

  for (const row of state.progress) {
    if (
      row.mastered_at === null &&
      row.attempts > 0 &&
      !masteredWordsSet.has(row.word)
    ) {
      missedWordsSet.add(row.word);
    }
  }

  const masteredCount = masteredWordsSet.size;
  const remainingCount = Math.max(0, totalGradeWords - masteredCount);
  const levelCfg = getSpellingLevelConfig(state.currentLevel);

  return {
    slug: state.slug,
    grade: state.grade,
    label: state.label,
    points: state.points,
    currentLevel: state.currentLevel,
    currentLevelName: levelCfg.name,
    totalGradeWords,
    masteredCount,
    remainingCount,
    lastPractisedAt: state.lastActive,
    lastSyncedAt: state.lastActive,
    workingOnWords: Array.from(missedWordsSet),
    neededHintsWords: Array.from(hintedWordsSet),
  };
}

/**
 * Applies a single round locally to a `PerLinkLocalState` (without queuing), returning the updated state.
 */
export function applyRoundToState(
  base: PerLinkLocalState,
  round: PendingRoundSyncItem
): PerLinkLocalState {
  const nextProgress = base.progress.map((p) => ({ ...p }));

  for (const item of round.results) {
    const hintsUsed = Math.max(0, Math.round(item.hintsUsed ?? 0));
    const isMastered = item.mastered && hintsUsed === 0;
    const idx = nextProgress.findIndex(
      (p) => p.word === item.word && p.mode === item.mode
    );
    if (idx >= 0) {
      const prev = nextProgress[idx];
      nextProgress[idx] = {
        ...prev,
        attempts: prev.attempts + Math.max(1, item.attempts),
        hints_used: prev.hints_used + hintsUsed,
        mastered_at: prev.mastered_at ?? (isMastered ? round.completedAt : null),
      };
    } else {
      nextProgress.push({
        word: item.word,
        mode: item.mode as PracticeMode,
        attempts: Math.max(1, item.attempts),
        hints_used: hintsUsed,
        mastered_at: isMastered ? round.completedAt : null,
      });
    }
  }

  return {
    ...base,
    points: base.points + Math.max(0, round.pointsEarned),
    currentLevel: Math.max(base.currentLevel, round.nextLevel),
    progress: nextProgress,
  };
}

/**
 * Queues a completed round locally first (PRD 4.7 #48), updating points, level, and per-word progress immediately.
 */
export function queueCompletedRoundLocally(
  currentState: PerLinkLocalState,
  round: PendingRoundSyncItem,
  storage?: StorageLike | null
): PerLinkLocalState {
  if (currentState.pendingRounds.some((r) => r.roundId === round.roundId)) {
    return currentState;
  }
  const applied = applyRoundToState(currentState, round);
  const nextState: PerLinkLocalState = {
    ...applied,
    pendingRounds: [...currentState.pendingRounds, round],
  };
  savePerLinkState(nextState, storage);
  return nextState;
}

/**
 * Merges an authoritative server state with any still-pending local rounds (PRD 4.7 #52, Task 16.5):
 * - Replaces the local base cache with the server state
 * - Filters out any `completedRoundIds` that have now been confirmed by the server
 * - Re-applies any remaining `pendingRounds` on top so offline rounds are never lost
 */
export function mergeServerStateWithPending(
  serverState: AuthoritativeLinkState,
  localState: PerLinkLocalState | null,
  confirmedRoundIds: ReadonlySet<string> = new Set(),
  storage?: StorageLike | null,
  nowMs: number = Date.now()
): PerLinkLocalState {
  const remainingPending = (localState?.pendingRounds ?? []).filter(
    (r) => !confirmedRoundIds.has(r.roundId)
  );

  let merged: PerLinkLocalState = {
    version: 1,
    slug: serverState.slug,
    grade: serverState.grade,
    label: serverState.label,
    points: serverState.points,
    currentLevel: serverState.currentLevel,
    progress: serverState.progress.map((p) => ({ ...p })),
    pendingRounds: remainingPending,
    lastSyncedAt: nowMs,
  };

  for (const pending of remainingPending) {
    merged = applyRoundToState(merged, pending);
  }
  merged.pendingRounds = remainingPending;

  savePerLinkState(merged, storage);
  return merged;
}

export type SyncTransportFn = (
  round: PendingRoundSyncItem
) => Promise<AuthoritativeLinkState | null>;

/**
 * Flushes all pending rounds for a link to the server (PRD 4.7 #50-53, Task 16.5).
 * Retries on network error by keeping unsynced rounds in `pendingRounds`.
 */
export async function flushPendingRounds(
  slug: string,
  options?: {
    storage?: StorageLike | null;
    transport?: SyncTransportFn;
    initialState?: PerLinkLocalState;
  }
): Promise<PerLinkLocalState | null> {
  const storage = options?.storage;
  let state = options?.initialState ?? loadPerLinkState(slug, storage);
  if (!state) return null;

  if (state.pendingRounds.length === 0) {
    return state;
  }

  const transport: SyncTransportFn =
    options?.transport ??
    (async (round) => {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: round.roundId,
          slug: round.slug,
          level: round.level,
          pointsEarned: round.pointsEarned,
          nextLevel: round.nextLevel,
          results: round.results,
        }),
      });
      if (!res.ok) {
        throw new Error(`Sync failed with status ${res.status}`);
      }
      return (await res.json()) as AuthoritativeLinkState;
    });

  const confirmedIds = new Set<string>();
  let latestServerState: AuthoritativeLinkState | null = null;

  for (const round of [...state.pendingRounds]) {
    try {
      const serverResp = await transport(round);
      if (serverResp) {
        confirmedIds.add(round.roundId);
        latestServerState = serverResp;
      }
    } catch {
      // Stop on network error; remaining rounds stay queued for online/next open retry
      break;
    }
  }

  if (latestServerState) {
    state = mergeServerStateWithPending(
      latestServerState,
      state,
      confirmedIds,
      storage
    );
  }

  return state;
}

/**
 * Flushes any pending rounds via `navigator.sendBeacon` when the page is hidden or closed (PRD 4.7 #50).
 */
export function flushPendingRoundsWithBeacon(
  slug: string,
  storage?: StorageLike | null,
  sendBeaconFn?: (url: string, data: BodyInit) => boolean
): number {
  const state = loadPerLinkState(slug, storage);
  if (!state || state.pendingRounds.length === 0) return 0;

  const beacon =
    sendBeaconFn ??
    (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
      ? navigator.sendBeacon.bind(navigator)
      : null);

  if (!beacon) return 0;

  let sentCount = 0;
  for (const round of state.pendingRounds) {
    try {
      const payload = JSON.stringify({
        roundId: round.roundId,
        slug: round.slug,
        level: round.level,
        pointsEarned: round.pointsEarned,
        nextLevel: round.nextLevel,
        results: round.results,
      });
      const blob =
        typeof Blob !== 'undefined'
          ? new Blob([payload], { type: 'application/json' })
          : payload;
      if (beacon('/api/sync', blob)) {
        sentCount++;
      }
    } catch {
      // Ignore beacon errors
    }
  }
  return sentCount;
}

