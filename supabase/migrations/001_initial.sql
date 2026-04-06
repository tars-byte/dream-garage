-- ============================================================
-- Dream Garage — Initial Schema
-- Run via: supabase db push  or  psql -f this file
-- ============================================================

-- ─── Garages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS garages (
  id                   TEXT PRIMARY KEY,
  label                TEXT NOT NULL DEFAULT 'Mi Dream Garage',
  tagline              TEXT,
  car_ids              TEXT[] NOT NULL CHECK (CARDINALITY(car_ids) BETWEEN 1 AND 3),
  -- Minimal car data snapshot for OG image rendering (no join needed)
  cars_json            JSONB NOT NULL DEFAULT '[]',
  total_price_usd      NUMERIC(10,2) NOT NULL,
  budget_used_pct      NUMERIC(5,2),
  budget_remaining_usd NUMERIC(10,2),
  share_card_url       TEXT,
  vote_count           INT NOT NULL DEFAULT 0,
  view_count           INT NOT NULL DEFAULT 0,
  share_count          INT NOT NULL DEFAULT 0,
  challenge_count      INT NOT NULL DEFAULT 0,
  source_garage_id     TEXT REFERENCES garages(id) ON DELETE SET NULL,
  session_id           TEXT NOT NULL,
  expo_year            SMALLINT NOT NULL DEFAULT 2025,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  is_visible           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS garages_vote_count_idx   ON garages(vote_count DESC) WHERE is_visible = TRUE;
CREATE INDEX IF NOT EXISTS garages_created_at_idx   ON garages(created_at DESC);
CREATE INDEX IF NOT EXISTS garages_expo_year_idx    ON garages(expo_year);
CREATE INDEX IF NOT EXISTS garages_session_id_idx   ON garages(session_id);

-- ─── Votes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id   TEXT NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (garage_id, session_id)   -- one vote per session per garage
);

CREATE INDEX IF NOT EXISTS votes_garage_id_idx ON votes(garage_id);

-- ─── Events (analytics, event-sourcing pattern) ──────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  garage_id   TEXT,
  car_id      TEXT,
  dealer_id   TEXT,
  payload     JSONB,
  source      TEXT,    -- 'qr', 'challenge_link', 'organic', 'social'
  user_agent  TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_event_type_idx  ON events(event_type);
CREATE INDEX IF NOT EXISTS events_session_id_idx  ON events(session_id);
CREATE INDEX IF NOT EXISTS events_car_id_idx      ON events(car_id);
CREATE INDEX IF NOT EXISTS events_created_at_idx  ON events(created_at DESC);

-- ─── Helper: increment vote count atomically ─────────────────────────────────

CREATE OR REPLACE FUNCTION increment_vote(garage_id TEXT)
RETURNS VOID AS $$
  UPDATE garages SET vote_count = vote_count + 1 WHERE id = garage_id;
$$ LANGUAGE SQL;

-- ─── Helper: increment view count ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_view(garage_id TEXT)
RETURNS VOID AS $$
  UPDATE garages SET view_count = view_count + 1 WHERE id = garage_id;
$$ LANGUAGE SQL;

-- ─── Helper: increment share count ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_share(garage_id TEXT)
RETURNS VOID AS $$
  UPDATE garages SET share_count = share_count + 1 WHERE id = garage_id;
$$ LANGUAGE SQL;

-- ─── Materialized view: per-car stats ────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS car_stats AS
SELECT
  car_id,
  COUNT(*) FILTER (WHERE event_type = 'car_added')   AS add_count,
  COUNT(*) FILTER (WHERE event_type = 'car_removed') AS remove_count,
  COUNT(*) FILTER (WHERE event_type = 'car_viewed')  AS view_count,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'car_added')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'car_viewed'), 0) * 100, 1
  ) AS add_rate_pct
FROM events
WHERE car_id IS NOT NULL
GROUP BY car_id;

-- ─── Row Level Security (public read, session-scoped write) ──────────────────

ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE events  ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible garages
CREATE POLICY "public read garages"
  ON garages FOR SELECT
  USING (is_visible = TRUE);

-- Anyone (anon) can insert a garage
CREATE POLICY "anon insert garage"
  ON garages FOR INSERT
  WITH CHECK (TRUE);

-- Anyone can read votes
CREATE POLICY "public read votes"
  ON votes FOR SELECT
  USING (TRUE);

-- Anyone can insert a vote (unique constraint prevents double-voting)
CREATE POLICY "anon insert vote"
  ON votes FOR INSERT
  WITH CHECK (TRUE);

-- Anyone can insert analytics events
CREATE POLICY "anon insert event"
  ON events FOR INSERT
  WITH CHECK (TRUE);
