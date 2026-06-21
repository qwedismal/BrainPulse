const auth = require('./auth');

function saveResult(db, req, res) {
  const { exercise, score, details } = req.body;
  if (!exercise || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  
  const now = Date.now();
  const userId = req.userId;
  
  // Save result
  db.prepare(`
    INSERT INTO results (user_id, exercise, score, details, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, exercise, score, JSON.stringify(details || {}), now);
  
  // Update record if better
  const existing = db.prepare('SELECT best_score FROM records WHERE user_id = ? AND exercise = ?').get(userId, exercise);
  if (!existing || score > existing.best_score) {
    if (existing) {
      db.prepare('UPDATE records SET best_score = ?, updated_at = ? WHERE user_id = ? AND exercise = ?')
        .run(score, now, userId, exercise);
    } else {
      db.prepare('INSERT INTO records (user_id, exercise, best_score, updated_at) VALUES (?, ?, ?, ?)')
        .run(userId, exercise, score, now);
    }
  }
  
  // Update user XP and total trainings
  const xpGain = Math.floor(score * 1.5);
  db.prepare(`
    UPDATE users 
    SET xp = xp + ?, 
        total_trainings = total_trainings + 1,
        level = MIN(100, (xp + ?) / 100),
        last_seen = ?
    WHERE id = ?
  `).run(xpGain, xpGain, now, userId);
  
  // Update streak
  const user = db.prepare('SELECT last_day, streak FROM users WHERE id = ?').get(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_day !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = user.last_day === yesterday ? user.streak + 1 : 1;
    db.prepare('UPDATE users SET streak = ?, last_day = ? WHERE id = ?').run(newStreak, today, userId);
  }
  
  res.json({ success: true, xp: xpGain });
}

function getMyStats(db, req, res) {
  const userId = req.userId;
  const { exercise } = req.query;
  
  let score;
  if (exercise === 'total') {
    const r = db.prepare('SELECT COALESCE(SUM(best_score), 0) as total FROM records WHERE user_id = ?').get(userId);
    score = r.total;
  } else {
    const r = db.prepare('SELECT best_score FROM records WHERE user_id = ? AND exercise = ?').get(userId, exercise);
    score = r ? r.best_score : 0;
  }
  
  // Get rank
  let rank = null;
  if (exercise === 'total') {
    const r = db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM users 
      WHERE (SELECT COALESCE(SUM(best_score), 0) FROM records WHERE user_id = users.id) > ?
    `).get(score);
    rank = r.rank;
  } else {
    const r = db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM records 
      WHERE exercise = ? AND best_score > ?
    `).get(exercise, score);
    rank = r.rank;
  }
  
  const user = db.prepare('SELECT level, total_trainings FROM users WHERE id = ?').get(userId);
  
  res.json({
    rank,
    bestScore: score,
    totalTrainings: user.total_trainings,
    level: user.level
  });
}

module.exports = { saveResult, getMyStats };
