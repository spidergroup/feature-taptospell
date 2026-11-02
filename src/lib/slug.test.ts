import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  SLUG_ALPHABET,
  SLUG_LENGTH,
  generateRandomSlug,
  generateUniqueSlug,
  generateCandidateSlugs,
  isValidSlug,
} from './slug';
import {
  handlePostLinks,
  handlePatchLinkLabel,
  handleGetLink,
} from '../routes/api/links';
import { resetRateLimits } from './rate-limit';
import {
  expireInactiveLinks,
  THIRTY_DAYS_MS,
  TWELVE_MONTHS_MS,
} from '../workers/expire-links';
import { resetTestDatabase } from '../test-helpers/db';

const db = (env as unknown as { DB: D1Database }).DB;

describe('slug.ts & practice links system (Tasks 4.0 & 11.0)', () => {
  beforeEach(async () => {
    await resetTestDatabase(db);
    resetRateLimits();
  });

  it('generates 10-character slugs strictly from the unambiguous alphabet (Task 4.1 & 4.3)', () => {
    const forbidden = ['i', 'l', 'o', '0', '1'];
    for (const ch of forbidden) {
      expect(SLUG_ALPHABET.includes(ch)).toBe(false);
    }
    expect(SLUG_ALPHABET).toBe('abcdefghjkmnpqrstuvwxyz23456789');

    for (let i = 0; i < 50; i++) {
      const slug = generateRandomSlug();
      expect(slug).toHaveLength(SLUG_LENGTH);
      expect(isValidSlug(slug)).toBe(true);
      for (const ch of slug) {
        expect(SLUG_ALPHABET.includes(ch)).toBe(true);
      }
    }
  });

  it('retries on collision against D1 links table and returns the next unique slug (Task 4.2 & 4.3)', async () => {
    const collidingSlug = 'k7m2xq4rvb';
    const freshSlug = 'p9n3wt5yzc';

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(collidingSlug, 1, 'Jimmy', 1000, 1000)
      .run();

    let callCount = 0;
    const sequence = [collidingSlug, collidingSlug, freshSlug];
    const unique = await generateUniqueSlug(db, () => sequence[callCount++]);

    expect(unique).toBe(freshSlug);
    expect(callCount).toBe(3);
  });

  it('POST /api/links automatically creates and persists one slug in a single call, and PATCH /api/links/:slug updates the private label (Tasks 11.4, 11.9, 11.11)', async () => {
    const createReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 2 }),
    });

    const createRes = await handlePostLinks(createReq, db, 5000);
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      slug: string;
      grade: number;
      label: string | null;
      points: number;
      currentLevel: number;
    };
    expect(isValidSlug(created.slug)).toBe(true);
    expect(created.grade).toBe(2);
    expect(created.label).toBeNull();
    expect(created.points).toBe(0);
    expect(created.currentLevel).toBe(1);

    // Verify it was persisted immediately
    const countAfter = await db
      .prepare('SELECT COUNT(*) AS cnt FROM links WHERE slug = ?')
      .bind(created.slug)
      .first<{ cnt: number }>();
    expect(countAfter?.cnt).toBe(1);

    // PATCH private label from parent view
    const patchReq = new Request(
      `https://taptospell.com/api/links/${created.slug}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Jimmy' }),
      }
    );
    const patchRes = await handlePatchLinkLabel(patchReq, db, created.slug, 6000);
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as {
      slug: string;
      label: string | null;
    };
    expect(patched.slug).toBe(created.slug);
    expect(patched.label).toBe('Jimmy');
    expect(patched.slug.toLowerCase()).not.toContain('jimmy');
  });

  it('rejects any attempt to supply a client-chosen slug or candidateSlug in POST /api/links and rate-limits creation at 10/hour/IP (Tasks 4.11, 11.5, 11.11)', async () => {
    const badReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 1, slug: 'k7m2xq4rvb' }),
    });
    const res = await handlePostLinks(badReq, db);
    expect(res.status).toBe(400);

    const candidateReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 1, candidateSlug: 'z9y8x7w6v5' }),
    });
    const candidateRes = await handlePostLinks(candidateReq, db);
    expect(candidateRes.status).toBe(400);

    // Rate limit at 10 link creations per hour per IP
    const ip = '198.51.100.77';
    const now = 1_700_000_000_000;
    for (let i = 0; i < 10; i++) {
      const r = await handlePostLinks(
        new Request('https://taptospell.com/api/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-connecting-ip': ip,
          },
          body: JSON.stringify({ grade: 1 }),
        }),
        db,
        now
      );
      expect(r.status).toBe(201);
    }

    const eleventh = await handlePostLinks(
      new Request('https://taptospell.com/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': ip,
        },
        body: JSON.stringify({ grade: 1 }),
      }),
      db,
      now
    );
    expect(eleventh.status).toBe(429);
  });

  it('resolves valid slugs with full state (points, currentLevel), returns identical 404 responses for never-existed and expired slugs, and rate-limits at 20/min/IP (Tasks 4.6, 4.7, 4.8, 16.4)', async () => {
    const now = 2_000_000_000_000;
    const activeSlug = 'abcdefghjk';
    const expiredSlug = 'mnpqrstuvw';
    const neverExistedSlug = 'xyz2345678';

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, points, current_level, created_at, last_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(activeSlug, 3, 'Maya', 150, 2, now - 1000, now - 1000)
      .run();

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(expiredSlug, 3, 'Old', now - TWELVE_MONTHS_MS - 5000, now - TWELVE_MONTHS_MS - 5000)
      .run();

    // Valid lookup
    const okRes = await handleGetLink(
      new Request(`https://taptospell.com/api/links/${activeSlug}`, {
        headers: { 'cf-connecting-ip': '10.0.0.1' },
      }),
      db,
      activeSlug,
      now
    );
    expect(okRes.status).toBe(200);
    const okBody = (await okRes.json()) as {
      slug: string;
      grade: number;
      label: string;
      points: number;
      currentLevel: number;
    };
    expect(okBody.grade).toBe(3);
    expect(okBody.label).toBe('Maya');
    expect(okBody.points).toBe(150);
    expect(okBody.currentLevel).toBe(2);

    // Task 4.8: Identical response for never-existed vs expired slugs
    const neverRes = await handleGetLink(
      new Request(`https://taptospell.com/api/links/${neverExistedSlug}`, {
        headers: { 'cf-connecting-ip': '10.0.0.2' },
      }),
      db,
      neverExistedSlug,
      now
    );
    const expiredRes = await handleGetLink(
      new Request(`https://taptospell.com/api/links/${expiredSlug}`, {
        headers: { 'cf-connecting-ip': '10.0.0.2' },
      }),
      db,
      expiredSlug,
      now
    );
    expect(neverRes.status).toBe(404);
    expect(expiredRes.status).toBe(404);
    expect(await neverRes.text()).toBe(await expiredRes.text());

    // Task 4.7: Rate limit at 20 requests per minute per IP
    for (let i = 0; i < 20; i++) {
      const r = await handleGetLink(
        new Request(`https://taptospell.com/api/links/${activeSlug}`, {
          headers: { 'cf-connecting-ip': '192.0.2.55' },
        }),
        db,
        activeSlug,
        now
      );
      expect(r.status).toBe(200);
    }
    const rateLimitedRes = await handleGetLink(
      new Request(`https://taptospell.com/api/links/${activeSlug}`, {
        headers: { 'cf-connecting-ip': '192.0.2.55' },
      }),
      db,
      activeSlug,
      now
    );
    expect(rateLimitedRes.status).toBe(429);
  });

  it('deletes links inactive for 12+ months, their progress & rounds rows, and rounds older than 30 days (Tasks 4.12, 4.13, 16.8)', async () => {
    const now = 2_000_000_000_000;
    const staleSlug = 'stale23456';
    const activeSlug = 'activ23456';

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(staleSlug, 1, 'Stale', now - TWELVE_MONTHS_MS - 10_000, now - TWELVE_MONTHS_MS - 1)
      .run();

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(activeSlug, 1, 'Active', now - 86_400_000, now - 86_400_000)
      .run();

    await db
      .prepare(
        'INSERT INTO progress (slug, word, mode, attempts, mastered_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(staleSlug, 'cat', 'write', 2, now - TWELVE_MONTHS_MS - 1)
      .run();

    await db
      .prepare(
        'INSERT INTO progress (slug, word, mode, attempts, mastered_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(activeSlug, 'dog', 'write', 1, now - 86_400_000)
      .run();

    // Insert 1 round older than 30 days on activeSlug and 1 recent round on activeSlug
    await db
      .prepare(
        'INSERT INTO rounds (round_id, slug, level, points, received_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind('old-round-1', activeSlug, 1, 100, now - THIRTY_DAYS_MS - 1000)
      .run();

    await db
      .prepare(
        'INSERT INTO rounds (round_id, slug, level, points, received_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind('recent-round-2', activeSlug, 1, 100, now - 1000)
      .run();

    const expiryResult = await expireInactiveLinks(db, now);
    expect(expiryResult.deletedLinks).toBe(1);
    expect(expiryResult.deletedProgressRows).toBe(1);
    expect(expiryResult.deletedRoundsRows).toBe(1);

    const remainingLinks = await db.prepare('SELECT slug FROM links').all<{ slug: string }>();
    expect(remainingLinks.results.map((r) => r.slug)).toEqual([activeSlug]);

    const remainingRounds = await db
      .prepare('SELECT round_id FROM rounds')
      .all<{ round_id: string }>();
    expect(remainingRounds.results.map((r) => r.round_id)).toEqual(['recent-round-2']);
  });

  it('generates 3 distinct candidate slugs in a single call', async () => {
    const candidates = await generateCandidateSlugs(db, 3);
    expect(new Set(candidates).size).toBe(3);
  });
});
