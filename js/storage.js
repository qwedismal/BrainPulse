const Store = {
  KEY: 'brainpulse_v3',
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        // Backfill
        const records = ['accelerator','expander','focus','grip','reaction','pattern','mirror','dual','nback','sort','chess','duel'];
        records.forEach(r => {
          if (!this.data.records[r]) this.data.records[r] = 0;
          if (!this.data.history[r]) this.data.history[r] = [];
        });
        if (!this.data.lastBossDay) this.data.lastBossDay = null;
        return this.data;
      }
    } catch (e) { console.error('Store load error', e); }
    this.data = this.fresh();
    return this.data;
  },
  fresh() {
    const records = {};
    const history = {};
    ['accelerator','expander','focus','grip','reaction','pattern','mirror','dual','nback','sort','chess','duel'].forEach(r => {
      records[r] = 0;
      history[r] = [];
    });
    return {
      streak: 0,
      lastDay: null,
      totalTrainings: 0,
      level: 0,
      xp: 0,
      records,
      history,
      achievements: [],
      settings: { sound: true },
      lastBossDay: null
    };
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); }
    catch (e) { console.error('Store save error', e); }
  },
  isNewDay() {
    const today = new Date().toDateString();
    if (this.data.lastDay === today) return false;
    if (!this.data.lastDay) this.data.streak = 1;
    else {
      const diff = (new Date(today) - new Date(this.data.lastDay)) / 86400000;
      this.data.streak = diff === 1 ? this.data.streak + 1 : 1;
    }
    this.data.lastDay = today;
    this.save();
    return true;
  },
  recordResult(exId, score) {
    if (!this.data.history[exId]) this.data.history[exId] = [];
    if (!this.data.records[exId]) this.data.records[exId] = 0;
    if (!this.isNewDay() && !this.data.history[exId].length) this.isNewDay();
    if (score > this.data.records[exId]) this.data.records[exId] = score;
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
    if (d.history.grip && d.history.grip.length >= 10) add('memory_master');
    if (d.lastBossDay) add('boss_killer');
    if (d.history.chess && d.history.chess.length >= 5) add('chess_master');
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
