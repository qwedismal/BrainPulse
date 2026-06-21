const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300, running: false, iv: null,
  sequence: [], userSequence: [],
  level: 1, maxLevel: 1,
  busy: false
};

document.getElementById('record').textContent = data.records.pattern || 0;

function renderBoard() {
  const area = document.getElementById('problem-area');
  area.innerHTML = '<div class="pat-board">' +
    [1,2,3,4].map(i => `<div class="pat-cell c${i}" data-c="${i}"></div>`).join('') +
    '</div>';
  area.querySelectorAll('.pat-cell').forEach(c => {
    c.addEventListener('click', () => onCellClick(parseInt(c.dataset.c)));
  });
}

async function lightCell(c, duration = 400) {
  const cell = document.querySelector(`.pat-cell.c${c}`);
  if (!cell) return;
  cell.classList.add('lit');
  Snd.beep(300 + c * 100, 0.3);
  await new Promise(r => setTimeout(() => {
    cell.classList.remove('lit');
    r();
  }, duration));
}

async function showSequence() {
  STATE.busy = true;
  STATE.userSequence = [];
  STATE.sequence.push(Utils.rand(1, 4));
  
  document.getElementById('patMsg').textContent = 'Смотри и запоминай...';
  document.getElementById('patLvl').textContent = STATE.level;
  
  await new Promise(r => setTimeout(r, 700));
  
  for (let i = 0; i < STATE.sequence.length; i++) {
    await lightCell(STATE.sequence[i], 380);
    await new Promise(r => setTimeout(r, 180));
  }
  
  STATE.busy = false;
  document.getElementById('patMsg').textContent = `Твоя очередь (${STATE.sequence.length} кликов)`;
}

function onCellClick(c) {
  if (!STATE.running || STATE.busy) return;
  
  lightCell(c, 200);
  STATE.userSequence.push(c);
  
  const idx = STATE.userSequence.length - 1;
  
  if (STATE.userSequence[idx] !== STATE.sequence[idx]) {
    failRound();
    return;
  }
  
  if (STATE.userSequence.length === STATE.sequence.length) {
    STATE.busy = true;
    if (STATE.level > STATE.maxLevel) {
      STATE.maxLevel = STATE.level;
      document.getElementById('score').textContent = STATE.maxLevel;
    }
    document.getElementById('patMsg').textContent = 'Верно! Следующий уровень...';
    Snd.ok();
    Utils.flash('green');
    STATE.level++;
    setTimeout(() => {
      if (STATE.running) showSequence();
    }, 1200);
  }
}

function failRound() {
  STATE.busy = true;
  Snd.err();
  Utils.flash('red');
  document.getElementById('patMsg').textContent = `Ошибка на уровне ${STATE.level}!`;
  
  setTimeout(() => {
    STATE.level = 1;
    STATE.sequence = [];
    STATE.userSequence = [];
    STATE.busy = false;
    document.getElementById('patLvl').textContent = '1';
    if (STATE.running) showSequence();
  }, 1800);
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, {
    timer: 300, running: true, sequence: [], userSequence: [],
    level: 1, maxLevel: 1, busy: false
  });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('score').textContent = '0';
  document.getElementById('patLvl').textContent = '1';
  Snd.start();
  renderBoard();
  showSequence();
  
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  STATE.busy = true;
  clearInterval(STATE.iv);
  Snd.end();
  
  Store.recordResult('pattern', STATE.maxLevel);
  if (window.API && API.token) API.saveResult('pattern', STATE.maxLevel).catch(()=>{});
  
  document.getElementById('resScore').textContent = STATE.maxLevel;
  document.getElementById('resVs').innerHTML = `Запомнил цепочку из <strong>${STATE.maxLevel}</strong> элементов`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.pattern;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});

renderBoard();
document.getElementById('problem-area').insertAdjacentHTML('afterend', '');
Utils.cursor();
