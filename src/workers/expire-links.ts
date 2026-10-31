/**
 * Twelve months in milliseconds (365 days).
 */
export const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export interface ExpireLinksResult {
  deletedLinks: number;
  deletedProgressRows: number;
  cutoffTimestamp: number;
}

/**
 * Deletes links inactive for at least 12 months and their associated progress rows.
 */
export async function expireInactiveLinks(
  db: D1Database,
  nowMs: number = Date.now()
): Promise<ExpireLinksResult> {
  const cutoffTimestamp = nowMs - TWELVE_MONTHS_MS;

  const progressResult = await db
    .prepare(
      `DELETE FROM progress
       WHERE slug IN (SELECT slug FROM links WHERE last_active < ?)`
    )
    .bind(cutoffTimestamp)
    .run();

  const linksResult = await db
    .prepare(`DELETE FROM links WHERE last_active < ?`)
    .bind(cutoffTimestamp)
    .run();

  return {
    deletedLinks: Number(linksResult.meta?.changes ?? 0),
    deletedProgressRows: Number(progressResult.meta?.changes ?? 0),
    cutoffTimestamp,
  };
}

