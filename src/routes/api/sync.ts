import { isValidSlug } from '../../lib/slug';
import {
  recordRoundSyncOnServer,
  type SyncRoundRequestPayload,
} from '../../lib/sync';
import type { SessionWordResult } from '../../lib/local-state';
import { TWELVE_MONTHS_MS } from '../../workers/expire-links';

/**
 * POST /api/sync
 * Accepts a round batch idempotently (by `roundId`) in a single D1 batch and returns the authoritative link state (PRD 4.7 #50-52, Task 16.3).
 */
export async function handlePostSync(
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

  const slug = body.slug;
  if (!isValidSlug(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const roundId =
    typeof body.roundId === 'string' && body.roundId.trim().length > 0
      ? body.roundId.trim()
      : typeof body.round_id === 'string' && body.round_id.trim().length > 0
        ? body.round_id.trim()
        : null;

  if (!roundId) {
    return Response.json({ error: 'roundId is required' }, { status: 400 });
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

  const validResults: SessionWordResult[] = [];
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
        hintsUsed: typeof item.hintsUsed === 'number' ? item.hintsUsed : 0,
        mastered: item.mastered,
      });
    }
  }

  const level = typeof body.level === 'number' ? body.level : 1;
  const pointsEarned = typeof body.pointsEarned === 'number' ? body.pointsEarned : 0;
  const nextLevel = typeof body.nextLevel === 'number' ? body.nextLevel : level;

  const payload: SyncRoundRequestPayload = {
    roundId,
    slug,
    level,
    pointsEarned,
    nextLevel,
    results: validResults,
  };

  const authoritativeState = await recordRoundSyncOnServer(db, payload, nowMs);
  if (!authoritativeState) {
    return Response.json({ error: 'Practice link not found' }, { status: 404 });
  }

  return Response.json(authoritativeState, { status: 200 });
}

