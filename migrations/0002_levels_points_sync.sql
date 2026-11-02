-- Migration 0002: Add points, current_level, hints_used, and idempotent rounds table (PRD Revision 2)
ALTER TABLE links ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE links ADD COLUMN current_level INTEGER NOT NULL DEFAULT 1;

ALTER TABLE progress ADD COLUMN hints_used INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS rounds (
  round_id     TEXT PRIMARY KEY,   -- client-generated UUID
  slug         TEXT NOT NULL,
  level        INTEGER NOT NULL,
  points       INTEGER NOT NULL,
  received_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rounds_received_at ON rounds(received_at);

