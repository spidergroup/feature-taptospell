import confetti from 'canvas-confetti';

export const CONFETTI_DURATION_MS = 3000;

export interface ConfettiController {
  cancel: () => void;
}

export type ConfettiFireFn = (options?: confetti.Options) => Promise<null> | null;

let activeCannon: ConfettiFireFn | null = null;
let activeCanvas: HTMLCanvasElement | null = null;

/**
 * Creates or retrieves a dedicated full-screen canvas element for confetti,
 * using `useWorker: false` to guarantee direct 2D canvas rendering on the main thread
 * across all browsers, sandboxes, and OS environments (PRD 4.5 #39-42, Task 15.2).
 */
export function getActiveConfettiCannon(): ConfettiFireFn {
  if (typeof document === 'undefined') {
    return () => null;
  }
  if (activeCannon) {
    return activeCannon;
  }
  try {
    let canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);
    }
    activeCanvas = canvas;
    if (typeof confetti.create === 'function') {
      activeCannon = confetti.create(canvas, {
        resize: true,
        useWorker: false,
      });
      return activeCannon;
    }
    return (opts) => confetti(opts);
  } catch {
    return (opts) => confetti(opts);
  }
}

/**
 * Fires canvas-confetti for 3 seconds on a correct answer (PRD 4.5 #39-42, Task 15.2):
 * - Canvas does not intercept pointer events (`zIndex: 99999`, `pointer-events: none`).
 * - Respects motion preferences by using a gentler particle burst without shutting down celebration.
 * - Sustained celebration for 3 seconds before auto-advancing to the next question.
 * - Cleans up timers and resets canvas on unmount or cancellation.
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
    options?.fireFn ?? getActiveConfettiCannon();

  let cancelled = false;

  const preferReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const baseCount = preferReduced ? 22 : 65;

  const fireCenter = () => {
    if (cancelled) return;
    try {
      fire({
        particleCount: baseCount,
        spread: 80,
        origin: { y: 0.6 },
        disableForReducedMotion: false,
        zIndex: 99999,
        colors: ['#04a8ff', '#ffb800', '#25d366', '#a25afd', '#ff5e7e', '#ffa62d'],
      });
    } catch {
      // Ignore canvas unavailability in headless test environments
    }
  };

  const fireSide = (x: number, angle: number) => {
    if (cancelled) return;
    try {
      fire({
        particleCount: Math.max(12, Math.floor(baseCount * 0.45)),
        angle,
        spread: 60,
        origin: { x, y: 0.75 },
        disableForReducedMotion: false,
        zIndex: 99999,
        colors: ['#04a8ff', '#ffb800', '#25d366', '#a25afd', '#ff5e7e', '#ffa62d'],
      });
    } catch {
      // Ignore in headless test environments
    }
  };

  // Initial celebratory burst
  fireCenter();

  // Sustained bursts across the 3-second celebratory window
  const timers: ReturnType<typeof setTimeout>[] = [];
  if (!preferReduced) {
    timers.push(setTimeout(() => fireSide(0.1, 60), 400));
    timers.push(setTimeout(() => fireSide(0.9, 120), 800));
    timers.push(setTimeout(() => fireCenter(), 1400));
    timers.push(setTimeout(() => fireSide(0.15, 60), 2000));
    timers.push(setTimeout(() => fireSide(0.85, 120), 2400));
  } else {
    timers.push(setTimeout(fireCenter, 1500));
  }

  const doneTimer = setTimeout(() => {
    if (cancelled) return;
    cancelled = true;
    for (const t of timers) clearTimeout(t);
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
      for (const t of timers) clearTimeout(t);
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

