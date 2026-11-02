import type { GradeNumber } from '../../data/words/schema';
import {
  generateUniqueSlug,
  isValidSlug,
} from '../../lib/slug';
import { checkCreateLinkRateLimit, checkRateLimit } from '../../lib/rate-limit';
import { TWELVE_MONTHS_MS } from '../../workers/expire-links';
import {
  getAuthoritativeLinkState,
  getParentProgressSummary,
} from '../../lib/sync';

const IDENTICAL_NOT_FOUND_BODY = {
  error: 'This practice link is not available. Create a new practice link to start practising.',
  createUrl: '/',
};

function isValidGrade(grade: unknown): grade is GradeNumber {
  return typeof grade === 'number' && Number.isInteger(grade) && grade >= 0 && grade <= 4;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

/**
 * POST /api/links (PRD 4.1 #4, #8, #9; Tasks 11.4, 11.5, 4.11)
 * - Generates one unique 10-character slug on the server, retries on collision, and persists it with its grade in a single request.
 * - Rejects any request that supplies a `slug` or `candidateSlug` (slugs are server-generated only).
 * - Enforces 10 creations per hour per IP address (HTTP 429).
 */
export async function handlePostLinks(
  request: Request,
  db: D1Database,
  nowMs: number = Date.now()
): Promise<Response> {
  const ip = getClientIp(request);
  const createRate = checkCreateLinkRateLimit(ip, nowMs);
  if (!createRate.allowed) {
    return Response.json(
      { error: 'Too many practice links created recently. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(createRate.retryAfterSeconds) },
      }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Task 4.11 & 11.4: Reject any attempt to supply a slug or candidateSlug in the create request
  if (
    ('slug' in body && body.slug !== undefined) ||
    ('candidateSlug' in body && body.candidateSlug !== undefined)
  ) {
    return Response.json(
      { error: 'Slugs are server-generated only and cannot be supplied by the client.' },
      { status: 400 }
    );
  }

  const grade = body.grade;
  if (!isValidGrade(grade)) {
    return Response.json(
      { error: 'Grade must be an integer between 0 (Pre-K) and 4 (3rd Grade).' },
      { status: 400 }
    );
  }

  let cleanLabel: string | null = null;
  if (typeof body.label === 'string' && body.label.trim().length > 0) {
    cleanLabel = body.label.trim().slice(0, 40);
  }

  const slug = await generateUniqueSlug(db);

  await db
    .prepare(
      `INSERT INTO links (slug, grade, label, points, current_level, created_at, last_active, parent_id)
       VALUES (?, ?, ?, 0, 1, ?, ?, NULL)`
    )
    .bind(slug, grade, cleanLabel, nowMs, nowMs)
    .run();

  return Response.json(
    {
      slug,
      grade,
      label: cleanLabel,
      points: 0,
      currentLevel: 1,
      created_at: nowMs,
      last_active: nowMs,
    },
    { status: 201 }
  );
}

/**
 * PATCH /api/links/:slug (PRD 4.1 #10, Task 11.9)
 * Sets or clears the parent's private label for a link. The label is never included in the URL.
 */
export async function handlePatchLinkLabel(
  request: Request,
  db: D1Database,
  slugParam?: string,
  nowMs: number = Date.now()
): Promise<Response> {
  const url = new URL(request.url);
  const slug =
    slugParam ??
    url.searchParams.get('slug') ??
    url.pathname.replace(/^\/api\/links\/?/, '').split('/')[0];

  if (!isValidSlug(slug)) {
    return Response.json(IDENTICAL_NOT_FOUND_BODY, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const existing = await db
    .prepare('SELECT slug, grade, points, current_level, last_active FROM links WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{
      slug: string;
      grade: GradeNumber;
      points: number;
      current_level: number;
      last_active: number;
    }>();

  if (!existing || nowMs - existing.last_active >= TWELVE_MONTHS_MS) {
    return Response.json(IDENTICAL_NOT_FOUND_BODY, { status: 404 });
  }

  let cleanLabel: string | null = null;
  if (typeof body.label === 'string' && body.label.trim().length > 0) {
    cleanLabel = body.label.trim().slice(0, 40);
  }

  await db
    .prepare('UPDATE links SET label = ?, last_active = ? WHERE slug = ?')
    .bind(cleanLabel, nowMs, slug)
    .run();

  return Response.json(
    {
      slug: existing.slug,
      grade: existing.grade,
      label: cleanLabel,
      points: Number(existing.points ?? 0),
      currentLevel: Number(existing.current_level ?? 1),
      last_active: nowMs,
    },
    { status: 200 }
  );
}

/**
 * GET /api/links/:slug (Tasks 4.6, 4.7, 4.8, 16.4)
 * Resolves a slug to its full state (grade, label, points, currentLevel, progress) or parent summary when `?parent` is present.
 * Enforces 20 lookups/minute/IP rate limit and returns an identical 404 response for never-existed and expired slugs.
 */
export async function handleGetLink(
  request: Request,
  db: D1Database,
  slugParam?: string,
  nowMs: number = Date.now()
): Promise<Response> {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip, nowMs);
  if (!rate.allowed) {
    return Response.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      }
    );
  }

  const url = new URL(request.url);
  const slug =
    slugParam ??
    url.searchParams.get('slug') ??
    url.pathname.replace(/^\/api\/links\/?/, '').split('/')[0];

  if (!isValidSlug(slug)) {
    return Response.json(IDENTICAL_NOT_FOUND_BODY, { status: 404 });
  }

  const state = await getAuthoritativeLinkState(db, slug);

  // Task 4.8: Never-existed and expired links (> 12 months inactive) return the exact same 404 response
  if (!state || nowMs - state.lastActive >= TWELVE_MONTHS_MS) {
    return Response.json(IDENTICAL_NOT_FOUND_BODY, { status: 404 });
  }

  const isParent = url.searchParams.has('parent');
  if (isParent) {
    const parentSummary = await getParentProgressSummary(db, slug);
    return Response.json(parentSummary, { status: 200 });
  }

  return Response.json(
    {
      slug: state.slug,
      grade: state.grade,
      label: state.label,
      points: state.points,
      currentLevel: state.currentLevel,
      last_active: state.lastActive,
      progress: state.progress,
    },
    { status: 200 }
  );
}
