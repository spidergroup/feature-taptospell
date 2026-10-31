import type { PracticeMode, WordProgressStatus } from './words';
import { getWordsForGrade } from './words';
import type { GradeNumber } from '../data/words/schema';

export interface SessionItemResult {
  word: string;
  mode: PracticeMode;
  attempts: number;
  mastered: boolean;
}

export interface ParentProgressSummary {
  slug: string;
  grade: GradeNumber;
  label: string | null;
  totalGradeWords: number;
  masteredCount: number;
  remainingCount: number;
  lastPractisedAt: number;
  workingOnWords: string[];
}

/**
 * Performs a single batched database round-trip at the end of a session (Tasks 8.6–8.8):
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

  const placeholders = results.map(() => '(?, ?, ?, ?, ?)').join(', ');
  const bindings: Array<string | number | null> = [];

  for (const item of results) {
    bindings.push(
      slug,
      item.word,
      item.mode,
      Math.max(1, item.attempts),
      item.mastered ? nowMs : null
    );
  }

  const upsertSql = `
    INSERT INTO progress (slug, word, mode, attempts, mastered_at)
    VALUES ${placeholders}
    ON CONFLICT(slug, word, mode) DO UPDATE SET
      attempts = progress.attempts + excluded.attempts,
      mastered_at = COALESCE(excluded.mastered_at, progress.mastered_at)
  `;

  const statements = [
    db.prepare(upsertSql).bind(...bindings),
    db.prepare('UPDATE links SET last_active = ? WHERE slug = ?').bind(nowMs, slug),
  ];

  await db.batch(statements);
  return { updatedRows: results.length };
}

/**
 * Reads all progress rows for a link slug.
 */
export async function getProgressForLink(
  db: D1Database,
  slug: string
): Promise<WordProgressStatus[]> {
  const { results } = await db
    .prepare(
      'SELECT word, mode, attempts, mastered_at FROM progress WHERE slug = ?'
    )
    .bind(slug)
    .all<WordProgressStatus>();

  return results ?? [];
}

/**
 * Computes the Parent Progress View summary for `?parent` (PRD Section 4.6).
 */
export async function getParentProgressSummary(
  db: D1Database,
  slug: string
): Promise<ParentProgressSummary | null> {
  const link = await db
    .prepare('SELECT slug, grade, label, last_active FROM links WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{ slug: string; grade: GradeNumber; label: string | null; last_active: number }>();

  if (!link) {
    return null;
  }

  const progressRows = await getProgressForLink(db, slug);
  const gradeWords = getWordsForGrade(link.grade);
  const totalGradeWords = gradeWords.length;

  const masteredWordsSet = new Set<string>();
  const missedWordsSet = new Set<string>();

  for (const row of progressRows) {
    if (row.mastered_at !== null) {
      masteredWordsSet.add(row.word);
    }
  }

  for (const row of progressRows) {
    if (row.mastered_at === null && row.attempts > 0 && !masteredWordsSet.has(row.word)) {
      missedWordsSet.add(row.word);
    }
  }

  const masteredCount = masteredWordsSet.size;
  const remainingCount = Math.max(0, totalGradeWords - masteredCount);

  return {
    slug: link.slug,
    grade: link.grade,
    label: link.label ?? null,
    totalGradeWords,
    masteredCount,
    remainingCount,
    lastPractisedAt: link.last_active,
    workingOnWords: Array.from(missedWordsSet),
  };
}

