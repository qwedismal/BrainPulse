Utils.cursor();
const $ = id => document.getElementById(id);

// Загружаем данные (сначала localStorage, потом с сервера если залогинен)
let d = Store.load();
const localData = { ...d };

// Boss дня
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
$('bossEmoji').textContent = todayBoss.emoji;
$('bossTitle').textContent = `${todayBoss.name} ждёт тебя!`;

if (d.lastBossDay === today) {
  const banner = $('bossBanner');
  banner.classList.add('defeated');
  $('bossTitle').textContent = `${todayBoss.name} повержён ✓`;
  document.querySelector('.boss-banner-tag').textContent = 'ЗАВТРА НОВЫЙ БОСС';
}

// Greeting
function applyData(data) {
  d = data;
  // Streak
  if (data.streak === 0) $('streak').textContent = '🌱 Начни первую тренировку';
  else if (data.streak < 7) $('streak').textContent = `🔥 День ${data.streak} подряд! Так держать`;
  else $('streak').textContent = `🔥 День ${data.streak} подряд! Ты горишь!`;
  
  // Level
  const pct = data.level;
  $('lvlName').textContent = Store.getLevelName(pct);
  $('levelFill').style.width = pct + '%';
  $('lvlPct').textContent = pct + '%';
  
  // Records
  const recMap = {
    accelerator: 'r-acc', expander: 'r-exp', focus: 'r-foc', grip: 'r-grp',
    reaction: 'r-rxn', pattern: 'r-pat', mirror: 'r-mir', dual: 'r-dual',
    nback: 'r-nbk', sort: 'r-srt'
  };
  Object.entries(recMap).forEach(([k, id]) => {
    const el = $(id);
    if (el) el.textContent = data.records[k] || 0;
  });
  
  // Achievements
  renderAchievements(data.achievements);
  
  // Chart
  drawChart(currentEx);
  
  // Greeting text
  API.getUser().then(user => {
    if (user) $('greetText').textContent = `Добро пожаловать, ${user.name}`;
  });
}

function renderAchievements(achievements) {
  const allAch = [
    { id: 'first_minute', icon: '⚡', title: 'Первая минута', desc: 'Первая тренировка' },
    { id: 'sprinter', icon: '🏃', title: 'Спринтер', desc: '3 рекорда подряд' },
    { id: 'untiring', icon: '🔥', title: 'Неутомимый', desc: '7 дней подряд' },
    { id: 'memory_master', icon: '🧠', title: 'Мастер памяти', desc: '10 дней Цепкости' },
    { id: 'boss_killer', icon: '⚔️', title: 'Убийца боссов', desc: 'Поверг босса дня' },
    { id: 'early_bird', icon: '🌅', title: 'Ранняя пташка', desc: 'Тренировка до 9 утра' }
  ];
  const achGrid = $('achGrid');
  achGrid.innerHTML = allAch.map(a => {
    const locked = !achievements.includes(a.id);
    return `<div class="ach ${locked ? 'locked' : ''}">
      <div class="a-icon">${locked ? '🔒' : a.icon}</div>
      <h4>${a.title}</h4>
      <p>${locked ? 'Ещё не получено' : a.desc}</p>
    </div>`;
  }).join('');
}

applyData(localData);

// Logout
$('logoutBtn').addEventListener('click', e => {
  e.preventDefault();
  if (confirm('Выйти? Прогресс в браузере сохранится.')) {
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_user_id');
    API.token = null;
    $('logoutBtn').textContent = 'Войти';
    $('logoutBtn').href = 'auth.html';
  }
});

// Chart
let currentEx = 'accelerator';
const canvas = $('chart');
const ctx = canvas.getContext('2d');

function drawChart(ex) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);
  
  const data = d.history[ex] || [];
  if (data.length < 1) {
    ctx.fillStyle = '#5a5a6a';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Сделай первую тренировку, чтобы увидеть график', W/2, H/2);
    return;
  }
  
  const padding = { l: 50, r: 20, t: 20, b: 40 };
  const cw = W - padding.l - padding.r;
  const ch = H - padding.t - padding.b;
  const max = Math.max(...data.map(p => p.s), 1);
  
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.t + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding.l, y); ctx.lineTo(W - padding.r, y); ctx.stroke();
    ctx.fillStyle = '#5a5a6a'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(max - (max / 4) * i), padding.l - 8, y + 4);
  }
  
  const colors = {
    accelerator: '#FF6B00', expander: '#0088FF', focus: '#00CC66',
    grip: '#9B59B6', reaction: '#FF3366', pattern: '#FFD700'
  };
  const c = colors[ex];
  
  const grad = ctx.createLinearGradient(0, padding.t, 0, H - padding.b);
  grad.addColorStop(0, c + '66'); grad.addColorStop(1, c + '00');
  
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
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = c; ctx.lineWidth = 2.5;
  ctx.shadowColor = c; ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  data.forEach((p, i) => {
    const x = padding.l + (data.length === 1 ? cw/2 : (cw / (data.length - 1)) * i);
    const y = padding.t + ch - (p.s / max) * ch;
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(x - 5, y - 5, 10, 10);
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x - 5, y - 5, 10, 10);
  });
}

document.querySelectorAll('#chartTabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#chartTabs button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    currentEx = btn.dataset.ex;
    drawChart(currentEx);
  });
});

drawChart(currentEx);
window.addEventListener('resize', () => drawChart(currentEx));
