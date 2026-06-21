const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STATE = { timer: 300, running: false, iv: null, hits: 0, reactionTimes: [], currentTarget: null, spawnTime: 0 };
document.getElementById('record').textContent = data.records.reaction || 0;

function spawnTarget() {
  document.getElementById('problem-area').innerHTML = '<div class="rxn-area" id="rxnArea"></div>';
  const ar = document.getElementById('rxnArea');
  const size = Utils.rand(60, 120);
  const x = Utils.rand(0, 400 - size);
  const y = Utils.rand(0, 400 - size);
  const t = document.createElement('div');
  t.className = 'rxn-target';
  t.style.width = size + 'px';
  t.style.height = size + 'px';
  t.style.left = x + 'px';
  t.style.top = y + 'px';
  t.textContent = '💥';
  t.style.background = `radial-gradient(circle at 30% 30%, #ff7799, var(--c-rxn))`;
  t.addEventListener('click', () => hitTarget(t));
  t.addEventListener('touchstart', e => { e.preventDefault(); hitTarget(t); });
  ar.appendChild(t);
  STATE.currentTarget = t;
  STATE.spawnTime = performance.now();
  setTimeout(() => {
    if (STATE.currentTarget === t) { STATE.currentTarget = null; spawnTarget(); }
  }, 1500);
}

function hitTarget(t) {
  if (STATE.currentTarget !== t) return;
  const rt = Math.round(performance.now() - STATE.spawnTime);
  STATE.reactionTimes.push(rt);
  STATE.hits++;
  Snd.ok();
  Utils.flash('green');
  Utils.haptic();
  document.getElementById('hits').textContent = STATE.hits;
  const avg = Math.round(STATE.reactionTimes.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, STATE.reactionTimes.length));
  document.getElementById('score').textContent = avg + ' мс';
  STATE.currentTarget = null;
  spawnTarget();
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, hits: 0, reactionTimes: [] });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('hits').textContent = '0';
  Snd.start();
  setTimeout(spawnTarget, 1000);
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
  const avg = STATE.reactionTimes.length ? Math.round(STATE.reactionTimes.reduce((a, b) => a + b, 0) / STATE.reactionTimes.length) : 999;
  Store.recordResult('reaction', avg);
  if (window.API && API.token) API.saveResult('reaction', avg).catch(()=>{});
  document.getElementById('resScore').textContent = avg;
  const rating = avg < 250 ? '⚡ Молния' : avg < 350 ? '⚡ Быстрый' : avg < 500 ? '🐢 Нормальный' : '🐌 Сонный';
  document.getElementById('resVs').innerHTML = `${rating}. Ты быстрее <strong>${Math.max(5, 100 - Math.floor(avg / 8))}%</strong> пользователей`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.reaction;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">💥</div>';
Utils.cursor();
