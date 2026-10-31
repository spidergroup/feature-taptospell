import { getMutePreference } from './local-state';

export type SoundSetName = 'success' | 'retry';

export interface AudioItemLike {
  play(): Promise<void> | void;
  preload?: string;
  currentTime?: number;
}

export type AudioFactory = (src: string) => AudioItemLike;

/**
 * Pure selection function (Task 7.3):
 * Given a list of files in a sound set and the last-played file,
 * returns a randomly chosen file that is not the last-played file (when set.length > 1).
 * Returns null if the set is empty.
 */
export function selectNextSound(
  files: readonly string[],
  lastPlayed: string | null,
  randomFn: () => number = Math.random
): string | null {
  if (!files || files.length === 0) {
    return null;
  }
  if (files.length === 1) {
    return files[0];
  }

  const candidates = lastPlayed ? files.filter((f) => f !== lastPlayed) : [...files];
  const pool = candidates.length > 0 ? candidates : [...files];
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(randomFn() * pool.length)));
  return pool[index];
}

/**
 * Discovers sound files present in `public/sounds/{success,retry}` via Vite's `import.meta.glob`
 * or an injected manifest, without hard-coding filenames (Task 7.5).
 */
export function discoverSoundSets(
  globMap?: Record<string, unknown>
): Record<SoundSetName, string[]> {
  let rawPaths: string[] = [];
  if (globMap) {
    rawPaths = Object.keys(globMap);
  } else {
    try {
      const discovered = import.meta.glob('/public/sounds/*/*.{mp3,wav,ogg,webm}', {
        eager: false,
      });
      rawPaths = Object.keys(discovered);
    } catch {
      rawPaths = [];
    }
  }

  const sets: Record<SoundSetName, string[]> = {
    success: [],
    retry: [],
  };

  for (const rawPath of rawPaths) {
    const normalized = rawPath.replace(/^\/public/, '');
    if (normalized.startsWith('/sounds/success/')) {
      sets.success.push(normalized);
    } else if (normalized.startsWith('/sounds/retry/')) {
      sets.retry.push(normalized);
    }
  }

  sets.success.sort();
  sets.retry.sort();

  // Cap at 5 files per set per PRD 4.9 #44-45
  sets.success = sets.success.slice(0, 5);
  sets.retry = sets.retry.slice(0, 5);

  return sets;
}

export interface SoundManagerOptions {
  sets?: Record<SoundSetName, string[]>;
  audioFactory?: AudioFactory;
  isMutedFn?: () => boolean;
  randomFn?: () => number;
}

export class SoundManager {
  private sets: Record<SoundSetName, string[]>;
  private lastPlayed: Record<SoundSetName, string | null> = {
    success: null,
    retry: null,
  };
  private preloaded = new Map<string, AudioItemLike>();
  private unlocked = false;
  private audioFactory: AudioFactory;
  private isMutedFn: () => boolean;
  private randomFn: () => number;

  constructor(options: SoundManagerOptions = {}) {
    this.sets = options.sets ?? discoverSoundSets();
    this.isMutedFn = options.isMutedFn ?? (() => getMutePreference());
    this.randomFn = options.randomFn ?? Math.random;
    this.audioFactory =
      options.audioFactory ??
      ((src: string) => {
        if (typeof globalThis !== 'undefined' && 'Audio' in globalThis) {
          const AudioCtor = (globalThis as unknown as { Audio: new (s: string) => AudioItemLike }).Audio;
          const el = new AudioCtor(src);
          el.preload = 'auto';
          return el;
        }
        return { play: () => Promise.resolve() };
      });
  }

  /**
   * Preloads both sound sets at session start (Task 7.6).
   * Never throws on load failure.
   */
  preloadAll(): void {
    try {
      for (const setName of ['success', 'retry'] as const) {
        for (const file of this.sets[setName] ?? []) {
          if (!this.preloaded.has(file)) {
            try {
              const instance = this.audioFactory(file);
              this.preloaded.set(file, instance);
            } catch {
              // Silent failure per Task 7.8
            }
          }
        }
      }
    } catch {
      // Silent failure per Task 7.8
    }
  }

  /**
   * Initialises / unlocks audio playback on the child's first tap interaction (Task 7.7).
   */
  unlockOnFirstInteraction(): void {
    this.unlocked = true;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Plays a sound from the specified set (Task 7.8: all failure paths silent).
   */
  async play(setName: SoundSetName): Promise<string | null> {
    try {
      if (!this.unlocked) {
        this.unlocked = true;
      }
      if (this.isMutedFn()) {
        return null;
      }

      const files = this.sets[setName] ?? [];
      const chosen = selectNextSound(files, this.lastPlayed[setName], this.randomFn);
      if (!chosen) {
        return null;
      }

      this.lastPlayed[setName] = chosen;

      let audio = this.preloaded.get(chosen);
      if (!audio) {
        audio = this.audioFactory(chosen);
        this.preloaded.set(chosen, audio);
      }

      if (typeof audio.currentTime === 'number') {
        audio.currentTime = 0;
      }

      await audio.play();
      return chosen;
    } catch {
      // Silent failure on decode error, missing file, or blocked context
      return null;
    }
  }
}

let defaultManager: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!defaultManager) {
    defaultManager = new SoundManager();
  }
  return defaultManager;
}

