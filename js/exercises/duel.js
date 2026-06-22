'use strict';

const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300,
  running: false,
  iv: null,
  youScore: 0,
  botScore: 0,
  round: 1,
  difficulty: 'easy',
  currentAnswer: 0,
  roundTimerInterval: null,
  roundTimeLeft: 0,
  acceptingInput: false
};

document.getElementById('record').textContent = (data.records && data.records.duel) || 0;

const DIFFICULTY = {
  easy: { min: 2, max: 9, ops: ['+','-'], botCorrectChance: 0.55, botMinDelay: 1200, roundTime: 8 },
  medium: { min: 5, max: 25, ops: ['+','-','*'], botCorrectChance: 0.75, botMinDelay: 800, roundTime: 6 },
  hard: { min: 10, max: 50, ops: ['+','-','*'], botCorrectChance: 0.88, botMinDelay: 500, roundTime: 4 }
};

function genProblem() {
  const d = DIFFICULTY[STATE.difficulty];
  const op = d.ops[Utils.rand(0, d.ops.length - 1)];
  let a, b, ans;
  if (op === '*') {
    a = Utils.rand(2, Math.min(12, d.max));
    b = Utils.rand(2, Math.min(12, d.max));
    ans = a * b;
  } else {
    a = Utils.rand(d.min, d.max);
    b = Utils.rand(d.min, d.max);
    if (op === '-' && b > a) { const tmp = a; a = b; b = tmp; }
    ans = op === '+' ? a + b : a - b;
  }
  const opts = [ans];
  while (opts.length < 4) {
    const fake = ans + Utils.rand(-7, 7);
    if (fake !== ans && !opts.includes(fake)) opts.push(fake);
  }
  return { text: a + ' ' + op + ' ' + b, ans: ans, options: Utils.shuffle(opts) };
}

function renderArena() {
  const d = DIFFICULTY[STATE.difficulty];
  document.getElementById('problem-area').innerHTML = 
    '<div class="duel-round-info">' +
      '<span>Раунд <strong style="color:var(--text-primary)">' + STATE.round + '</strong></span>' +
      '<span class="timer-val" id="roundTimer">' + d.roundTime + 's</span>' +
    '</div>' +
    '<div class="duel-stage">' +
      '<div class="duel-fighter you">' +
        '<div class="duel-avatar">⚡</div>' +
        '<div class="duel-name">Ты</div>' +
        '<div class="duel-score" id="youScore">' + STATE.youScore + '</div>' +
      '</div>' +
      '<div class="duel-vs">VS</div>' +
      '<div class="duel-fighter bot">' +
        '<div class="duel-avatar">🤖</div>' +
        '<div class="duel-name">Бот</div>' +
        '<div class="duel-score" id="botScore">' + STATE.botScore + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="duel-problem">' +
      '<div class="duel-problem-text" id="problemText">+ ?</div>' +
      '<div class="duel-choices" id="choices"></div>' +
    '</div>' +
    '<div class="duel-status">Реши быстрее бота!</div>';
}

function startRound() {
  if (STATE.roundTimerInterval) clearInterval(STATE.roundTimerInterval);
  STATE.roundTimeLeft = DIFFICULTY[STATE.difficulty].roundTime;
  STATE.acceptingInput = true;
  
  const p = genProblem();
  STATE.currentAnswer = p.ans;
  
  renderArena();
  document.getElementById('problemText').textContent = p.text + ' = ?';
  const choices = document.getElementById('choices');
  choices.innerHTML = '';
  for (const o of p.options) {
    const btn = document.createElement('button');
    btn.className = 'duel-choice';
    btn.dataset.val = String(o);
    btn.textContent = o;
    btn.addEventListener('click', function() {
      onAnswer(parseInt(this.dataset.val), this);
    });
    choices.appendChild(btn);
  }
  
  // Таймер раунда
  STATE.roundTimerInterval = setInterval(() => {
    if (!STATE.running) {
      clearInterval(STATE.roundTimerInterval);
      return;
    }
    STATE.roundTimeLeft--;
    const rt = document.getElementById('roundTimer');
    if (rt) rt.textContent = STATE.roundTimeLeft + 's';
    if (STATE.roundTimeLeft <= 0) {
      clearInterval(STATE.roundTimerInterval);
      if (STATE.acceptingInput) {
        STATE.botScore++;
        updateScores();
        Snd.err();
        Utils.flash('red');
        STATE.acceptingInput = false;
        setTimeout(nextRound, 1000);
      }
    }
  }, 1000);
  
  // Бот отвечает через случайное время
  const d = DIFFICULTY[STATE.difficulty];
  const botDelay = Utils.rand(d.botMinDelay, d.roundTime * 1000);
  setTimeout(() => {
    if (!STATE.acceptingInput || !STATE.running) return;
    const correct = Math.random() < d.botCorrectChance;
    if (correct) {
      STATE.botScore++;
      updateScores();
      Snd.beep(200, 0.2, 'sawtooth', 0.1);
      Utils.flash('green');
      STATE.acceptingInput = false;
      if (STATE.roundTimerInterval) clearInterval(STATE.roundTimerInterval);
      setTimeout(nextRound, 1000);
    }
  }, botDelay);
}

