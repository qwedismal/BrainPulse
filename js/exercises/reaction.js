const data = Store.load(); Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
let timer = 300, running = false, iv = null, hits = 0, misses = 0;
let reactionTimes = [];
let currentTarget = null, spawnTime = 0, waitingToSpawn = false;

document.getElementById('record').textContent = data.records.reaction || 0;

function spawnTarget() {
  const area = document.getElementById('problem-area');
  area.innerHTML = '<div class="rxn-area" id="rxnArea"></div>';
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
  t.addEventListener('click', hitTarget);
  ar.appendChild(t);
  currentTarget = t;
  spawnTime = performance.now();
  // Miss timeout
  setTimeout(() => {
    if (currentTarget === t) { misses++; currentTarget = null; spawnTarget(); }
  }, 1500);
}

function hitTarget(e) {
  const rt = Math.round(performance.now() - spawnTime);
  reactionTimes.push(rt);
  hits++;
  Snd.ok(); Utils.flash('green'); Utils.haptic();
  document.getElementById('hits').textContent = hits;
  // Average of last 5
  const avg = Math.round(reactionTimes.slice(-5).reduce((a,b)=>a+b,0) / Math.min(5, reactionTimes.length));
  document.getElementById('score').textContent = avg + ' мс';
  currentTarget = null;
  spawnTarget();
}

function start() {
  if (running) return;
  running = true; timer = 300; hits = 0; misses = 0; reactionTimes = [];
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('hits').textContent = '0';
  Snd.start();
  setTimeout(spawnTarget, 1000);
  iv = setInterval(() => {
    timer--; document.getElementById('time').textContent = Utils.formatTime(timer);
    if (timer <= 10) Snd.tick();
    if (timer <= 0) finish();
  }, 1000);
}

function finish() {
  running = false; clearInterval(iv); Snd.end();
  const avg = reactionTimes.length ? Math.round(reactionTimes.reduce((a,b)=>a+b,0) / reactionTimes.length) : 999;
  Store.recordResult('reaction', avg);
  document.getElementById('resScore').textContent = avg;
  const rating = avg < 250 ? '⚡ Молния' : avg < 350 ? '⚡ Быстрый' : avg < 500 ? '🐢 Нормальный' : '🐌 Сонный';
  document.getElementById('resVs').innerHTML = `${rating}. Ты быстрее <strong>${Math.max(5, 100 - Math.floor(avg/8))}%</strong> пользователей`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.reaction;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => { document.getElementById('resultModal').classList.remove('show'); start(); });
document.getElementById('problem-area').innerHTML = '<div style="text-align:center;font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">💥</div>';
Utils.cursor();
