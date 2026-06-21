const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STIMULI = ['A','B','C','D','E','F','G','H'];
const STATE = { timer: 300, running: false, iv: null, n: 2, sequence: [], currentTrial: null, totalCorrect: 0, totalAnswered: 0, waiting: false };
document.getElementById('record').textContent = data.records.nback || 0;

function nextStim() {
  const lastN = STATE.sequence[STATE.sequence.length - STATE.n];
  const shouldMatch = STATE.sequence.length >= STATE.n && Math.random() < 0.3;
  const stim = shouldMatch ? lastN : STIMULI[Utils.rand(0, STIMULI.length - 1)];
  STATE.sequence.push(stim);
  return { stim, isMatch: shouldMatch };
}

function showTrial() {
  if (!STATE.running) return;
  const trial = nextStim();
  STATE.currentTrial = trial;
  const el = document.querySelector('.nback-stimulus');
  if (el) {
    el.textContent = trial.stim;
    el.classList.add('flash');
    Snd.tick();
    setTimeout(() => el.classList.remove('flash'), 500);
  }
  STATE.waiting = true;
  setTimeout(() => {
    if (STATE.waiting && STATE.running) {
      STATE.waiting = false;
      nextRound();
    }
  }, 2500);
}

function onMatch() {
  if (!STATE.waiting || !STATE.running || !STATE.currentTrial) return;
  STATE.waiting = false;
  const correct = STATE.currentTrial.isMatch;
  STATE.totalAnswered++;
  if (correct) { STATE.totalCorrect++; Snd.ok(); Utils.flash('green'); }
  else { Snd.err(); Utils.flash('red'); }
  const pct = Math.round((STATE.totalCorrect / STATE.totalAnswered) * 100);
  document.getElementById('score').textContent = pct + '%';
  nextRound();
}

function nextRound() {
  setTimeout(showTrial, 500);
}

function render() {
  document.getElementById('problem-area').innerHTML = `
    <div class="nback-board">
      <div class="nback-stimulus">·</div>
      <button class="nback-cta" id="matchBtn">СОВПАДАЕТ</button>
      <div class="nback-progress"><div class="nback-progress-fill"></div></div>
      <div class="nback-hint">Нажимай если текущая буква совпадает с той, что была ${STATE.n} шагов назад</div>
    </div>`;
  document.getElementById('matchBtn').addEventListener('click', onMatch);
  document.addEventListener('keydown', kbHandler);
}

function kbHandler(e) {
  if (e.code === 'Space' && STATE.waiting) {
    e.preventDefault();
    onMatch();
  }
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, sequence: [], totalCorrect: 0, totalAnswered: 0, waiting: false });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  Snd.start();
  render();
  showTrial();
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  STATE.waiting = false;
  clearInterval(STATE.iv);
  document.removeEventListener('keydown', kbHandler);
  Snd.end();
  const pct = STATE.totalAnswered > 0 ? Math.round((STATE.totalCorrect / STATE.totalAnswered) * 100) : 0;
  Store.recordResult('nback', pct);
  if (window.API && API.token) API.saveResult('nback', pct).catch(()=>{});
  document.getElementById('resScore').textContent = pct;
  document.getElementById('resVs').innerHTML = `N=${STATE.n}, точность <strong>${pct}%</strong>`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.nback;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('nBtn').addEventListener('click', () => {
  if (STATE.running) return;
  STATE.n = STATE.n === 2 ? 3 : 2;
  document.getElementById('nVal').textContent = STATE.n;
  document.getElementById('startBtn').textContent = `▶ Старт (N=${STATE.n})`;
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🧠</div>';
Utils.cursor();
