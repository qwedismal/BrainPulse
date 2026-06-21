const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRY = '30d';

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function generateToken(userId) {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.userId = payload.uid;
  next();
}

async function register(db, name, email, password) {
  // Validate
  if (!name || name.length < 2 || name.length > 20) throw new Error('Имя должно быть от 2 до 20 символов');
  if (!email || !email.includes('@')) throw new Error('Неверный email');
  if (!password || password.length < 6) throw new Error('Пароль должен быть не менее 6 символов');
  
  // Check existing
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) throw new Error('Этот email уже зарегистрирован');
  
  const id = generateId();
  const hash = await bcrypt.hash(password, 10);
  const now = Date.now();
  const colors = ['#FF6B00', '#0088FF', '#00CC66', '#9B59B6', '#FF3366', '#FFD700'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, color, created_at, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), email.toLowerCase(), hash, color, now, now);
  
  const token = generateToken(id);
  const user = db.prepare('SELECT id, name, email, color, level, xp, streak, total_trainings, achievements FROM users WHERE id = ?').get(id);
  
  return { user, token };
}

async function login(db, email, password) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row) throw new Error('Неверный email или пароль');
  
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new Error('Неверный email или пароль');
  
  // Update last seen
  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), row.id);
  
  const token = generateToken(row.id);
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    color: row.color,
    level: row.level,
    xp: row.xp,
    streak: row.streak,
    total_trainings: row.total_trainings,
    achievements: JSON.parse(row.achievements || '[]')
  };
  
  return { user, token };
}

module.exports = { register, login, authMiddleware, verifyToken };
