const Snd = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  },
  beep(freq = 800, dur = 0.08, type = 'sine', vol = 0.15) {
    if (!this.enabled) return;
    this.init(); if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },
  ok() { this.beep(880, 0.1, 'sine', 0.18); setTimeout(() => this.beep(1320, 0.08, 'sine', 0.14), 60); },
  err() { this.beep(180, 0.2, 'sawtooth', 0.15); },
  tick() { this.beep(1200, 0.04, 'square', 0.05); },
  end() { this.beep(523, 0.15); setTimeout(() => this.beep(659, 0.15), 120); setTimeout(() => this.beep(784, 0.25), 240); },
  start() { this.beep(440, 0.1); setTimeout(() => this.beep(660, 0.15), 100); }
};
window.Snd = Snd;
