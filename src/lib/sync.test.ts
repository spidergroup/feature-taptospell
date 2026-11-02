import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { handlePostSync } from '../routes/api/sync';
import {
  flushPendingRounds,
  getParentProgressSummary,
  mergeServerStateWithPending,
  queueCompletedRoundLocally,
  type AuthoritativeLinkState,
} from './sync';
import {
  clearMemoryFallback,
  loadDeviceState,
  loadPerLinkState,
  savePerLinkState,
  setSelectedGradePreference,
  type PerLinkLocalState,
  type StorageLike,
} from './local-state';
import { resetTestDatabase } from '../test-helpers/db';

const db = (env as unknown as { DB: D1Database }).DB;

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

function createThrowingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  };
}

describe('sync.ts — local-first storage and idempotent cross-device sync (Task 16.0)', () => {
  beforeEach(async () => {
    await resetTestDatabase(db);
    clearMemoryFallback();
  });

  it('persists a round in one D1 batch, ignores duplicate round_id sends, and merges rounds from two devices (Tasks 16.3, 16.7)', async () => {
    const slug = 'k7m2xq4rvb';
    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, points, current_level, created_at, last_active) VALUES (?, ?, ?, 0, 1, 1000, 1000)'
      )
      .bind(slug, 0, 'Jimmy')
      .run();

    const batchSpy = vi.spyOn(db, 'batch');

    // Device A completes round 1 (+100 pts, advances to level 2)
    const round1Body = {
      roundId: 'round-uuid-device-a-1',
      slug,
      level: 1,
      pointsEarned: 100,
      nextLevel: 2,
      results: [
        { word: 'cat', mode: 'write', attempts: 1, hintsUsed: 0, mastered: true },
        { word: 'dog', mode: 'write', attempts: 1, hintsUsed: 1, mastered: true },
      ],
    };

    const resA1 = await handlePostSync(
      new Request('https://taptospell.com/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round1Body),
      }),
      db,
      2000
    );
    expect(resA1.status).toBe(200);
    expect(batchSpy).toHaveBeenCalledTimes(1);

    const stateAfterA1 = (await resA1.json()) as AuthoritativeLinkState;
    expect(stateAfterA1.points).toBe(100);
    expect(stateAfterA1.currentLevel).toBe(2);

    // Duplicate send of the exact same roundId (e.g. sendBeacon + fetch retry) is ignored without double-counting
    const dupRes = await handlePostSync(
      new Request('https://taptospell.com/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round1Body),
      }),
      db,
      2500
    );
    expect(dupRes.status).toBe(200);
    const stateAfterDup = (await dupRes.json()) as AuthoritativeLinkState;
    expect(stateAfterDup.points).toBe(100);
    expect(stateAfterDup.duplicateIgnored).toBe(true);
    // No second db.batch was executed
    expect(batchSpy).toHaveBeenCalledTimes(1);

    // Device B (still on level 1 locally) submits a different roundId (+80 pts)
    const round2Body = {
      roundId: 'round-uuid-device-b-2',
      slug,
      level: 1,
      pointsEarned: 80,
      nextLevel: 1,
      results: [
        { word: 'sun', mode: 'write', attempts: 2, hintsUsed: 0, mastered: false },
      ],
    };

    const resB = await handlePostSync(
      new Request('https://taptospell.com/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round2Body),
      }),
      db,
      3000
    );
    expect(resB.status).toBe(200);
    const stateAfterB = (await resB.json()) as AuthoritativeLinkState;
    // Points from both devices are summed (100 + 80 = 180) and level stays at MAX(2, 1) = 2
    expect(stateAfterB.points).toBe(180);
    expect(stateAfterB.currentLevel).toBe(2);

    // PRD 4.7 #56: 'dog' used 1 hint, so it earned stars but was not marked mastered; 'cat' used 0 hints and is mastered
    const parentSummary = await getParentProgressSummary(db, slug);
    expect(parentSummary?.masteredCount).toBe(1);
    expect(parentSummary?.neededHintsWords).toEqual(['dog']);
    expect(parentSummary?.workingOnWords.sort()).toEqual(['dog', 'sun']);

    batchSpy.mockRestore();
  });

  it('queues rounds offline locally, preserves them across server merges, and flushes once online (Tasks 16.5, 16.7)', async () => {
    const store = createMemoryStorage();
    const slug = 'p9n3wt5yzc';

    const initial: PerLinkLocalState = {
      version: 1,
      slug,
      grade: 1,
      label: 'Leo',
      points: 30,
      currentLevel: 1,
      progress: [],
      pendingRounds: [],
      lastSyncedAt: 1000,
    };
    savePerLinkState(initial, store);

    // Complete a round while offline
    const afterOfflineRound = queueCompletedRoundLocally(
      initial,
      {
        roundId: 'offline-round-1',
        slug,
        level: 1,
        pointsEarned: 100,
        nextLevel: 2,
        results: [{ word: 'leg', mode: 'write', attempts: 1, hintsUsed: 0, mastered: true }],
        completedAt: 2000,
      },
      store
    );
    expect(afterOfflineRound.points).toBe(130);
    expect(afterOfflineRound.currentLevel).toBe(2);
    expect(afterOfflineRound.pendingRounds).toHaveLength(1);

    // Simulate network failure on first flush attempt -> round stays queued
    await flushPendingRounds(slug, {
      storage: store,
      transport: async () => {
        throw new Error('Network offline');
      },
    });
    expect(loadPerLinkState(slug, store)?.pendingRounds).toHaveLength(1);

    // Simulate reconnect -> flushes once and clears pendingRounds
    let transportCalls = 0;
    const synced = await flushPendingRounds(slug, {
      storage: store,
      transport: async (round) => {
        transportCalls++;
        return {
          slug: round.slug,
          grade: 1,
          label: 'Leo',
          points: 130,
          currentLevel: 2,
          lastActive: 3000,
          progress: [
            {
              word: 'leg',
              mode: 'write',
              attempts: 1,
              hints_used: 0,
              mastered_at: 2000,
            },
          ],
        };
      },
    });

    expect(transportCalls).toBe(1);
    expect(synced?.points).toBe(130);
    expect(synced?.pendingRounds).toHaveLength(0);
  });

  it('falls back to in-memory state when localStorage throws and still syncs (PRD 4.7 #54, Task 16.7)', () => {
    const throwingStore = createThrowingStorage();
    setSelectedGradePreference(3, throwingStore);
    expect(loadDeviceState(throwingStore).selectedGrade).toBe(3);

    const serverState: AuthoritativeLinkState = {
      slug: 'mem2345678',
      grade: 3,
      label: null,
      points: 50,
      currentLevel: 1,
      lastActive: 1000,
      progress: [],
    };
    const merged = mergeServerStateWithPending(
      serverState,
      null,
      new Set(),
      throwingStore
    );
    expect(merged.points).toBe(50);
    expect(loadPerLinkState('mem2345678', throwingStore)?.points).toBe(50);
  });
});

