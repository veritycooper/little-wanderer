-- Single private pet. Optimistic locking protects concurrent requests.
CREATE TABLE IF NOT EXISTS world (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL
);
