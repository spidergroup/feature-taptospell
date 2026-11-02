export const INIT_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS links (
    slug           TEXT PRIMARY KEY,
    grade          INTEGER NOT NULL,
    label          TEXT,
    points         INTEGER NOT NULL DEFAULT 0,
    current_level  INTEGER NOT NULL DEFAULT 1,
    created_at     INTEGER NOT NULL,
    last_active    INTEGER NOT NULL,
    parent_id      TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    slug         TEXT NOT NULL,
    word         TEXT NOT NULL,
    mode         TEXT NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    hints_used   INTEGER NOT NULL DEFAULT 0,
    mastered_at  INTEGER,
    PRIMARY KEY (slug, word, mode)
  )`,
  `CREATE TABLE IF NOT EXISTS rounds (
    round_id     TEXT PRIMARY KEY,
    slug         TEXT NOT NULL,
    level        INTEGER NOT NULL,
    points       INTEGER NOT NULL,
    received_at  INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_links_last_active ON links(last_active)`,
  `CREATE INDEX IF NOT EXISTS idx_rounds_received_at ON rounds(received_at)`,
];

export async function resetTestDatabase(db: D1Database): Promise<void> {
  for (const stmt of INIT_SCHEMA_STATEMENTS) {
    await db.prepare(stmt).run();
  }
  await db.prepare('DELETE FROM rounds').run();
  await db.prepare('DELETE FROM progress').run();
  await db.prepare('DELETE FROM links').run();
}
