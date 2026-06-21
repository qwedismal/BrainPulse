const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

// Генерация босса на основе сегодняшней даты (одинаковый для всех в этот день)
const today = new Date().toISOString().slice(0, 10);
const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
const bosses = [
  { name: 'Туман Разума', emoji: '🌫', hp: 80, color: '#9CA3AF' },
  { name: 'Прокрастинатор', emoji: '🐌', hp: 100, color: '#F59E0B' },
  { name: 'Рассеянность', emoji: '💨', hp: 120, color: '#06B6D4' },
  { name: 'Забывчивость', emoji: '🕳', hp: 140, color: '#8B5CF6' },
  { name: 'Залипатель', emoji: '📱', hp: 160, color: '#EC4899' },
  { name: 'Нейрон Хаос', emoji: '🧬', hp: 200, color: '#EF4444' }
];
const boss = bosses[seed % bosses.length];

const STATE = {
  timer: 60, running: false, iv: null,
  bossHp: boss.hp, maxHp: boss.hp,
  playerHp: 100, maxPlayerHp: 100,
  hits: 0, misses: 0, currentAnswer: 0,
  defeated: false
};

function genProblem() {
  const ops = ['+', '-', '*'];
  const op = ops[Utils.rand(0, 2)];
  let a, b, ans;
  if (op === '*') {
    a = Utils.rand(2, 12);
    b = Utils.rand(2, 12);
    ans = a * b;
  } else if (op === '+') {
    a = Utils.rand(10, 50);
    b = Utils.rand(10, 50);
    ans = a + b;
  } else {
    a = Utils.rand(20, 80);
    b = Utils.rand(5, 30);
    ans = a - b;
  }
  const opts = [ans];
  while (opts.length < 4) {
    const fake = ans + Utils.rand(-10, 10);
    if (fake !== ans && !opts.includes(fake)) opts.push(fake);
  }
  return { text: `${a} ${op} ${b}`, ans, options: Utils.shuffle(opts) };
}

function render() {
  if (STATE.bossHp <= 0) return win();
  const p = genProblem();
  STATE.currentAnswer = p.ans;
  document.getElementById('problem-area').innerHTML = `
    <div class="boss-layout">
      <div class="boss-stage">
        <h2 style="color:${boss.color}">${boss.name}</h2>
        <div class="boss-sprite" id="bossSprite">${boss.emoji}</div>
        <div class="boss-hp-bar">
          <div class="boss-hp-fill" id="bossHpFill" style="width:${(STATE.bossHp/STATE.maxHp)*100}%"></div>
          <div class="boss-hp-text">HP: ${STATE.bossHp}/${STATE.maxHp}</div>
        </div>
      </div>
      <div class="boss-stage">
        <div class="boss-problem">${p.text} = ?</div>
        <div class="boss-choices">
          ${p.options.map(o => `<button class="boss-choice" data-v="${o}">${o}</button>`).join('')}
        </div>
        <div class="boss-stats">
          <div><strong id="hitsCount">${STATE.hits}</strong>УДАРОВ</div>
          <div><strong id="missCount">${STATE.misses}</strong>ПРОМАХОВ</div>
        </div>
      </div>
      <div class="boss-stage">
        <h2 style="color:var(--c-acc)">Ты</h2>
        <div class="boss-sprite" style="filter:drop-shadow(0 0 30px var(--c-acc))">⚡</div>
        <div class="boss-hp-bar">
          <div class="boss-hp-fill" id="playerHpFill" style="background:linear-gradient(90deg,var(--c-acc),#ff8c42);width:${(STATE.playerHp/STATE.maxPlayerHp)*100}%"></div>
          <div class="boss-hp-text">HP: ${STATE.playerHp}/${STATE.maxPlayerHp}</div>
        </div>
      </div>
    </div>`;
  
  document.querySelectorAll('.boss-choice').forEach(c => {
    c.addEventListener('click', () => submit(parseInt(c.dataset.v), c));
  });
}

function submit(v, btn) {
  if (!STATE.running || STATE.defeated) return;
  if (v === STATE.currentAnswer) {
    STATE.bossHp = Math.max(0, STATE.bossHp - 10);
    STATE.hits++;
    Snd.ok();
    Utils.flash('green');
    const sprite = document.getElementById('bossSprite');
    if (sprite) {
      sprite.classList.add('boss-hit');
      setTimeout(() => sprite.classList.remove('boss-hit'), 300);
    }
    if (STATE.bossHp <= 0) {
      setTimeout(win, 500);
      return;
    }
    setTimeout(render, 250);
  } else {
    STATE.playerHp = Math.max(0, STATE.playerHp - 15);
    STATE.misses++;
    Snd.err();
    Utils.flash('red');
    Utils.haptic();
    btn.style.background = 'var(--c-rxn)';
    btn.style.color = '#fff';
    setTimeout(() => btn.style.background = '', 300);
    if (STATE.playerHp <= 0) {
      setTimeout(lose, 500);
      return;
    }
  }
  const pf = document.getElementById('playerHpFill');
  if (pf) pf.style.width = (STATE.playerHp / STATE.maxPlayerHp * 100) + '%';
  document.getElementById('hitsCount').textContent = STATE.hits;
  document.getElementById('missCount').textContent = STATE.misses;
}

