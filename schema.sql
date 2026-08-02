CREATE TABLE IF NOT EXISTS hmjs_sessions (
  session_id TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  day_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hmjs_sessions_last_seen
ON hmjs_sessions (last_seen);

CREATE TABLE IF NOT EXISTS hmjs_site_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_visits INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO hmjs_site_stats (id, total_visits)
VALUES (1, 0);

CREATE TABLE IF NOT EXISTS hmjs_daily_stats (
  day_key TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER IF NOT EXISTS hmjs_sessions_increment_stats
AFTER INSERT ON hmjs_sessions
BEGIN
  UPDATE hmjs_site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1;

  INSERT INTO hmjs_daily_stats (day_key, visits)
  VALUES (NEW.day_key, 1)
  ON CONFLICT(day_key) DO UPDATE SET visits = visits + 1;
END;
