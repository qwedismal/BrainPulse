const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STATE = { timer: 300, running: false, iv: null, score: 0, targetX: 50, targetY: 50, hoverX: 50, hoverY: 50 };
document.getElementById('record').textContent = data.records.mirror || 0;

function getMirror(x, y) { return { x: 100 - x, y }; }

function render() {
  document.getElementById('problem-area').innerHTML = `
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
    <div class="mirror-hint">Двигай курсор/палец в зеркальной позиции</div>`;
  setNewTarget();
  
  const rightSide = document.getElementById('rightSide');
  rightSide.addEventListener('mousemove', e => {
    const rect = rightSide.getBoundingClientRect();
    STATE.hoverX = ((e.clientX - rect.left) / rect.width) * 100;
    STATE.hoverY = ((e.clientY - rect.top) / rect.height) * 100;
    document.getElementById('rightCoord').textContent = `x: ${Math.round(STATE.hoverX)} y: ${Math.round(STATE.hoverY)}`;
    const mirror = getMirror(STATE.targetX, STATE.targetY);
    if (Math.hypot(STATE.hoverX - mirror.x, STATE.hoverY - mirror.y) < 8) confirm();
  });
  rightSide.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = rightSide.getBoundingClientRect();
    STATE.hoverX = ((t.clientX - rect.left) / rect.width) * 100;
    STATE.hoverY = ((t.clientY - rect.top) / rect.height) * 100;
  }, { passive: false });
  
  // Для мобильных — тап по левой стороне
  document.getElementById('leftSide').addEventListener('click', confirm);
}

function setNewTarget() {
  STATE.targetX = Utils.rand(15, 85);
  STATE.targetY = Utils.rand(15, 85);
  const target = document.getElementById('targetEl');
  if (target) {
    target.style.left = `calc(${STATE.targetX}% - 25px)`;
    target.style.top = `calc(${STATE.targetY}% - 25px)`;
  }
  document.getElementById('leftCoord').textContent = `x: ${STATE.targetX} y: ${STATE.targetY}`;
  const mirror = getMirror(STATE.targetX, STATE.targetY);
  document.getElementById('rightCoord').textContent = `ищи: x: ${mirror.x} y: ${mirror.y}`;
}

function confirm() {
  if (!STATE.running) return;
  const mirror = getMirror(STATE.targetX, STATE.targetY);
  const dist = Math.hypot(STATE.hoverX - mirror.x, STATE.hoverY - mirror.y);
  if (dist < 15) {
    STATE.score++;
    Snd.ok();
    Utils.flash('green');
    document.getElementById('score').textContent = STATE.score;
    setNewTarget();
  }
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0 });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
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
  document.getElementById('resVs').innerHTML = `Прошёл <strong>${STATE.score}</strong> точек`;
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
