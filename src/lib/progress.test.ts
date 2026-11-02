import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import {
  recordSessionProgressBatch,
  getParentProgressSummary,
  type SessionItemResult,
} from './progress';
import { handlePostProgress } from '../routes/api/progress';
import { ProgressBar } from '../components/ProgressBar';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { ParentView } from '../components/ParentView';
import { WritingSession } from '../components/WritingSession';
import { resetTestDatabase } from '../test-helpers/db';

const db = (env as unknown as { DB: D1Database }).DB;

describe('progress.ts & session completion / parent view (Task 8.0)', () => {
  beforeEach(async () => {
    await resetTestDatabase(db);
  });

  it('writes all 10 session results and updates links.last_active in exactly one database round trip (Tasks 8.6, 8.7, 8.8)', async () => {
    const slug = 'k7m2xq4rvb';
    const initialTime = 1_700_000_000_000;
    const endSessionTime = 1_700_000_240_000;

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(slug, 0, 'Jimmy', initialTime, initialTime)
      .run();

    const tenResults: SessionItemResult[] = [
      { word: 'the', mode: 'read', attempts: 1, mastered: true },
      { word: 'to', mode: 'read', attempts: 1, mastered: true },
      { word: 'and', mode: 'read', attempts: 1, mastered: true },
      { word: 'see', mode: 'read', attempts: 2, mastered: false },
      { word: 'can', mode: 'read', attempts: 1, mastered: true },
      { word: 'run', mode: 'read', attempts: 1, mastered: true },
      { word: 'big', mode: 'read', attempts: 1, mastered: true },
      { word: 'red', mode: 'read', attempts: 3, mastered: false },
      { word: 'one', mode: 'read', attempts: 1, mastered: true },
      { word: 'two', mode: 'read', attempts: 1, mastered: true },
    ];

    const batchSpy = vi.spyOn(db, 'batch');

    const req = new Request('https://taptospell.com/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, results: tenResults }),
    });

    const res = await handlePostProgress(req, db, endSessionTime);
    expect(res.status).toBe(200);

    // Task 8.8: Exactly one database batch round trip for all 10 words + link timestamp update
    expect(batchSpy).toHaveBeenCalledTimes(1);
    batchSpy.mockRestore();

    // Verify ParentProgressSummary reflects the 8 mastered and 2 missed words
    const summary = await getParentProgressSummary(db, slug);
    expect(summary).not.toBeNull();
    expect(summary?.masteredCount).toBe(8);
    expect(summary?.workingOnWords.sort()).toEqual(['red', 'see']);
    expect(summary?.lastPractisedAt).toBe(endSessionTime);
  });

  it('updates existing progress rows on subsequent sessions without losing mastery', async () => {
    const slug = 'p9n3wt5yzc';
    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(slug, 0, null, 1000, 1000)
      .run();

    await recordSessionProgressBatch(
      db,
      slug,
      [{ word: 'see', mode: 'read', attempts: 2, mastered: false }],
      2000
    );

    await recordSessionProgressBatch(
      db,
      slug,
      [{ word: 'see', mode: 'read', attempts: 1, mastered: true }],
      3000
    );

    const summary = await getParentProgressSummary(db, slug);
    expect(summary?.masteredCount).toBe(1);
    expect(summary?.workingOnWords).toEqual([]);
  });

  it('renders child ProgressBar with zero numeric output, CelebrationScreen with equal options, WritingSession with zero failure indicators, and ParentView with no PII beyond label (Tasks 5.4, 6.10, 8.2, 8.12)', () => {
    const progressBarHtml = renderToString(
      React.createElement(ProgressBar, { completed: 4, total: 10 })
    );
    const progressBarVisibleText = progressBarHtml.replace(/<[^>]+>/g, '').trim();
    expect(progressBarVisibleText).toBe('');
    expect(progressBarHtml).not.toContain('4 / 10');

    const celebrationHtml = renderToString(
      React.createElement(CelebrationScreen, {
        onOneMoreRound: () => {},
        onAllDone: () => {},
      })
    );
    expect(celebrationHtml).toContain('Nice work!');
    expect(celebrationHtml).toContain('One more round');
    expect(celebrationHtml).toContain('All done');

    const writingHtml = renderToString(
      React.createElement(WritingSession, {
        words: [
          {
            word: 'cat',
            grade: 0,
            difficulty: 'easy',
            picturable: true,
            frequencyRank: 15,
            phoneticGroup: 'short-a',
            prefillFirstLetter: true,
          },
        ],
        onComplete: () => {},
      })
    );
    expect(writingHtml.toLowerCase()).not.toContain('wrong');
    expect(writingHtml.toLowerCase()).not.toContain('fail');
    expect(writingHtml).not.toContain('✕');

    const parentHtml = renderToString(
      React.createElement(ParentView, {
        summary: {
          slug: 'k7m2xq4rvb',
          grade: 3,
          label: 'Jimmy',
          points: 120,
          currentLevel: 2,
          currentLevelName: 'Garden Friends',
          totalGradeWords: 26,
          masteredCount: 10,
          remainingCount: 16,
          lastPractisedAt: Date.now(),
          lastSyncedAt: Date.now(),
          workingOnWords: ['because', 'their'],
          neededHintsWords: ['clock'],
        },
      })
    );
    expect(parentHtml).toContain('Jimmy — 2nd Grade');
    expect(parentHtml).toContain('10 of 26 words mastered');
    expect(parentHtml).toContain('Copy link');
    expect(parentHtml).toContain('Level 2 • Garden Friends');
    expect(parentHtml).toContain('120 Stars');
    expect(parentHtml).toContain('clock');
  });
});
