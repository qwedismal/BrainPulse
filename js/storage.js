const Store = {
  KEY: 'brainpulse_v1',
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? JSON.parse(raw) : this.fresh();
      // Backfill новых полей
      if (!this.data.records.mirror) this.data.records.mirror = 0;
      if (!this.data.records.dual) this.data.records.dual = 0;
      if (!this.data.records.nback) this.data.records.nback = 0;
      if (!this.data.records.sort) this.data.records.sort = 0;
      if (!this.data.history.mirror) this.data.history.mirror = [];
      if (!this.data.history.dual) this.data.history.dual = [];
      if (!this.data.history.nback) this.data.history.nback = [];
      if (!this.data.history.sort) this.data.history.sort = [];
      if (!this.data.lastBossDay) this.data.lastBossDay = null;
      return this.data;
    } catch { this.data = this.fresh(); return this.data; }
  },
  fresh() {
    return {
      streak: 0, lastDay: null, totalTrainings: 0,
      level: 0, xp: 0,
      records: {
        accelerator: 0, expander: 0, focus: 0, grip: 0,
        reaction: 0, pattern: 0, mirror: 0, dual: 0, nback: 0, sort: 0
      },
      history: {
        accelerator: [], expander: [], focus: [], grip: [],
        reaction: [], pattern: [], mirror: [], dual: [], nback: [], sort: []
      },
      achievements: [],
      settings: { sound: true },
      lastBossDay: null
    };
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
  isNewDay() {
    const today = new Date().toDateString();
    if (this.data.lastDay === today) return false;
    if (!this.data.lastDay) { this.data.streak = 1; }
    else {
      const diff = (new Date(today) - new Date(this.data.lastDay)) / 86400000;
      this.data.streak = diff === 1 ? this.data.streak + 1 : 1;
    }
    this.data.lastDay = today;
    this.save();
    return true;
  },
  recordResult(exId, score) {
    if (!this.isNewDay() && !this.data.history[exId].length) this.isNewDay();
    const prev = this.data.records[exId] || 0;
    if (score > prev) { this.data.records[exId] = score; }
    this.data.history[exId].push({ d: Date.now(), s: score });
    if (this.data.history[exId].length > 30) this.data.history[exId].shift();
    this.data.totalTrainings++;
    this.data.xp += Math.floor(score * 1.5);
    this.data.level = Math.min(100, Math.floor(this.data.xp / 100));
    this.checkAchievements();
    this.save();
  },
  checkAchievements() {
    const d = this.data;
    const add = id => { if (!d.achievements.includes(id)) d.achievements.push(id); };
    if (d.totalTrainings >= 1) add('first_minute');
    if (d.streak >= 7) add('untiring');
    if (d.streak >= 3) add('sprinter');
    const gripDays = d.history.grip.length;
    if (gripDays >= 10) add('memory_master');
    if (d.lastBossDay) add('boss_killer');
  },
  getLevelName(pct) {
    if (pct < 21) return 'Телефон с 2010 года';
    if (pct < 41) return 'Калькулятор в кармане';
    if (pct < 61) return 'Игровой ПК';
    if (pct < 81) return 'Квантовый компьютер';
    return 'Искусственный интеллект';
  }
};
window.Store = Store;
