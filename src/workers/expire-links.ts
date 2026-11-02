/**
 * Twelve months in milliseconds (365 days).
 */
export const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Thirty days in milliseconds for idempotency rounds retention (PRD Section 7).
 */
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface ExpireLinksResult {
  deletedLinks: number;
  deletedProgressRows: number;
  deletedRoundsRows: number;
  cutoffTimestamp: number;
  roundsCutoffTimestamp: number;
}

/**
 * Deletes links inactive for at least 12 months, their associated progress and rounds rows,
 * plus any `rounds` rows older than 30 days (Tasks 4.12, 16.8).
 */
export async function expireInactiveLinks(
  db: D1Database,
  nowMs: number = Date.now()
): Promise<ExpireLinksResult> {
  const cutoffTimestamp = nowMs - TWELVE_MONTHS_MS;
  const roundsCutoffTimestamp = nowMs - THIRTY_DAYS_MS;

  const progressResult = await db
    .prepare(
      `DELETE FROM progress
       WHERE slug IN (SELECT slug FROM links WHERE last_active < ?)`
    )
    .bind(cutoffTimestamp)
    .run();

  const roundsResult = await db
    .prepare(
      `DELETE FROM rounds
       WHERE received_at < ?
          OR slug IN (SELECT slug FROM links WHERE last_active < ?)`
    )
    .bind(roundsCutoffTimestamp, cutoffTimestamp)
    .run();

  const linksResult = await db
    .prepare(`DELETE FROM links WHERE last_active < ?`)
    .bind(cutoffTimestamp)
    .run();

  return {
    deletedLinks: Number(linksResult.meta?.changes ?? 0),
    deletedProgressRows: Number(progressResult.meta?.changes ?? 0),
    deletedRoundsRows: Number(roundsResult.meta?.changes ?? 0),
    cutoffTimestamp,
    roundsCutoffTimestamp,
  };
}
