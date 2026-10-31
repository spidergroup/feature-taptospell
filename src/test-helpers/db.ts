export const INIT_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS links (
    slug         TEXT PRIMARY KEY,
    grade        INTEGER NOT NULL,
    label        TEXT,
    created_at   INTEGER NOT NULL,
    last_active  INTEGER NOT NULL,
    parent_id    TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    slug         TEXT NOT NULL,
    word         TEXT NOT NULL,
    mode         TEXT NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    mastered_at  INTEGER,
    PRIMARY KEY (slug, word, mode)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_links_last_active ON links(last_active)`,
];

export async function resetTestDatabase(db: D1Database): Promise<void> {
  for (const stmt of INIT_SCHEMA_STATEMENTS) {
    await db.prepare(stmt).run();
  }
  await db.prepare('DELETE FROM progress').run();
  await db.prepare('DELETE FROM links').run();
}

