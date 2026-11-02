import confetti from 'canvas-confetti';

export const CONFETTI_DURATION_MS = 3000;

export interface ConfettiController {
  cancel: () => void;
}

export type ConfettiFireFn = (options?: confetti.Options) => Promise<null> | null;

/**
 * Fires canvas-confetti for 3 seconds on a correct answer (PRD 4.5 #39-42, Task 15.2):
 * - Uses `disableForReducedMotion: true` to respect `prefers-reduced-motion`.
 * - Canvas does not intercept pointer events (`zIndex: 9999`, `canvas-confetti` sets `pointer-events: none` by default).
 * - Cleans up timers and resets the canvas on unmount or cancellation.
 */
export function runThreeSecondConfetti(
  onFinished?: () => void,
  options?: {
    durationMs?: number;
    fireFn?: ConfettiFireFn;
  }
): ConfettiController {
  const durationMs = options?.durationMs ?? CONFETTI_DURATION_MS;
  const fire: ConfettiFireFn =
    options?.fireFn ??
    ((opts) => {
      if (typeof document === 'undefined') {
        return null;
      }
      try {
        return confetti(opts);
      } catch {
        return null;
      }
    });

  let cancelled = false;

  const fireBurst = () => {
    if (cancelled) return;
    try {
      fire({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    } catch {
      // Ignore canvas unavailability in headless test environments
    }
  };

  // Initial celebratory burst + periodic bursts across the 3-second window
  fireBurst();
  const burstTimer1 = setTimeout(fireBurst, Math.min(900, Math.floor(durationMs * 0.3)));
  const burstTimer2 = setTimeout(fireBurst, Math.min(1800, Math.floor(durationMs * 0.6)));

  const doneTimer = setTimeout(() => {
    if (cancelled) return;
    cancelled = true;
    try {
      if (!options?.fireFn && typeof document !== 'undefined' && typeof confetti.reset === 'function') {
        confetti.reset();
      }
    } catch {
      // Ignore reset errors
    }
    onFinished?.();
  }, durationMs);

  return {
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(burstTimer1);
      clearTimeout(burstTimer2);
      clearTimeout(doneTimer);
      try {
        if (!options?.fireFn && typeof document !== 'undefined' && typeof confetti.reset === 'function') {
          confetti.reset();
        }
      } catch {
        // Ignore reset errors
      }
    },
  };
}

