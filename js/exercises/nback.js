const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STIMULI = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const STATE = {
  timer: 300, running: false, iv: null,
  n: 2,
  sequence: [],          // показанные стимулы
  trials: [],            // {stim, isMatch (ожидался ли матч), userResp, correct}
  currentTrialIdx: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  waitingForResponse: false,
  stimulusShownAt: 0
};

document.getElementById('record').textContent = data.records.nback || 0;

function genNextStimulus() {
  // 30% шанс совпадения с N-назад
  const lastN = STATE.sequence[STATE.sequence.length - STATE.n];
  const shouldMatch = STATE.sequence.length >= STATE.n && Math.random() < 0.3;
  const stim = shouldMatch ? lastN : STIMULI[Utils.rand(0, STIMULI.length - 1)];
  STATE.sequence.push(stim);
  return { stim, isMatch: shouldMatch };
}

function showStimulus(trial) {
  const el = document.querySelector('.nback-stimulus');
  if (!el) return;
  el.textContent = trial.stim;
  el.classList.add('flash');
  Snd.tick();
  setTimeout(() => el.classList.remove('flash'), 500);
  STATE.waitingForResponse = true;
  STATE.stimulusShownAt = Date.now();
  
  // Окно ответа — 2.5 секунды
  setTimeout(() => {
    if (STATE.waitingForResponse) {
      // Не ответил вовремя = пропуск
      STATE.trials.push({ ...trial, userResp: false, correct: false });
      STATE.waitingForResponse = false;
      nextTrial();
    }
  }, 2500);
}

function onMatch() {
  if (!STATE.waitingForResponse || !STATE.running) return;
  const trial = STATE.sequence.length > 0 ? 
    { stim: STATE.sequence[STATE.sequence.length - 1], isMatch: STATE.checkMatch || false } : null;
  // Используем последний запланированный trial
  const last = STATE.currentTrial;
  if (!last) return;
  
  STATE.waitingForResponse = false;
  const correct = last.isMatch;
  STATE.trials.push({ stim: last.stim, isMatch: last.isMatch, userResp: true, correct });
  STATE.totalAnswered++;
  if (correct) {
    STATE.totalCorrect++;
    Snd.ok();
    Utils.flash('green');
  } else {
    Snd.err();
    Utils.flash('red');
  }
  updateScore();
  nextTrial();
}

function updateScore() {
  const pct = STATE.totalAnswered > 0 ? Math.round((STATE.totalCorrect / STATE.totalAnswered) * 100) : 0;
  document.getElementById('score').textContent = pct + '%';
}

function nextTrial() {
  if (!STATE.running) return;
  setTimeout(() => {
    if (!STATE.running) return;
    const trial = genNextStimulus();
    STATE.currentTrial = trial;
    showStimulus(trial);
    updateProgress();
  }, 500);
}

function updateProgress() {
  const fill = document.querySelector('.nback-progress-fill');
  if (fill) {
    const pct = Math.min(100, (STATE.sequence.length / 50) * 100);
    fill.style.width = pct + '%';
  }
}

function render() {
  document.getElementById('problem-area').innerHTML = `
    <div class="nback-board">
      <div class="nback-stimulus">·</div>
      <button class="nback-cta" id="matchBtn">СОВПАДАЕТ</button>
      <div class="nback-progress"><div class="nback-progress-fill"></div></div>
      <div class="nback-hint">Нажимай «СОВПАДАЕТ», если текущая буква совпадает с той, что была ${STATE.n} шагов назад</div>
    </div>`;
  document.getElementById('matchBtn').addEventListener('click', onMatch);
  // Пробел тоже работает
  document.addEventListener('keydown', kbHandler);
}

function kbHandler(e) {
  if (e.code === 'Space' && STATE.waitingForResponse) {
    e.preventDefault();
    onMatch();
  }
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, {
    timer: 300, running: true,
    sequence: [], trials: [], currentTrialIdx: 0,
    totalCorrect: 0, totalAnswered: 0,
    waitingForResponse: false
  });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('score').textContent = '0%';
  Snd.start();
  render();
  nextTrial();
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  STATE.waitingForResponse = false;
  clearInterval(STATE.iv);
  document.removeEventListener('keydown', kbHandler);
  Snd.end();
  
  const pct = STATE.totalAnswered > 0 ? Math.round((STATE.totalCorrect / STATE.totalAnswered) * 100) : 0;
  Store.recordResult('nback', pct);
  if (window.API && API.token) API.saveResult('nback', pct).catch(()=>{});
  
  document.getElementById('resScore').textContent = pct;
  document.getElementById('resVs').innerHTML = `N=${STATE.n}, точность <strong>${pct}%</strong>. ${pct > 85 ? '🧠 Гений рабочей памяти' : pct > 70 ? '🎯 Отличный фокус' : '💪 Есть куда расти'}`;
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
  STATE.n = STATE.n === 2 ? 3 : STATE.n === 3 ? 1 : 2;
  document.getElementById('nVal').textContent = STATE.n;
  document.getElementById('startBtn').textContent = `▶ Старт (N=${STATE.n})`;
  document.querySelector('.nback-hint')?.remove();
});

document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🧠</div>';
Utils.cursor();
