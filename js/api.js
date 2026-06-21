const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.host}/api`
  : `${window.location.origin}/api`;

const API = {
  token: localStorage.getItem('bp_token'),

  getHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },

  async register(name, email, password) {
    const r = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Ошибка регистрации');
    this.token = data.token;
    localStorage.setItem('bp_token', data.token);
    localStorage.setItem('bp_user', JSON.stringify(data.user));
    return data;
  },

  async login(email, password) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Ошибка входа');
    this.token = data.token;
    localStorage.setItem('bp_token', data.token);
    localStorage.setItem('bp_user', JSON.stringify(data.user));
    return data;
  },

  async getUser() {
    if (!this.token) return null;
    try {
      const r = await fetch(`${API_BASE}/auth/me`, { headers: this.getHeaders() });
      if (!r.ok) {
        this.token = null;
        localStorage.removeItem('bp_token');
        localStorage.removeItem('bp_user');
        return null;
      }
      const user = await r.json();
      localStorage.setItem('bp_user', JSON.stringify(user));
      return user;
    } catch { return null; }
  },

  async saveResult(exercise, score, details = {}) {
    if (!this.token) return null;
    try {
      return await fetch(`${API_BASE}/progress/save`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ exercise, score, details })
      });
    } catch { return null; }
  },

  async getMyStats(exercise = 'total') {
    const r = await fetch(`${API_BASE}/progress/me?exercise=${exercise}`, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed');
    return await r.json();
  },

  async getLeaderboard(exercise = 'total', limit = 100) {
    const r = await fetch(`${API_BASE}/leaderboard?exercise=${exercise}&limit=${limit}`);
    if (!r.ok) throw new Error('Failed');
    return await r.json();
  }
};
window.API = API;
