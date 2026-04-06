-- ============================================================
-- Migration 002 — Auto-increment vote_count via trigger
-- This avoids a round-trip: insert vote → trigger fires → count++
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_vote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE garages SET vote_count = vote_count + 1 WHERE id = NEW.garage_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_insert ON votes;
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION handle_new_vote();
