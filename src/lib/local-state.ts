import type { PracticeMode } from './words';
import type { GradeNumber } from '../data/words/schema';
import type { BoxSlotState } from './hints';

export interface SessionWordResult {
  word: string;
  mode: PracticeMode;
  attempts: number;
  hintsUsed?: number;
  mastered: boolean;
}

export interface MidSessionState {
  slug: string;
  mode: PracticeMode;
  level?: number;
  words: string[];
  prefillFlags: boolean[];
  currentIndex: number;
  filledLetters: string[];
  consumedTileIds: string[];
  boxes?: BoxSlotState[];
  usedHintBulbs?: number;
  results: SessionWordResult[];
  startedAt: number;
}

export interface RecentLinkEntry {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  points: number;
  currentLevel: number;
  createdHere: boolean;
  shareBannerShown: boolean;
  lastUsedAt: number;
}

export interface DeviceState {
  version: 1;
  selectedGrade: GradeNumber;
  recentLinks: RecentLinkEntry[];
}

export interface PendingRoundSyncItem {
  roundId: string;
  slug: string;
  level: number;
  pointsEarned: number;
  nextLevel: number;
  results: SessionWordResult[];
  completedAt: number;
}

export interface PerLinkWordStat {
  word: string;
  mode: PracticeMode;
  attempts: number;
  hints_used: number;
  mastered_at: number | null;
}

export interface PerLinkLocalState {
  version: 1;
  slug: string;
  grade: GradeNumber;
  label: string | null;
  points: number;
  currentLevel: number;
  progress: PerLinkWordStat[];
  pendingRounds: PendingRoundSyncItem[];
  lastSyncedAt: number | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SESSION_KEY_PREFIX = 'taptospell:session:';
const LINK_STATE_KEY_PREFIX = 'taptospell:link:';
const DEVICE_STATE_KEY = 'taptospell:device:v1';
const MUTE_KEY = 'taptospell:muted';

// In-memory fallback when localStorage is unavailable or throws (PRD 4.7 #54)
const memoryFallback = new Map<string, string>();

function getDefaultStorage(): StorageLike | null {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      'localStorage' in globalThis &&
      globalThis.localStorage
    ) {
      return globalThis.localStorage;
    }
  } catch {
    // Private browsing or locked-down school devices may throw on property access
  }
  return null;
}

function safeRead(key: string, storage: StorageLike | null): string | null {
  try {
    if (storage) {
      return storage.getItem(key);
    }
  } catch {
    // Fall back to in-memory store
  }
  return memoryFallback.get(key) ?? null;
}

function safeWrite(key: string, value: string, storage: StorageLike | null): boolean {
  memoryFallback.set(key, value);
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function clearMemoryFallback(): void {
  memoryFallback.clear();
}

export function saveMidSessionState(
  state: MidSessionState,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      `${SESSION_KEY_PREFIX}${state.slug}:${state.mode}`,
      JSON.stringify(state)
    );
    return true;
  } catch {
    return false;
  }
}

