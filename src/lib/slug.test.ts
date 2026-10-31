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
import { handlePostLinks, handleGetLink } from '../routes/api/links';
import { resetRateLimits } from './rate-limit';
import { expireInactiveLinks, TWELVE_MONTHS_MS } from '../workers/expire-links';
import { resetTestDatabase } from '../test-helpers/db';

const db = (env as unknown as { DB: D1Database }).DB;

describe('slug.ts & practice links system (Task 4.0)', () => {
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

  it('POST /api/links returns 3 candidate slugs without persisting them, then persists the chosen candidate (Tasks 4.4 & 4.5)', async () => {
    const candidateReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 2 }),
    });

    const candidateRes = await handlePostLinks(candidateReq, db, 5000);
    expect(candidateRes.status).toBe(200);
    const candidateData = (await candidateRes.json()) as {
      grade: number;
      candidates: string[];
    };
    expect(candidateData.candidates).toHaveLength(3);

    // Verify none of the 3 candidates were persisted yet
    const countBefore = await db
      .prepare('SELECT COUNT(*) AS cnt FROM links')
      .first<{ cnt: number }>();
    expect(countBefore?.cnt).toBe(0);

    // Confirm and persist the second candidate with private label "Jimmy"
    const chosen = candidateData.candidates[1];
    const confirmReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade: 2,
        candidateSlug: chosen,
        label: 'Jimmy',
      }),
    });

    const confirmRes = await handlePostLinks(confirmReq, db, 6000);
    expect(confirmRes.status).toBe(201);
    const saved = (await confirmRes.json()) as {
      slug: string;
      grade: number;
      label: string;
    };
    expect(saved.slug).toBe(chosen);
    expect(saved.grade).toBe(2);
    expect(saved.label).toBe('Jimmy');
  });

  it('rejects any attempt to supply a client-chosen slug in POST /api/links (Task 4.11)', async () => {
    const badReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 1, slug: 'k7m2xq4rvb' }),
    });
    const res = await handlePostLinks(badReq, db);
    expect(res.status).toBe(400);

    // Also reject an unissued candidateSlug
    const unissuedReq = new Request('https://taptospell.com/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade: 1, candidateSlug: 'z9y8x7w6v5' }),
    });
    const unissuedRes = await handlePostLinks(unissuedReq, db);
    expect(unissuedRes.status).toBe(400);
  });

  it('resolves valid slugs, returns identical 404 responses for never-existed and expired slugs, and rate-limits at 20/min/IP (Tasks 4.6, 4.7, 4.8)', async () => {
    const now = 2_000_000_000_000;
    const activeSlug = 'abcdefghjk';
    const expiredSlug = 'mnpqrstuvw';
    const neverExistedSlug = 'xyz2345678';

    await db
      .prepare(
        'INSERT INTO links (slug, grade, label, created_at, last_active) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(activeSlug, 3, 'Maya', now - 1000, now - 1000)
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
    const okBody = (await okRes.json()) as { slug: string; grade: number; label: string };
    expect(okBody.grade).toBe(3);
    expect(okBody.label).toBe('Maya');

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

  it('deletes links and progress rows inactive for 12+ months while leaving active links untouched (Tasks 4.12 & 4.13)', async () => {
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

    const expiryResult = await expireInactiveLinks(db, now);
    expect(expiryResult.deletedLinks).toBe(1);
    expect(expiryResult.deletedProgressRows).toBe(1);

    const remainingLinks = await db.prepare('SELECT slug FROM links').all<{ slug: string }>();
    expect(remainingLinks.results.map((r) => r.slug)).toEqual([activeSlug]);

    const remainingProgress = await db
      .prepare('SELECT slug FROM progress')
      .all<{ slug: string }>();
    expect(remainingProgress.results.map((r) => r.slug)).toEqual([activeSlug]);
  });

  it('generates 3 distinct candidate slugs in a single call', async () => {
    const candidates = await generateCandidateSlugs(db, 3);
    expect(new Set(candidates).size).toBe(3);
  });
});

