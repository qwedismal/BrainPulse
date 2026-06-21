const colors = ['#FF6B00', '#0088FF', '#00CC66', '#9B59B6', '#FF3366', '#FFD700', '#00CED1', '#9370DB'];

function getLeaderboard(db, req, res) {
  const { exercise = 'total', limit = 100 } = req.query;
  const limitNum = Math.min(100, parseInt(limit) || 100);
  
  let rows;
  if (exercise === 'total') {
    rows = db.prepare(`
      SELECT 
        u.id, u.name, u.color, u.level, u.total_trainings,
        COALESCE(SUM(r.best_score), 0) as score
      FROM users u
      LEFT JOIN records r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY score DESC
      LIMIT ?
    `).all(limitNum);
  } else {
    rows = db.prepare(`
      SELECT 
        u.id, u.name, u.color, u.level, u.total_trainings,
        r.best_score as score
      FROM users u
      INNER JOIN records r ON r.user_id = u.id
      WHERE r.exercise = ?
      ORDER BY r.best_score DESC
      LIMIT ?
    `).all(exercise, limitNum);
  }
  
  res.json(rows);
}

function getRecentResults(db, req, res) {
  const { limit = 50 } = req.query;
  const rows = db.prepare(`
    SELECT u.name, u.color, r.exercise, r.score, r.created_at
    FROM results r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
    LIMIT ?
  `).all(parseInt(limit) || 50);
  
  res.json(rows);
}

module.exports = { getLeaderboard, getRecentResults };
