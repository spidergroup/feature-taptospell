-- Migration 0001: Initialise links and progress tables
CREATE TABLE IF NOT EXISTS links (
  slug         TEXT PRIMARY KEY,   -- 10 chars, system-generated
  grade        INTEGER NOT NULL,   -- 0=pre-primer, 1=primer, 2=1st, 3=2nd, 4=3rd
  label        TEXT,               -- parent's private label; never in the URL
  created_at   INTEGER NOT NULL,
  last_active  INTEGER NOT NULL,   -- drives 12-month expiry
  parent_id    TEXT                -- NULL until accounts exist in week 12
);

CREATE TABLE IF NOT EXISTS progress (
  slug         TEXT NOT NULL,
  word         TEXT NOT NULL,
  mode         TEXT NOT NULL,      -- 'read' | 'write'
  attempts     INTEGER NOT NULL DEFAULT 0,
  mastered_at  INTEGER,
  PRIMARY KEY (slug, word, mode)
);

CREATE INDEX IF NOT EXISTS idx_links_last_active ON links(last_active);