function win() {
  STATE.defeated = true;
  STATE.running = false;
  clearInterval(STATE.iv);
  Snd.end();
  
  const timeBonus = Math.floor(STATE.timer * 5);
  const accuracy = STATE.hits / Math.max(1, STATE.hits + STATE.misses);
  const accuracyBonus = Math.floor(accuracy * 100);
  const reward = 100 + timeBonus + accuracyBonus;
  
  Store.data.xp += reward;
  Store.data.totalTrainings++;
  Store.save();
  
  // Достижение "Убийца боссов"
  if (!Store.data.achievements.includes('boss_killer')) {
    Store.data.achievements.push('boss_killer');
    Store.save();
  }
  
  if (window.API && API.token) {
    API.saveResult('boss', reward).catch(()=>{});
  }
  
  document.getElementById('resReward').textContent = `+${reward} XP`;
  document.getElementById('resLabel').textContent = `${boss.emoji} ${boss.name} повержен!`;
  document.getElementById('resVs').innerHTML = `Время: <strong>${60 - STATE.timer}с</strong>, Точность: <strong>${Math.round(accuracy*100)}%</strong>`;
  document.getElementById('resultModal').classList.add('show');
}

function lose() {
  STATE.defeated = true;
  STATE.running = false;
  clearInterval(STATE.iv);
  Snd.err();
  
  document.getElementById('resReward').textContent = '+0 XP';
  document.getElementById('resLabel').textContent = `${boss.emoji} Босс победил тебя`;
  document.getElementById('resVs').innerHTML = `Ты продержался <strong>${60 - STATE.timer}с</strong>. Завтра попробуй снова!`;
  document.getElementById('resultModal').classList.add('show');
}

function start() {
  if (STATE.running) return;
  STATE.timer = 60;
  STATE.bossHp = boss.hp;
  STATE.playerHp = 100;
  STATE.hits = 0;
  STATE.misses = 0;
  STATE.running = true;
  STATE.defeated = false;
  document.getElementById('startBtn').disabled = true;
  Snd.start();
  render();
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) lose();
  }, 1000);
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  document.getElementById('startBtn').disabled = true;
});

// Проверка — побеждён ли сегодня
const bossDefeatedToday = data.lastBossDay === today;
if (bossDefeatedToday) {
  document.getElementById('problem-area').innerHTML = `
    <div class="boss-intro">
      <div class="boss-sprite" style="filter:grayscale(1)">${boss.emoji}</div>
      <h2>${boss.name}</h2>
      <p style="color:var(--c-foc);font-size:20px;font-family:var(--font-head);font-weight:800">✓ УЖЕ ПОВЕРЖЁН</p>
      <p>Ты уже получил награду сегодня. Возвращайся завтра за новым боссом!</p>
    </div>`;
  document.getElementById('startBtn').disabled = true;
} else {
  document.getElementById('problem-area').innerHTML = `
    <div class="boss-intro">
      <div class="boss-sprite">${boss.emoji}</div>
      <h2 style="color:${boss.color}">${boss.name}</h2>
      <p>HP босса: <strong style="color:var(--c-rxn)">${boss.hp}</strong> · Время: <strong>60 секунд</strong></p>
      <div class="vs">VS</div>
      <div class="boss-sprite">⚡</div>
      <p style="font-family:var(--font-mono);color:var(--text-muted);margin-top:20px">У тебя 60 секунд, чтобы нанести максимум ударов. За каждый правильный ответ — 10 урона. За ошибку — босс бьёт на 15 HP.</p>
      <p style="color:var(--c-acc);font-family:var(--font-head);font-weight:800;font-size:20px;margin-top:16px">Награда: +100 XP + бонусы</p>
    </div>`;
}

// Сохраняем дату босса
const origWin = win;
window.win = origWin;
const _origStart = start;
window.start = function() {
  STATE.bossHp = boss.hp;
  STATE.playerHp = 100;
  STATE.timer = 60;
  STATE.hits = 0;
  STATE.misses = 0;
  STATE.running = true;
  STATE.defeated = false;
  document.getElementById('startBtn').disabled = true;
  Snd.start();
  render();
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) lose();
  }, 1000);
};

const _origWin = win;
window.win = function() {
  STATE.defeated = true;
  STATE.running = false;
  clearInterval(STATE.iv);
  Snd.end();
  Store.data.lastBossDay = today;
  const timeBonus = Math.floor(STATE.timer * 5);
  const accuracy = STATE.hits / Math.max(1, STATE.hits + STATE.misses);
  const accuracyBonus = Math.floor(accuracy * 100);
  const reward = 100 + timeBonus + accuracyBonus;
  Store.data.xp += reward;
  Store.data.totalTrainings++;
  Store.save();
  document.getElementById('resReward').textContent = `+${reward} XP`;
  document.getElementById('resLabel').textContent = `${boss.emoji} ${boss.name} повержен!`;
  document.getElementById('resVs').innerHTML = `Время: <strong>${60 - STATE.timer}с</strong>, Точность: <strong>${Math.round(accuracy*100)}%</strong>`;
  document.getElementById('resultModal').classList.add('show');
};
Utils.cursor();
