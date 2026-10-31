import type { PracticeMode } from './words';

export interface MidSessionState {
  slug: string;
  mode: PracticeMode;
  words: string[];
  prefillFlags: boolean[];
  currentIndex: number;
  filledLetters: string[];
  consumedTileIds: string[];
  results: Array<{
    word: string;
    mode: PracticeMode;
    attempts: number;
    mastered: boolean;
  }>;
  startedAt: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SESSION_KEY_PREFIX = 'taptospell:session:';
const MUTE_KEY = 'taptospell:muted';

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Private browsing or locked-down school devices may throw on property access
  }
  return null;
}

export function saveMidSessionState(
  state: MidSessionState,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(`${SESSION_KEY_PREFIX}${state.slug}:${state.mode}`, JSON.stringify(state));
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

export function getMutePreference(storage: StorageLike | null = getDefaultStorage()): boolean {
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

