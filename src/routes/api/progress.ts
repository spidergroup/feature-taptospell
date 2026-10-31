import { isValidSlug } from '../../lib/slug';
import {
  recordSessionProgressBatch,
  type SessionItemResult,
} from '../../lib/progress';
import { TWELVE_MONTHS_MS } from '../../workers/expire-links';

/**
 * POST /api/progress
 * Accepts the end-of-session batch write (10 items) and updates `links.last_active` (Task 8.7).
 */
export async function handlePostProgress(
  request: Request,
  db: D1Database,
  nowMs: number = Date.now()
): Promise<Response> {
  let body: { slug?: unknown; results?: unknown };
  try {
    body = (await request.json()) as { slug?: unknown; results?: unknown };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = body.slug;
  if (!isValidSlug(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 });
  }

  if (!Array.isArray(body.results)) {
    return Response.json({ error: 'results must be an array' }, { status: 400 });
  }

  const link = await db
    .prepare('SELECT slug, last_active FROM links WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{ slug: string; last_active: number }>();

  if (!link || nowMs - link.last_active >= TWELVE_MONTHS_MS) {
    return Response.json({ error: 'Practice link not found' }, { status: 404 });
  }

  const validResults: SessionItemResult[] = [];
  for (const raw of body.results) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (
      typeof item.word === 'string' &&
      item.word.length > 0 &&
      (item.mode === 'read' || item.mode === 'write') &&
      typeof item.attempts === 'number' &&
      typeof item.mastered === 'boolean'
    ) {
      validResults.push({
        word: item.word,
        mode: item.mode,
        attempts: item.attempts,
        mastered: item.mastered,
      });
    }
  }

  const outcome = await recordSessionProgressBatch(db, slug, validResults, nowMs);
  return Response.json({ ok: true, updatedRows: outcome.updatedRows }, { status: 200 });
}

