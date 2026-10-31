import type { GradeNumber } from '../../data/words/schema';
import {
  generateCandidateSlugs,
  isValidSlug,
  slugExists,
} from '../../lib/slug';
import { checkRateLimit } from '../../lib/rate-limit';
import { TWELVE_MONTHS_MS } from '../../workers/expire-links';
import { getParentProgressSummary, getProgressForLink } from '../../lib/progress';

const issuedCandidates = new Map<string, { grade: GradeNumber; issuedAt: number }>();
const CANDIDATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
 * Helper for tests or internal callers to register server-issued candidate slugs.
 */
export function registerIssuedCandidate(slug: string, grade: GradeNumber, nowMs = Date.now()): void {
  issuedCandidates.set(slug, { grade, issuedAt: nowMs });
}

/**
 * POST /api/links
 * - Mode 1 (Candidate generation): `{ grade }` -> returns `{ candidates: [s1, s2, s3] }` without persisting.
 *   Rejects any request that includes a `slug` property (Task 4.11: slugs are server-generated only).
 * - Mode 2 (Persist chosen candidate): `{ grade, candidateSlug, label? }` -> persists the server-issued
 *   candidate slug with its grade, optional private label, and timestamps (Task 4.5).
 */
export async function handlePostLinks(
  request: Request,
  db: D1Database,
  nowMs: number = Date.now()
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Task 4.11: Reject any attempt to supply a `slug` in the create request
  if ('slug' in body && body.slug !== undefined) {
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

  // Mode 2: Confirm and persist a server-generated candidate slug
  if ('candidateSlug' in body && body.candidateSlug !== undefined) {
    const candidateSlug = body.candidateSlug;
    if (!isValidSlug(candidateSlug)) {
      return Response.json(
        { error: 'Invalid candidate slug format.' },
        { status: 400 }
      );
    }

    const issued = issuedCandidates.get(candidateSlug);
    if (!issued || nowMs - issued.issuedAt > CANDIDATE_TTL_MS) {
      return Response.json(
        { error: 'Slugs are server-generated only; candidate slug was not issued by the server.' },
        { status: 400 }
      );
    }

    if (await slugExists(db, candidateSlug)) {
      return Response.json(
        { error: 'Candidate slug is already in use. Please pick another candidate.' },
        { status: 409 }
      );
    }

    let cleanLabel: string | null = null;
    if (typeof body.label === 'string' && body.label.trim().length > 0) {
      cleanLabel = body.label.trim().slice(0, 40);
    }

    await db
      .prepare(
        `INSERT INTO links (slug, grade, label, created_at, last_active, parent_id)
         VALUES (?, ?, ?, ?, ?, NULL)`
      )
      .bind(candidateSlug, grade, cleanLabel, nowMs, nowMs)
      .run();

    issuedCandidates.delete(candidateSlug);

    return Response.json(
      {
        slug: candidateSlug,
        grade,
        label: cleanLabel,
        created_at: nowMs,
        last_active: nowMs,
      },
      { status: 201 }
    );
  }

  // Mode 1: Generate 3 unique candidate slugs without persisting them (Task 4.4)
  const candidates = await generateCandidateSlugs(db, 3);
  for (const slug of candidates) {
    issuedCandidates.set(slug, { grade, issuedAt: nowMs });
  }

  return Response.json({ grade, candidates }, { status: 200 });
}

/**
 * GET /api/links/:slug
 * Resolves a slug to its grade, label, and progress (or parent summary when `?parent` is present).
 * Enforces 20 lookups/minute/IP rate limit (Task 4.7) and returns an identical 404 response
 * for never-existed and expired slugs (Task 4.8).
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

  const row = await db
    .prepare(
      'SELECT slug, grade, label, created_at, last_active FROM links WHERE slug = ? LIMIT 1'
    )
    .bind(slug)
    .first<{
      slug: string;
      grade: GradeNumber;
      label: string | null;
      created_at: number;
      last_active: number;
    }>();

  // Task 4.8: Never-existed and expired links (> 12 months inactive) return the exact same 404 response
  if (!row || nowMs - row.last_active >= TWELVE_MONTHS_MS) {
    return Response.json(IDENTICAL_NOT_FOUND_BODY, { status: 404 });
  }

  const isParent = url.searchParams.has('parent');
  if (isParent) {
    const parentSummary = await getParentProgressSummary(db, slug);
    return Response.json(parentSummary, { status: 200 });
  }

  const progress = await getProgressForLink(db, slug);
  return Response.json(
    {
      slug: row.slug,
      grade: row.grade,
      label: row.label,
      last_active: row.last_active,
      progress,
    },
    { status: 200 }
  );
}

