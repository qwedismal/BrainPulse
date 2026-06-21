const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

let mode = 'math'; // or 'stroop'
let timer = 300, score = 0, level = 1, totalAns = 0, correctAns = 0;
let iv = null, running = false;
let currentAnswer = 0;

const recEl = $('record');
recEl.textContent = data.records.accelerator || 0;

function setLevel() {
  const rate = totalAns > 0 ? (correctAns / totalAns) : 0;
  const speed = (score / Math.max(1, 300 - timer)) * 60;
  if (speed > 20 && correctAns > 15) level = 3;
  else if (speed > 15 && correctAns > 8) level = 2;
  else level = 1;
  $('lvl').textContent = level;
}

function genProblem() {
  let a, b, op;
  if (level === 1) { a = Utils.rand(2, 9); b = Utils.rand(2, 9); op = Math.random() < 0.5 ? '+' : '-'; if (op === '-' && b > a) [a,b] = [b,a]; }
  else if (level === 2) { a = Utils.rand(11, 49); b = Utils.rand(2, 9); op = Math.random() < 0.5 ? '+' : '-'; }
  else { a = Utils.rand(20, 80); b = Utils.rand(15, 60); op = Math.random() < 0.5 ? '+' : '-'; }
  const ans = op === '+' ? a + b : a - b;
  return { text: `${a} ${op} ${b} = ?`, ans };
}

function renderMath() {
  const p = genProblem();
  currentAnswer = p.ans;
  $('problem-area').innerHTML = `
    <div class="acc-problem">${p.text}</div>
    <div class="acc-input-row">
      <input type="number" class="acc-input" id="ansIn" autocomplete="off" inputmode="numeric" placeholder="?">
    </div>`;
  const inp = $('ansIn'); inp.focus();
  inp.addEventListener('input', e => {
    if (parseInt(e.target.value) === currentAnswer) submit(true);
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(parseInt(inp.value) === currentAnswer); });
}

const colors = [
  { name: 'Красный', val: '#ef4444', label: 'КРАСНЫЙ' },
  { name: 'Синий', val: '#3b82f6', label: 'СИНИЙ' },
  { name: 'Зелёный', val: '#22c55e', label: 'ЗЕЛЁНЫЙ' },
  { name: 'Жёлтый', val: '#eab308', label: 'ЖЁЛТЫЙ' }
];

function renderStroop() {
  const word = Utils.shuffle(colors)[0];
  const colorObj = Utils.shuffle(colors.filter(c => c !== word))[0];
  currentAnswer = colorObj.val;
  $('problem-area').innerHTML = `
    <div class="stroop" style="color:${colorObj.val}">${word.label}</div>
    <div class="stroop-answers">
      ${colors.map(c => `<button class="stroop-btn" data-color="${c.val}" style="background:${c.val}">${c.name}</button>`).join('')}
    </div>`;
  document.querySelectorAll('.stroop-btn').forEach(b => {
    b.addEventListener('click', () => submit(b.dataset.color === currentAnswer));
  });
}

function submit(ok) {
  if (!running) return;
  totalAns++;
  if (ok) {
    score++; correctAns++;
    Snd.ok(); Utils.flash('green');
    const fb = $('fb'); fb.textContent = '✓ ВЕРНО'; fb.className = 'acc-feedback ok show';
    setTimeout(() => fb.classList.remove('show'), 400);
  } else {
    Snd.err(); Utils.flash('red');
    const fb = $('fb'); fb.textContent = '✗ ' + currentAnswer; fb.className = 'acc-feedback err show';
    setTimeout(() => fb.classList.remove('show'), 600);
  }
  $('score').textContent = score;
  setLevel();
  if (mode === 'math') renderMath(); else renderStroop();
}

function tick() {
  timer--;
  $('time').textContent = Utils.formatTime(timer);
  const tEl = $('time');
  if (timer <= 10) { Snd.tick(); tEl.style.transform = 'scale(1.15)'; setTimeout(()=>tEl.style.transform='scale(1)',100); }
  if (timer <= 0) finish();
}

function start() {
  if (running) return;
  running = true;
  timer = 300; score = 0; totalAns = 0; correctAns = 0; level = 1;
  $('startBtn').disabled = true;
  $('stopBtn').disabled = false;
  Snd.start();
  if (mode === 'math') renderMath(); else renderStroop();
  iv = setInterval(tick, 1000);
}

function finish() {
  running = false;
  clearInterval(iv);
  Snd.end();
  Store.recordResult('accelerator', score);
  const all = Object.values(Store.load().records).reduce((a, b) => a + b, 0);
  $('resScore').textContent = score;
  $('resVs').innerHTML = `Ты быстрее <strong>${Math.min(95, 40 + Math.floor(score / 2))}%</strong> пользователей`;
  $('resultModal').classList.add('show');
  $('record').textContent = Store.load().records.accelerator;
  $('startBtn').disabled = false;
  $('stopBtn').disabled = true;
}

function stop() {
  if (!running) return;
  finish();
}

$('startBtn').addEventListener('click', start);
$('stopBtn').addEventListener('click', stop);
$('againBtn').addEventListener('click', () => { $('resultModal').classList.remove('show'); start(); });
$('stroopBtn').addEventListener('click', () => {
  mode = mode === 'math' ? 'stroop' : 'math';
  $('stroopBtn').textContent = mode === 'math' ? 'Цветовая слепота' : 'Счёт на время';
  if (!running) {
    $('problem-area').innerHTML = mode === 'math'
      ? '<div class="acc-problem" style="opacity:.4;font-size:80px">Готов?</div>'
      : '<div class="stroop" style="opacity:.4">Готов?</div>';
  }
});
Utils.cursor();
