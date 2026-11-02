import type { PracticeMode } from './words';
import {
  getProgressForLink,
  getParentProgressSummary,
  type ParentProgressSummary,
} from './sync';

export { getProgressForLink, getParentProgressSummary, type ParentProgressSummary };

export interface SessionItemResult {
  word: string;
  mode: PracticeMode;
  attempts: number;
  hintsUsed?: number;
  mastered: boolean;
}

/**
 * Performs a single batched database round-trip at the end of a session (Tasks 8.6–8.8, superseded by `sync.ts` in 16.0):
 * - Upserts all session word results in one multi-row statement
 * - Updates `links.last_active` in the same D1 batch call
 */
export async function recordSessionProgressBatch(
  db: D1Database,
  slug: string,
  results: SessionItemResult[],
  nowMs: number = Date.now()
): Promise<{ updatedRows: number }> {
  if (results.length === 0) {
    await db
      .prepare('UPDATE links SET last_active = ? WHERE slug = ?')
      .bind(nowMs, slug)
      .run();
    return { updatedRows: 0 };
  }

  const placeholders = results.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
  const bindings: Array<string | number | null> = [];

  for (const item of results) {
    const hintsUsed = Math.max(0, Math.round(item.hintsUsed ?? 0));
    const isMastered = item.mastered && hintsUsed === 0;
    bindings.push(
      slug,
      item.word,
      item.mode,
      Math.max(1, item.attempts),
      hintsUsed,
      isMastered ? nowMs : null
    );
  }

  const upsertSql = `
    INSERT INTO progress (slug, word, mode, attempts, hints_used, mastered_at)
    VALUES ${placeholders}
    ON CONFLICT(slug, word, mode) DO UPDATE SET
      attempts = progress.attempts + excluded.attempts,
      hints_used = progress.hints_used + excluded.hints_used,
      mastered_at = COALESCE(progress.mastered_at, excluded.mastered_at)
  `;

  const statements = [
    db.prepare(upsertSql).bind(...bindings),
    db.prepare('UPDATE links SET last_active = ? WHERE slug = ?').bind(nowMs, slug),
  ];

  await db.batch(statements);
  return { updatedRows: results.length };
}
