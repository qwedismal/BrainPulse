const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300,
  running: false,
  iv: null,
  sequence: [],      // текущая показанная последовательность
  userSequence: [],  // ввод пользователя
  level: 1,
  maxLevel: 1,
  phase: 'idle',     // idle | showing | input | failed
  busy: false        // блокировка ввода во время показа
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

function lightCell(c, duration = 400) {
  return new Promise(resolve => {
    const cell = document.querySelector(`.pat-cell.c${c}`);
    if (!cell) return resolve();
    cell.classList.add('lit');
    Snd.beep(300 + c * 100, 0.25);
    setTimeout(() => {
      cell.classList.remove('lit');
      resolve();
    }, duration);
  });
}

async function showSequence() {
  STATE.busy = true;
  STATE.userSequence = [];
  // Добавляем один новый элемент к последовательности
  STATE.sequence.push(Utils.rand(1, 4));
  
  document.getElementById('patMsg').textContent = 'Смотри и запоминай...';
  document.getElementById('patLvl').textContent = STATE.level;
  
  await new Promise(r => setTimeout(r, 700));
  
  for (let i = 0; i < STATE.sequence.length; i++) {
    await lightCell(STATE.sequence[i], 380);
    await new Promise(r => setTimeout(r, 180));
  }
  
  STATE.busy = false;
  STATE.phase = 'input';
  document.getElementById('patMsg').textContent = `Твоя очередь (${STATE.sequence.length} кликов)`;
}

function onCellClick(c) {
  if (!STATE.running) return;
  if (STATE.busy) return;
  if (STATE.phase !== 'input') return;
  
  // Визуальная обратная связь
  lightCell(c, 200);
  STATE.userSequence.push(c);
  
  const idx = STATE.userSequence.length - 1;
  
  // Проверка текущего клика
  if (STATE.userSequence[idx] !== STATE.sequence[idx]) {
    // Ошибка
    failRound();
    return;
  }
  
  // Проверка завершения
  if (STATE.userSequence.length === STATE.sequence.length) {
    // Уровень пройден
    STATE.phase = 'idle';
    if (STATE.level > STATE.maxLevel) {
      STATE.maxLevel = STATE.level;
      document.getElementById('score').textContent = STATE.maxLevel;
    }
    document.getElementById('patMsg').textContent = 'Верно! Усложняем...';
    Snd.ok();
    Utils.flash('green');
    STATE.level++;
    setTimeout(() => {
      if (STATE.running) showSequence();
    }, 1200);
  }
}

function failRound() {
  STATE.phase = 'failed';
  STATE.busy = true;
  Snd.err();
  Utils.flash('red');
  
  // Подсветить правильный ответ для обучения
  const wrongIdx = STATE.userSequence.length - 1;
  const correctCell = document.querySelector(`.pat-cell.c${STATE.sequence[wrongIdx]}`);
  if (correctCell) {
    correctCell.style.outline = '4px solid #00CC66';
    correctCell.style.outlineOffset = '-4px';
    setTimeout(() => { correctCell.style.outline = ''; }, 1200);
  }
  
  document.getElementById('patMsg').textContent = `Ошибка на уровне ${STATE.level}`;
  document.getElementById('score').textContent = STATE.maxLevel;
  
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
    timer: 300, level: 1, maxLevel: 1, sequence: [], userSequence: [],
    phase: 'idle', busy: false, running: true
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
  STATE.phase = 'idle';
  clearInterval(STATE.iv);
  Snd.end();
  
  Store.recordResult('pattern', STATE.maxLevel);
  if (window.API && API.token) API.saveResult('pattern', STATE.maxLevel).catch(()=>{});
  
  document.getElementById('resScore').textContent = STATE.maxLevel;
  const rating = STATE.maxLevel > 10 ? '⚡ Гений паттернов' :
                 STATE.maxLevel > 6 ? '🎯 Отличная память' :
                 STATE.maxLevel > 3 ? '🧠 Тренируется' : '🌱 Начинающий';
  document.getElementById('resVs').innerHTML = `${rating}. Ты запомнил цепочку из <strong>${STATE.maxLevel}</strong> элементов`;
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

// Инициализация
renderBoard();
Utils.cursor();
