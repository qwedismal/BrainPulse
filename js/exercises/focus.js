const data = Store.load(); Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
let size = 5, mode = 'mono'; // or 'duo'
let startTime = 0, running = false, currentTarget = 1, currentRed = 25, ascending = true, finished = false, penalty = 0;
let timerIv = null;

document.getElementById('record').textContent = data.records.focus || 0;

function genGrid() {
  const total = size * size;
  const nums = [];
  for (let i = 1; i <= total; i++) nums.push(i);
  const shuffled = Utils.shuffle(nums);
  const grid = document.createElement('div');
  grid.className = `schulte ${size === 5 ? 'c5' : 'c7'}`;
  shuffled.forEach(n => {
    const cell = document.createElement('div');
    cell.className = 'sch-cell';
    if (mode === 'duo') {
      cell.classList.add(n <= total/2 ? 'red' : '');
      cell.dataset.val = n > total/2 ? n - total/2 : n;
    } else cell.dataset.val = n;
    cell.textContent = cell.dataset.val;
    grid.appendChild(cell);
  });
  document.getElementById('problem-area').innerHTML = '';
  document.getElementById('problem-area').appendChild(grid);
  currentTarget = 1; currentRed = size === 5 ? 13 : 25; ascending = true; finished = false; penalty = 0;
  startTime = Date.now();
  grid.querySelectorAll('.sch-cell').forEach(c => c.addEventListener('click', () => onCellClick(c)));
  if (timerIv) clearInterval(timerIv);
  timerIv = setInterval(() => {
    if (!running) return;
    document.getElementById('time').textContent = ((Date.now() - startTime) / 1000 + penalty).toFixed(1);
  }, 100);
}

function onCellClick(cell) {
  if (finished) return;
  const v = parseInt(cell.dataset.val);
  let expected;
  if (mode === 'mono') expected = currentTarget;
  else {
    expected = ascending ? currentTarget : currentRed;
  }
  if (v === expected) {
    cell.classList.add('done');
    Snd.tick();
    if (mode === 'mono') {
      currentTarget++;
      if (currentTarget > size * size) end();
    } else {
      if (ascending) { currentTarget++; if (currentTarget > currentRed) { ascending = false; currentTarget = 1; } }
      else { currentTarget++; if (currentTarget > currentRed) end(); }
    }
  } else {
    Snd.err();
    penalty += 0.5;
    Utils.flash('red');
  }
}

function end() {
  finished = true; running = false;
  const seconds = (Date.now() - startTime) / 1000 + penalty;
  Snd.end();
  Store.recordResult('focus', Math.round(seconds * 10) / 10);
  const rec = Store.load().records.focus;
  document.getElementById('resScore').textContent = seconds.toFixed(1);
  document.getElementById('resVs').innerHTML = rec === Math.round(seconds * 10) / 10 ? '🏆 НОВЫЙ РЕКОРД! Ты быстрее <strong>90%</strong> пользователей' : `Твой рекорд: <strong>${rec}</strong> сек`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = rec;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

function start() {
  running = true;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  genGrid();
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', () => { running = false; clearInterval(timerIv); document.getElementById('startBtn').disabled = false; document.getElementById('stopBtn').disabled = true; });
document.getElementById('againBtn').addEventListener('click', () => { document.getElementById('resultModal').classList.remove('show'); start(); });
document.getElementById('modeBtn').addEventListener('click', () => {
  if (mode === 'mono') { mode = 'duo'; size = 5; document.getElementById('modeBtn').textContent = '5x5 Моно'; }
  else { mode = 'mono'; size = size === 5 ? 7 : 5; document.getElementById('modeBtn').textContent = size === 7 ? '7x7 Моно' : '5x5 Двухцвет'; }
  if (!running) document.getElementById('problem-area').innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:60px;font-family:var(--font-head);font-weight:900">Готов?</div>';
});
Utils.cursor();
