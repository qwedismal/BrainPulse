require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initDB = require('./api/db/init');

const authApi = require('./api/auth');
const progressApi = require('./api/progress');
const leaderboardApi = require('./api/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Init DB
const db = initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await authApi.register(db, name, email, password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authApi.login(db, email, password);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

app.get('/api/auth/me', authApi.authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, email, color, level, xp, streak, total_trainings, achievements 
    FROM users WHERE id = ?
  `).get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ========== PROGRESS ROUTES ==========
app.post('/api/progress/save', authApi.authMiddleware, (req, res) => {
  progressApi.saveResult(db, req, res);
});

app.get('/api/progress/me', authApi.authMiddleware, (req, res) => {
  progressApi.getMyStats(db, req, res);
});

// ========== LEADERBOARD ROUTES ==========
app.get('/api/leaderboard', (req, res) => {
  leaderboardApi.getLeaderboard(db, req, res);
});

app.get('/api/leaderboard/recent', (req, res) => {
  leaderboardApi.getRecentResults(db, req, res);
});

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// ========== FALLBACK (для SPA-роутинга) ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== START ==========
app.listen(PORT, () => {
  console.log(`\n🧠 BrainPulse запущен!`);
  console.log(`📍 Открой: http://localhost:${PORT}\n`);
});
