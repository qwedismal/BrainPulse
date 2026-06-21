const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STATE = { running: false, startTime: 0, currentTarget: 1, finished: false, penalty: 0, timerIv: null };
document.getElementById('record').textContent = data.records.focus || 0;

function genGrid() {
  const total = 25;
  const nums = Utils.shuffle(Array.from({length: total}, (_, i) => i + 1));
  const grid = document.createElement('div');
  grid.className = 'schulte c5';
  nums.forEach(n => {
    const cell = document.createElement('div');
    cell.className = 'sch-cell';
    cell.dataset.val = n;
    cell.textContent = n;
    grid.appendChild(cell);
  });
  document.getElementById('problem-area').innerHTML = '';
  document.getElementById('problem-area').appendChild(grid);
  STATE.currentTarget = 1;
  STATE.finished = false;
  STATE.penalty = 0;
  STATE.startTime = Date.now();
  grid.querySelectorAll('.sch-cell').forEach(c => c.addEventListener('click', () => onCellClick(c)));
  if (STATE.timerIv) clearInterval(STATE.timerIv);
  STATE.timerIv = setInterval(() => {
    if (!STATE.running) return;
    document.getElementById('time').textContent = ((Date.now() - STATE.startTime) / 1000 + STATE.penalty).toFixed(1);
  }, 100);
}

function onCellClick(cell) {
  if (STATE.finished || !STATE.running) return;
  const v = parseInt(cell.dataset.val);
  if (v === STATE.currentTarget) {
    cell.classList.add('done');
    Snd.tick();
    STATE.currentTarget++;
    if (STATE.currentTarget > 25) end();
  } else {
    Snd.err();
    STATE.penalty += 0.5;
    Utils.flash('red');
  }
}

function end() {
  STATE.finished = true;
  STATE.running = false;
  const seconds = (Date.now() - STATE.startTime) / 1000 + STATE.penalty;
  Snd.end();
  Store.recordResult('focus', Math.round(seconds * 10) / 10);
  if (window.API && API.token) API.saveResult('focus', Math.round(seconds * 10) / 10).catch(()=>{});
  document.getElementById('resScore').textContent = seconds.toFixed(1);
  const rec = Store.load().records.focus;
  document.getElementById('resVs').innerHTML = rec === Math.round(seconds * 10) / 10 ? '🏆 НОВЫЙ РЕКОРД!' : `Твой рекорд: <strong>${rec}</strong> сек`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = rec;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

function start() {
  STATE.running = true;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  genGrid();
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', () => {
  STATE.running = false;
  clearInterval(STATE.timerIv);
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
});
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🎯</div>';
Utils.cursor();
