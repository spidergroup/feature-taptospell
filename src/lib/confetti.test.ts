import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HomePage } from '../routes/index';
import { PracticeRoute } from '../routes/$slug';
import { SpellingSession } from '../components/SpellingSession';
import { ShareBanner } from '../components/ShareBanner';
import { runThreeSecondConfetti } from './confetti';
import { READING_MODE_ENABLED } from './feature-flags';
import {
  clearMemoryFallback,
  upsertRecentLinkOnDevice,
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

describe('Revision 2 UI & Gameplay features (Tasks 10.0, 11.0, 13.0, 14.0, 15.0, 17.0)', () => {
  beforeEach(() => {
    clearMemoryFallback();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders HomePage from UI_TEMPLATES/home_page with 5 grade pills, active Spelling card, disabled Reading v2.0 card, and zero out-of-scope elements (Tasks 10.4, 11.1, 11.3, 17.1)', () => {
    expect(READING_MODE_ENABLED).toBe(false);

    const store = createMemoryStorage();
    upsertRecentLinkOnDevice(
      {
        slug: 'k7m2xq4rvb',
        grade: 1,
        label: 'Jimmy',
        points: 240,
        currentLevel: 2,
        createdHere: true,
        shareBannerShown: false,
      },
      store
    );

    const html = renderToString(React.createElement(HomePage, { storage: store }));

    // Template elements present
    expect(html).toContain('Tap To Spell');
    expect(html).toContain('Free reading and spelling practice for ages 5–8.');
    expect(html).toContain('Barnaby Beaver');
    expect(html).toContain('Pick your grade to jump in!');
    expect(html).toContain('Pre-K');
    expect(html).toContain('Kindergarten');
    expect(html).toContain('1st Grade');
    expect(html).toContain('2nd Grade');
    expect(html).toContain('3rd Grade');

    // Header stars show most recent link's points (240)
    expect(html).toContain('240');

    // Spelling card active ("Play Now") & Reading card disabled ("Coming in v2.0")
    expect(html).toContain('Spelling Safari');
    expect(html).toContain('Play Now');
    expect(html).toContain('Sight Word Reader');
    expect(html).toContain('Coming in v2.0');

    // Bottom nav has Home, Games, Parents — "Grades" tab and "Letter of the Day" are removed
    expect(html).toContain('nav-tab-home');
    expect(html).toContain('nav-tab-games');
    expect(html).toContain('nav-tab-parents');
    expect(html).not.toContain('nav-tab-grades');
    expect(html).not.toContain('Letter of the Day');
    expect(html).not.toContain('mascotAudioBtn');
    expect(html).not.toContain('lh3.googleusercontent.com');
  });

  it('renders SpellingSession from UI_TEMPLATES/kids_spelling_word_game with level badge, hint bulbs (word.length - 1), letter boxes, and zero Check Answer or red error UI (Tasks 13.1, 13.3, 13.10, 14.4)', () => {
    const html = renderToString(
      React.createElement(SpellingSession, {
        words: [
          {
            word: 'fish',
            grade: 0,
            difficulty: 'medium',
            picturable: true,
            frequencyRank: 26,
            phoneticGroup: 'short-i',
            prefillFirstLetter: false,
          },
        ],
        level: 2,
        initialPoints: 120,
        shareBanner: React.createElement(ShareBanner, {
          slug: 'k7m2xq4rvb',
          onDismiss: () => {},
        }),
        onComplete: () => {},
      })
    );

    // Level 2 badge ("Level 2 • Garden Friends") and "+15 pts" badge
    expect(html).toContain('Level 2 • Garden Friends');
    expect(html).toContain('+15 pts');
    expect(html).toContain('Spell the 4-letter word!');

    // 4-letter word 'fish' -> 3 light-bulb hint buttons (hint-bulb-0, hint-bulb-1, hint-bulb-2, no hint-bulb-3) with tooltips
    expect(html).toContain('hint-bulb-0');
    expect(html).toContain('hint-bulb-1');
    expect(html).toContain('hint-bulb-2');
    expect(html).not.toContain('hint-bulb-3');
    expect(html).toContain('title="Tap for a hint (reveals a letter)"');

    // Shows sound icon for words without a picture
    expect(html).toContain('/images/ui/sound-icon.png');
    expect(html).toContain('data-testid="word-sound-frame"');

    // One-time share banner shown over the loaded game
    expect(html).toContain('share-banner');
    expect(html).toContain('k7m2xq4rvb');

    // No "CHECK ANSWER!" button, no TTS button, no failure text
    expect(html).not.toContain('CHECK ANSWER');
    expect(html).not.toContain('ttsButton');
    expect(html.toLowerCase()).not.toContain('oops');
    expect(html.toLowerCase()).not.toContain('wrong');
  });

  it('always starts Spelling mode on /{slug} in version 1.0 even if initialMode="read" is passed (Task 17.2)', () => {
    const store = createMemoryStorage();
    const html = renderToString(
      React.createElement(PracticeRoute, {
        slug: 'k7m2xq4rvb',
        initialMode: 'read',
        storage: store,
        linkData: {
          slug: 'k7m2xq4rvb',
          grade: 0,
          label: 'Jimmy',
          points: 50,
          currentLevel: 1,
          progress: [],
        },
      })
    );

    expect(html).toContain('data-spelling-session="true"');
    expect(html).not.toContain('data-testid="reading-session"');
  });

  it('fires canvas-confetti for 3 seconds and invokes the completion callback after exactly 3000ms (Tasks 15.2, 15.6)', () => {
    const fireSpy = vi.fn(() => null);
    const doneSpy = vi.fn();

    runThreeSecondConfetti(doneSpy, {
      durationMs: 3000,
      fireFn: fireSpy,
    });

    // Initial burst fires immediately
    expect(fireSpy).toHaveBeenCalledTimes(1);
    expect(doneSpy).not.toHaveBeenCalled();

    // At 2999ms: still celebrating, not advanced yet
    vi.advanceTimersByTime(2999);
    expect(doneSpy).not.toHaveBeenCalled();

    // At 3000ms: advances once
    vi.advanceTimersByTime(1);
    expect(doneSpy).toHaveBeenCalledTimes(1);
  });
});

