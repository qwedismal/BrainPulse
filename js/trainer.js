// === FIX: правильное определение залогиненности ===
async function init() {
  Utils.cursor();
  
  const navAuthBtn = document.getElementById('navAuthBtn');
  const user = Utils.loadUser() || await API.getUser();
  
  if (user) {
    // ЗАЛОГИНЕН
    if (navAuthBtn) {
      navAuthBtn.textContent = user.name.split(' ')[0] + ' →';
      navAuthBtn.href = '#';
      navAuthBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Выйти? Локальный прогресс сохранится.')) {
          Utils.clearUser();
          window.location.reload();
        }
      };
    }
  } else {
    // ГОСТЬ — показываем "Войти" вместо "Выйти"
    if (navAuthBtn) {
      navAuthBtn.textContent = 'Войти';
      navAuthBtn.href = 'auth.html';
    }
  }
  
  const d = Store.load();
  renderTrainer(d);
  initBrainMap(d);
  initNeuralTree(d);
  initForecast(d);
}

function renderTrainer(d) {
  // Streak
  const streakEl = document.getElementById('streak');
  if (streakEl) {
    if (d.streak === 0) streakEl.textContent = '🌱 Начни первую тренировку';
    else if (d.streak < 7) streakEl.textContent = `🔥 День ${d.streak} подряд!`;
    else streakEl.textContent = `🔥 День ${d.streak} подряд! Горишь!`;
  }

  // Level
  const pct = d.level;
  const lvlName = document.getElementById('lvlName');
  if (lvlName) lvlName.textContent = Store.getLevelName(pct);
  const levelFill = document.getElementById('levelFill');
  if (levelFill) levelFill.style.width = pct + '%';
  const lvlPct = document.getElementById('lvlPct');
  if (lvlPct) lvlPct.textContent = pct + '%';

  // Records
  const recMap = {
    accelerator: 'r-acc', expander: 'r-exp', focus: 'r-foc', grip: 'r-grp',
    reaction: 'r-rxn', pattern: 'r-pat', mirror: 'r-mir', dual: 'r-dual',
    nback: 'r-nbk', sort: 'r-srt', chess: 'r-ches', duel: 'r-duel'
  };
  Object.entries(recMap).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = d.records[k] || 0;
  });

  // Boss
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const bosses = [
    { name: 'Туман Разума', emoji: '🌫' },
    { name: 'Прокрастинатор', emoji: '🐌' },
    { name: 'Рассеянность', emoji: '💨' },
    { name: 'Забывчивость', emoji: '🕳' },
    { name: 'Залипатель', emoji: '📱' },
    { name: 'Нейрон Хаос', emoji: '🧬' }
  ];
  const todayBoss = bosses[seed % bosses.length];
  const bossEmoji = document.getElementById('bossEmoji');
  const bossTitle = document.getElementById('bossTitle');
  if (bossEmoji) bossEmoji.textContent = todayBoss.emoji;
  if (bossTitle) bossTitle.textContent = `${todayBoss.name} ждёт!`;
  if (d.lastBossDay === today) {
    const banner = document.getElementById('bossBanner');
    if (banner) banner.classList.add('defeated');
    if (bossTitle) bossTitle.textContent = `${todayBoss.name} повержён ✓`;
    const tag = document.querySelector('.boss-banner-tag');
    if (tag) tag.textContent = 'ЗАВТРА НОВЫЙ БОСС';
  }

  // Achievements
  renderAchievements(d.achievements);

  // Chart
  drawChart('accelerator');
  document.querySelectorAll('#chartTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chartTabs button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      drawChart(btn.dataset.ex);
    });
  });
}

function renderAchievements(achievements) {
  const allAch = [
    { id: 'first_minute', icon: '⚡', title: 'Первая минута', desc: 'Первая тренировка' },
    { id: 'sprinter', icon: '🏃', title: 'Спринтер', desc: '3 рекорда подряд' },
    { id: 'untiring', icon: '🔥', title: 'Неутомимый', desc: '7 дней подряд' },
    { id: 'memory_master', icon: '🧠', title: 'Мастер памяти', desc: '10 дней Цепкости' },
    { id: 'boss_killer', icon: '⚔️', title: 'Убийца боссов', desc: 'Поверг босса' },
    { id: 'chess_master', icon: '♟️', title: 'Стратег', desc: '5 дней шахмат' }
  ];
  const grid = document.getElementById('achGrid');
  if (!grid) return;
  grid.innerHTML = allAch.map(a => {
    const locked = !achievements.includes(a.id);
    return `<div class="ach ${locked ? 'locked' : ''}">
      <div class="a-icon">${locked ? '🔒' : a.icon}</div>
      <h4>${a.title}</h4>
      <p>${locked ? 'Ещё не получено' : a.desc}</p>
    </div>`;
  }).join('');
}

function drawChart(ex) {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);
  
  const data = Store.load().history[ex] || [];
  if (data.length < 1) {
    ctx.fillStyle = '#5a5a6a';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Сделай первую тренировку', W/2, H/2);
    return;
  }
  
  const padding = { l: 40, r: 16, t: 16, b: 32 };
  const cw = W - padding.l - padding.r;
  const ch = H - padding.t - padding.b;
  const max = Math.max(...data.map(p => p.s), 1);
  
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.t + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.l, y);
    ctx.lineTo(W - padding.r, y);
    ctx.stroke();
    ctx.fillStyle = '#5a5a6a';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(max - (max / 4) * i), padding.l - 6, y + 3);
  }
  
  const colors = {
    accelerator: '#FF6B00', expander: '#0088FF', focus: '#00CC66',
    grip: '#9B59B6', reaction: '#FF3366', pattern: '#FFD700'
  };
  const c = colors[ex] || '#FF6B00';
  
  const grad = ctx.createLinearGradient(0, padding.t, 0, H - padding.b);
  grad.addColorStop(0, c + '66');
  grad.addColorStop(1, c + '00');
  
  ctx.beginPath();
  ctx.moveTo(padding.l, H - padding.b);
  data.forEach((p, i) => {
    const x = padding.l + (data.length === 1 ? cw/2 : (cw / (data.length - 1)) * i);
    const y = padding.t + ch - (p.s / max) * ch;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.l + (data.length === 1 ? cw/2 : cw), H - padding.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  
  ctx.beginPath();
  data.forEach((p, i) => {
    const x = padding.l + (data.length === 1 ? cw/2 : (cw / (data.length - 1)) * i);
    const y = padding.t + ch - (p.s / max) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = c;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  data.forEach((p, i) => {
    const x = padding.l + (data.length === 1 ? cw/2 : (cw / (data.length - 1)) * i);
    const y = padding.t + ch - (p.s / max) * ch;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, 8, 8);
  });
}

function initBrainMap(d) { window.BrainMap && BrainMap.render('brainmap', d); }
function initNeuralTree(d) { window.NeuralTree && NeuralTree.render('neuraltree', d); }
function initForecast(d) { window.Forecast && Forecast.render('forecastContent', d); }

window.addEventListener('resize', () => {
  const active = document.querySelector('#chartTabs button.on');
  if (active) drawChart(active.dataset.ex);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