function onAnswer(val, btn) {
  if (!STATE.acceptingInput || !STATE.running) return;
  
  if (val === STATE.currentAnswer) {
    STATE.youScore++;
    Snd.ok();
    Utils.flash('green');
    btn.style.background = 'var(--c-foc)';
    btn.style.color = '#000';
    STATE.acceptingInput = false;
    if (STATE.roundTimerInterval) clearInterval(STATE.roundTimerInterval);
    updateScores();
    setTimeout(nextRound, 1000);
  } else {
    Snd.err();
    Utils.flash('red');
    btn.style.background = 'var(--c-rxn)';
    btn.style.color = '#fff';
    setTimeout(() => { btn.style.background = ''; }, 400);
  }
}

function updateScores() {
  const ys = document.getElementById('youScore');
  const bs = document.getElementById('botScore');
  if (ys) ys.textContent = STATE.youScore;
  if (bs) bs.textContent = STATE.botScore;
}

function nextRound() {
  STATE.round++;
  document.getElementById('round').textContent = STATE.round;
  if (STATE.running) startRound();
}

function start() {
  if (STATE.running) return;
  STATE.timer = 300;
  STATE.running = true;
  STATE.youScore = 0;
  STATE.botScore = 0;
  STATE.round = 1;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('difficultyBtn').disabled = true;
  Snd.start();
  startRound();
  
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  STATE.acceptingInput = false;
  if (STATE.roundTimerInterval) clearInterval(STATE.roundTimerInterval);
  clearInterval(STATE.iv);
  Snd.end();
  
  const finalScore = STATE.youScore * 10 + (STATE.youScore > STATE.botScore ? 50 : 0);
  Store.recordResult('duel', finalScore);
  if (window.API && API.token) {
    API.saveResult('duel', finalScore).catch(() => {});
  }
  
  document.getElementById('resScore').textContent = STATE.youScore + ':' + STATE.botScore;
  
  let label, vs;
  if (STATE.youScore > STATE.botScore) {
    label = '🏆 ПОБЕДА!';
    vs = 'Ты разнёс бота <strong>' + STATE.youScore + ':' + STATE.botScore + '</strong>';
  } else if (STATE.youScore === STATE.botScore) {
    label = '🤝 НИЧЬЯ';
    vs = 'Бой равный <strong>' + STATE.youScore + ':' + STATE.botScore + '</strong>';
  } else {
    label = '😔 ПОРАЖЕНИЕ';
    vs = 'Бот сильнее <strong>' + STATE.botScore + ':' + STATE.youScore + '</strong>';
  }
  
  document.getElementById('resLabel').textContent = label;
  document.getElementById('resVs').innerHTML = vs;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.duel;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('difficultyBtn').disabled = false;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('difficultyBtn').addEventListener('click', () => {
  if (STATE.running) return;
  const cycle = { easy: 'medium', medium: 'hard', hard: 'easy' };
  STATE.difficulty = cycle[STATE.difficulty];
  const labels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };
  document.getElementById('difficultyBtn').textContent = 'Сложность: ' + labels[STATE.difficulty];
});

document.getElementById('problem-area').innerHTML = 
  '<div style="text-align:center;padding:40px 20px">' +
    '<div style="font-size:80px;margin-bottom:16px">⚔️</div>' +
    '<h2 style="font-family:var(--font-head);font-size:24px;margin-bottom:8px;color:var(--text-primary)">Дуэль 1-на-1</h2>' +
    '<p style="color:var(--text-secondary);max-width:340px;margin:0 auto;font-size:14px">' +
      'Сразись с ботом в арифметике. Кто первый правильно ответит — тот получает очко.' +
    '</p>' +
  '</div>';

if (!window.matchMedia('(hover: none)').matches) {
  try { Utils.cursor(); } catch (e) {}
}
