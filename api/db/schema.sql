-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  color TEXT DEFAULT '#FF6B00',
  level INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_day TEXT,
  total_trainings INTEGER DEFAULT 0,
  achievements TEXT DEFAULT '[]',
  last_boss_day TEXT,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

-- Exercise results
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exercise TEXT NOT NULL,
  score INTEGER NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Best records per user per exercise
CREATE TABLE IF NOT EXISTS records (
  user_id TEXT NOT NULL,
  exercise TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, exercise),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_results_exercise_score ON results(exercise, score DESC);
CREATE INDEX IF NOT EXISTS idx_records_exercise_score ON records(exercise, best_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
