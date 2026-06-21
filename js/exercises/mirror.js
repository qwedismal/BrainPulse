const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300, running: false, iv: null,
  score: 0, level: 1,
  targetX: 50, targetY: 50, // % позиция
  hoverX: 50, hoverY: 50
};

document.getElementById('record').textContent = data.records.mirror || 0;

function getMirrorCoord(x, y) {
  // Зеркальное отражение по горизонтали
  return { x: 100 - x, y };
}

function render() {
  const area = document.getElementById('problem-area');
  area.innerHTML = `
    <div class="mirror-board">
      <div class="mirror-side" id="leftSide">
        <h4>ОРИГИНАЛ</h4>
        <div class="mirror-target" id="targetEl" style="width:50px;height:50px;font-size:18px">●</div>
        <div class="mirror-coord-display" id="leftCoord">x: 50 y: 50</div>
      </div>
      <div class="mirror-side" id="rightSide">
        <h4>ЗЕРКАЛО</h4>
        <div class="mirror-coord-display" id="rightCoord">x: 50 y: 50</div>
      </div>
    </div>
    <div class="mirror-hint">Удерживай палец/курсор в ЗЕРКАЛЬНОЙ позиции от мишени</div>`;
  
  // Стартовая позиция
  setNewTarget();
  
  // Отслеживание на правой стороне
  const rightSide = document.getElementById('rightSide');
  rightSide.addEventListener('mousemove', e => handleMove(e, rightSide));
  rightSide.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    handleMove(t, rightSide);
  }, { passive: false });
  
  // Мобильная версия: тапы по левой стороне для подтверждения
  const leftSide = document.getElementById('leftSide');
  leftSide.addEventListener('click', () => confirmPosition());
}

function setNewTarget() {
  // Случайная позиция оригинала
  STATE.targetX = Utils.rand(15, 85);
  STATE.targetY = Utils.rand(15, 85);
  const target = document.getElementById('targetEl');
  if (target) {
    target.style.left = `calc(${STATE.targetX}% - 25px)`;
    target.style.top = `calc(${STATE.targetY}% - 25px)`;
  }
  document.getElementById('leftCoord').textContent = `x: ${STATE.targetX} y: ${STATE.targetY}`;
  
  // Зеркальная позиция
  const mirror = getMirrorCoord(STATE.targetX, STATE.targetY);
  document.getElementById('rightCoord').textContent = `ищи: x: ${mirror.x} y: ${mirror.y}`;
}

function handleMove(e, el) {
  if (!STATE.running) return;
  const rect = el.getBoundingClientRect();
  STATE.hoverX = ((e.clientX - rect.left) / rect.width) * 100;
  STATE.hoverY = ((e.clientY - rect.top) / rect.height) * 100;
  document.getElementById('rightCoord').textContent = `x: ${Math.round(STATE.hoverX)} y: ${Math.round(STATE.hoverY)}`;
  
  // Автопроверка если очень близко
  const mirror = getMirrorCoord(STATE.targetX, STATE.targetY);
  const dist = Math.hypot(STATE.hoverX - mirror.x, STATE.hoverY - mirror.y);
  if (dist < 8) {
    confirmPosition();
  }
}

function confirmPosition() {
  if (!STATE.running) return;
  const mirror = getMirrorCoord(STATE.targetX, STATE.targetY);
  const dist = Math.hypot(STATE.hoverX - mirror.x, STATE.hoverY - mirror.y);
  
  if (dist < 15) {
    score();
  } else {
    Snd.err();
    Utils.flash('red');
  }
}

function score() {
  STATE.score++;
  Snd.ok();
  Utils.flash('green');
  document.getElementById('score').textContent = STATE.score;
  // Повышение уровня
  if (STATE.score > 0 && STATE.score % 5 === 0) {
    STATE.level++;
    document.getElementById('lvl').textContent = STATE.level;
  }
  setNewTarget();
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0, level: 1 });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('score').textContent = '0';
  document.getElementById('lvl').textContent = '1';
  Snd.start();
  render();
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  clearInterval(STATE.iv);
  Snd.end();
  Store.recordResult('mirror', STATE.score);
  if (window.API && API.token) API.saveResult('mirror', STATE.score).catch(()=>{});
  document.getElementById('resScore').textContent = STATE.score;
  document.getElementById('resVs').innerHTML = `Ты прошёл <strong>${STATE.score}</strong> точек. Это уровень <strong>${STATE.score > 30 ? 'зеркального мастера' : STATE.score > 15 ? 'следопыта' : 'ученика'}</strong>`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.mirror;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🪞</div>';
Utils.cursor();
