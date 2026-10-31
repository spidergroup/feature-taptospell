import { describe, it, expect } from 'vitest';
import {
  saveMidSessionState,
  loadMidSessionState,
  clearMidSessionState,
  getMutePreference,
  setMutePreference,
  type MidSessionState,
  type StorageLike,
} from './local-state';

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
      throw new Error('SecurityError: Private browsing storage disabled');
    },
    setItem: () => {
      throw new Error('QuotaExceededError: Private browsing storage disabled');
    },
    removeItem: () => {
      throw new Error('SecurityError: Private browsing storage disabled');
    },
  };
}

describe('local-state.ts — guarded localStorage wrapper (Tasks 5.6 & 8.9)', () => {
  const sampleState: MidSessionState = {
    slug: 'k7m2xq4rvb',
    mode: 'write',
    words: ['cat', 'dog', 'sun'],
    prefillFlags: [true, true, false],
    currentIndex: 1,
    filledLetters: ['d'],
    consumedTileIds: [],
    results: [{ word: 'cat', mode: 'write', attempts: 1, mastered: true }],
    startedAt: 1700000000000,
  };

  it('saves, loads, and clears mid-session state and mute preference', () => {
    const store = createMemoryStorage();
    expect(saveMidSessionState(sampleState, store)).toBe(true);
    expect(loadMidSessionState('k7m2xq4rvb', 'write', store)).toEqual(sampleState);
    expect(clearMidSessionState('k7m2xq4rvb', 'write', store)).toBe(true);
    expect(loadMidSessionState('k7m2xq4rvb', 'write', store)).toBeNull();

    expect(getMutePreference(store)).toBe(false);
    expect(setMutePreference(true, store)).toBe(true);
    expect(getMutePreference(store)).toBe(true);
  });

  it('catches all exceptions when localStorage throws in private browsing (Task 8.9)', () => {
    const throwingStore = createThrowingStorage();

    expect(() => saveMidSessionState(sampleState, throwingStore)).not.toThrow();
    expect(saveMidSessionState(sampleState, throwingStore)).toBe(false);

    expect(() => loadMidSessionState('k7m2xq4rvb', 'write', throwingStore)).not.toThrow();
    expect(loadMidSessionState('k7m2xq4rvb', 'write', throwingStore)).toBeNull();

    expect(() => clearMidSessionState('k7m2xq4rvb', 'write', throwingStore)).not.toThrow();
    expect(clearMidSessionState('k7m2xq4rvb', 'write', throwingStore)).toBe(false);

    expect(() => getMutePreference(throwingStore)).not.toThrow();
    expect(getMutePreference(throwingStore)).toBe(false);

    expect(() => setMutePreference(true, throwingStore)).not.toThrow();
    expect(setMutePreference(true, throwingStore)).toBe(false);
  });
});