export function loadMidSessionState(
  slug: string,
  mode: PracticeMode,
  storage: StorageLike | null = getDefaultStorage()
): MidSessionState | null {
  try {
    if (!storage) return null;
    const raw = storage.getItem(`${SESSION_KEY_PREFIX}${slug}:${mode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MidSessionState;
    if (
      !parsed ||
      parsed.slug !== slug ||
      parsed.mode !== mode ||
      !Array.isArray(parsed.words) ||
      typeof parsed.currentIndex !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearMidSessionState(
  slug: string,
  mode: PracticeMode,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(`${SESSION_KEY_PREFIX}${slug}:${mode}`);
    return true;
  } catch {
    return false;
  }
}

export function getMutePreference(
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  try {
    if (!storage) return false;
    return storage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMutePreference(
  muted: boolean,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(MUTE_KEY, muted ? 'true' : 'false');
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the device-wide state (last selected grade, recent links, createdHere flags).
 * Defaults to Kindergarten (`1`) when no state exists (PRD 4.1 #2).
 */
export function loadDeviceState(
  storage: StorageLike | null = getDefaultStorage()
): DeviceState {
  const defaultState: DeviceState = {
    version: 1,
    selectedGrade: 1,
    recentLinks: [],
  };
  try {
    const raw = safeRead(DEVICE_STATE_KEY, storage);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<DeviceState>;
    if (!parsed || typeof parsed !== 'object') return defaultState;
    const grade =
      typeof parsed.selectedGrade === 'number' &&
      [0, 1, 2, 3, 4].includes(parsed.selectedGrade)
        ? (parsed.selectedGrade as GradeNumber)
        : 1;
    const recentLinks = Array.isArray(parsed.recentLinks) ? parsed.recentLinks : [];
    return {
      version: 1,
      selectedGrade: grade,
      recentLinks,
    };
  } catch {
    return defaultState;
  }
}

export function saveDeviceState(
  state: DeviceState,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  return safeWrite(DEVICE_STATE_KEY, JSON.stringify(state), storage);
}

export function setSelectedGradePreference(
  grade: GradeNumber,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  const current = loadDeviceState(storage);
  return saveDeviceState({ ...current, selectedGrade: grade }, storage);
}

export function upsertRecentLinkOnDevice(
  entry: Omit<RecentLinkEntry, 'lastUsedAt'> & { lastUsedAt?: number },
  storage: StorageLike | null = getDefaultStorage()
): DeviceState {
  const current = loadDeviceState(storage);
  const now = entry.lastUsedAt ?? Date.now();
  const existingIdx = current.recentLinks.findIndex((r) => r.slug === entry.slug);
  const nextLinks = [...current.recentLinks];

  if (existingIdx >= 0) {
    const prev = nextLinks[existingIdx];
    nextLinks[existingIdx] = {
      ...prev,
      ...entry,
      createdHere: prev.createdHere || entry.createdHere,
      shareBannerShown: prev.shareBannerShown || entry.shareBannerShown,
      lastUsedAt: now,
    };
  } else {
    nextLinks.unshift({
      ...entry,
      lastUsedAt: now,
    });
  }

  nextLinks.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  const updated: DeviceState = {
    ...current,
    recentLinks: nextLinks,
  };
  saveDeviceState(updated, storage);
  return updated;
}

export function findExistingLinkForGrade(
  grade: GradeNumber,
  storage: StorageLike | null = getDefaultStorage()
): RecentLinkEntry | null {
  const state = loadDeviceState(storage);
  const matching = state.recentLinks
    .filter((l) => l.grade === grade)
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  return matching[0] ?? null;
}

export function markShareBannerShown(
  slug: string,
  storage: StorageLike | null = getDefaultStorage()
): void {
  const current = loadDeviceState(storage);
  const nextLinks = current.recentLinks.map((l) =>
    l.slug === slug ? { ...l, shareBannerShown: true } : l
  );
  saveDeviceState({ ...current, recentLinks: nextLinks }, storage);
}

export function loadPerLinkState(
  slug: string,
  storage: StorageLike | null = getDefaultStorage()
): PerLinkLocalState | null {
  try {
    const raw = safeRead(`${LINK_STATE_KEY_PREFIX}${slug}`, storage);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PerLinkLocalState;
    if (!parsed || parsed.slug !== slug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePerLinkState(
  state: PerLinkLocalState,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  const ok = safeWrite(
    `${LINK_STATE_KEY_PREFIX}${state.slug}`,
    JSON.stringify(state),
    storage
  );
  // Also keep recentLinks summary in sync
  const device = loadDeviceState(storage);
  const existing = device.recentLinks.find((l) => l.slug === state.slug);
  upsertRecentLinkOnDevice(
    {
      slug: state.slug,
      grade: state.grade,
      label: state.label,
      points: state.points,
      currentLevel: state.currentLevel,
      createdHere: existing?.createdHere ?? false,
      shareBannerShown: existing?.shareBannerShown ?? false,
    },
    storage
  );
  return ok;
}
