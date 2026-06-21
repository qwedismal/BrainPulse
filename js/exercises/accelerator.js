const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = { timer: 300, running: false, iv: null, score: 0, level: 1, currentAnswer: 0 };
document.getElementById('record').textContent = data.records.accelerator || 0;

function setLevel() {
  const speed = STATE.score / Math.max(1, (300 - STATE.timer) / 60);
  if (speed > 25) STATE.level = 3;
  else if (speed > 15) STATE.level = 2;
  else STATE.level = 1;
}

function genProblem() {
  let a, b, op;
  if (STATE.level === 1) {
    a = Utils.rand(2, 9); b = Utils.rand(2, 9);
    op = Math.random() < 0.5 ? '+' : '-';
    if (op === '-' && b > a) [a, b] = [b, a];
  } else if (STATE.level === 2) {
    a = Utils.rand(11, 49); b = Utils.rand(2, 9);
    op = Math.random() < 0.5 ? '+' : '-';
  } else {
    a = Utils.rand(20, 80); b = Utils.rand(15, 60);
    op = Math.random() < 0.5 ? '+' : '-';
  }
  const ans = op === '+' ? a + b : a - b;
  return { text: `${a} ${op} ${b} = ?`, ans };
}

function render() {
  const p = genProblem();
  STATE.currentAnswer = p.ans;
  document.getElementById('problem-area').innerHTML = `
    <div class="acc-problem">${p.text}</div>
    <div class="acc-input-row">
      <input type="number" class="acc-input" id="ansIn" autocomplete="off" inputmode="numeric" placeholder="?">
    </div>`;
  const inp = document.getElementById('ansIn');
  inp.focus();
  inp.addEventListener('input', e => {
    if (parseInt(e.target.value) === STATE.currentAnswer) submit(true);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') submit(parseInt(inp.value) === STATE.currentAnswer);
  });
}

function submit(ok) {
  if (!STATE.running) return;
  if (ok) { STATE.score++; Snd.ok(); Utils.flash('green'); }
  else { Snd.err(); Utils.flash('red'); }
  setLevel();
  document.getElementById('score').textContent = STATE.score;
  render();
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0, level: 1 });
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
  Store.recordResult('accelerator', STATE.score);
  if (window.API && API.token) API.saveResult('accelerator', STATE.score).catch(()=>{});
  document.getElementById('resScore').textContent = STATE.score;
  document.getElementById('resVs').innerHTML = `Ты быстрее <strong>${Math.min(95, 40 + Math.floor(STATE.score / 2))}%</strong> пользователей`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.accelerator;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">⚡</div>';
Utils.cursor();
