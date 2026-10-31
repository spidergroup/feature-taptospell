import { describe, it, expect } from 'vitest';
import {
  selectNextSound,
  discoverSoundSets,
  SoundManager,
} from './audio';

describe('audio.ts — selection, discovery, preloading, and silent failure paths (Task 7.0)', () => {
  it('returns the single file every time for a one-file set rather than failing the no-repeat rule (Task 7.4)', () => {
    const oneFileSet = ['/sounds/success/chime-1.mp3'];
    let last: string | null = null;
    for (let i = 0; i < 10; i++) {
      const next = selectNextSound(oneFileSet, last);
      expect(next).toBe('/sounds/success/chime-1.mp3');
      last = next;
    }
  });

  it('never returns the same file twice consecutively for a five-file set (Task 7.4)', () => {
    const fiveFileSet = [
      '/sounds/retry/1.mp3',
      '/sounds/retry/2.mp3',
      '/sounds/retry/3.mp3',
      '/sounds/retry/4.mp3',
      '/sounds/retry/5.mp3',
    ];
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      const next = selectNextSound(fiveFileSet, last);
      expect(next).not.toBeNull();
      if (last !== null) {
        expect(next).not.toBe(last);
      }
      last = next;
    }
  });

  it('discovers sound sets dynamically without hard-coding filenames (Task 7.5)', () => {
    const discovered = discoverSoundSets({
      '/public/sounds/success/bell.mp3': {},
      '/public/sounds/success/sparkle.ogg': {},
      '/public/sounds/retry/boing.mp3': {},
    });
    expect(discovered.success).toEqual(['/sounds/success/bell.mp3', '/sounds/success/sparkle.ogg']);
    expect(discovered.retry).toEqual(['/sounds/retry/boing.mp3']);
  });

  it('handles empty sets and load/playback failures silently without throwing (Tasks 7.8 & 7.9)', async () => {
    const emptyManager = new SoundManager({
      sets: { success: [], retry: [] },
      isMutedFn: () => false,
    });
    emptyManager.preloadAll();
    await expect(emptyManager.play('success')).resolves.toBeNull();
    await expect(emptyManager.play('retry')).resolves.toBeNull();

    const throwingManager = new SoundManager({
      sets: {
        success: ['/sounds/success/broken.mp3'],
        retry: ['/sounds/retry/broken.mp3'],
      },
      isMutedFn: () => false,
      audioFactory: () => ({
        play: () => Promise.reject(new Error('DecodeError or NotAllowedError')),
      }),
    });

    throwingManager.preloadAll();
    await expect(throwingManager.play('success')).resolves.toBeNull();
    await expect(throwingManager.play('retry')).resolves.toBeNull();
  });

  it('respects the mute state and skips playback when muted', async () => {
    let playCalled = false;
    const mutedManager = new SoundManager({
      sets: {
        success: ['/sounds/success/chime-1.mp3'],
        retry: ['/sounds/retry/boing-1.mp3'],
      },
      isMutedFn: () => true,
      audioFactory: () => ({
        play: () => {
          playCalled = true;
        },
      }),
    });

    const result = await mutedManager.play('success');
    expect(result).toBeNull();
    expect(playCalled).toBe(false);
  });
});

