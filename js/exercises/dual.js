const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300, running: false, iv: null,
  score: 0, errors: 0, level: 1,
  currentMath: null, currentTargetLetter: null,
  wordList: [], wordIdx: 0
};

document.getElementById('record').textContent = data.records.dual || 0;

const DISTRACTORS = ['кошка', 'собака', 'стул', 'окно', 'книга', 'лампа', 'часы', 'зеркало', 'дверь', 'стол', 'ручка', 'телефон', 'кружка', 'тарелка', 'ложка'];

function genMath() {
  const a = Utils.rand(2, 9 + STATE.level * 3);
  const b = Utils.rand(2, 9 + STATE.level * 2);
  const isPlus = Math.random() < 0.5;
  const ans = isPlus ? a + b : Math.abs(a - b);
  const op = isPlus ? '+' : '-';
  const opts = [ans];
  while (opts.length < 4) {
    const fake = ans + Utils.rand(-5, 5);
    if (fake !== ans && !opts.includes(fake)) opts.push(fake);
  }
  return { text: `${a} ${op} ${b}`, ans: ans.toString(), options: Utils.shuffle(opts.map(String)) };
}

function genWordList() {
  // Список букв, среди которых есть "target letter"
  const target = String.fromCharCode(65 + Utils.rand(0, 25)); // A-Z
  const list = [target];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (let i = 0; i < 8 + STATE.level; i++) {
    const l = letters[Utils.rand(0, 25)];
    if (!list.includes(l)) list.push(l);
  }
  return { target, list: Utils.shuffle(list) };
}

function render() {
  STATE.currentMath = genMath();
  const wordData = genWordList();
  STATE.currentTargetLetter = wordData.target;
  STATE.wordList = wordData.list;
  
  document.getElementById('problem-area').innerHTML = `
    <div class="dual-grid">
      <div class="dual-task">
        <h4>ЗАДАЧА 1: РЕШИ ПРИМЕР</h4>
        <div class="dual-math">${STATE.currentMath.text} = ?</div>
        <div class="dual-choices">
          ${STATE.currentMath.options.map(o => `<button class="dual-choice" data-val="${o}">${o}</button>`).join('')}
        </div>
      </div>
      <div class="dual-task">
        <h4>ЗАДАЧА 2: КЛИКАЙ НА БУКВУ "${wordData.target}"</h4>
        <div class="dual-words">
          ${wordData.list.map(l => `<button class="dual-word" data-letter="${l}">${l}</button>`).join('')}
        </div>
        <div class="dual-instruction">Не отвлекайся на другие буквы</div>
      </div>
    </div>`;
  
  // Обработчики для задачи 1
  document.querySelectorAll('.dual-choice').forEach(c => {
    c.addEventListener('click', () => {
      if (c.dataset.val === STATE.currentMath.ans) {
        c.classList.add('correct');
        STATE.score++;
        Snd.ok();
        setTimeout(() => { if (STATE.running) render(); }, 600);
      } else {
        c.classList.add('wrong');
        STATE.errors++;
        Snd.err();
        Utils.flash('red');
        document.getElementById('errors').textContent = STATE.errors;
        setTimeout(() => c.classList.remove('wrong'), 500);
      }
      document.getElementById('score').textContent = STATE.score;
      if (STATE.score > 0 && STATE.score % 8 === 0) {
        STATE.level++;
      }
    });
  });
  
  // Обработчики для задачи 2
  document.querySelectorAll('.dual-word').forEach(w => {
    w.addEventListener('click', () => {
      if (w.dataset.letter === STATE.currentTargetLetter) {
        w.classList.add('highlighted');
        STATE.score += 2; // бонус за сложную задачу
        Snd.ok();
        Utils.flash('green');
        document.getElementById('score').textContent = STATE.score;
        setTimeout(() => { if (STATE.running) render(); }, 500);
      } else {
        STATE.errors++;
        Snd.err();
        Utils.flash('red');
        document.getElementById('errors').textContent = STATE.errors;
      }
    });
  });
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0, errors: 0, level: 1 });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('score').textContent = '0';
  document.getElementById('errors').textContent = '0';
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
  const final = Math.max(0, STATE.score - STATE.errors * 2);
  Store.recordResult('dual', final);
  if (window.API && API.token) API.saveResult('dual', final).catch(()=>{});
  document.getElementById('resScore').textContent = final;
  const accuracy = STATE.score > 0 ? Math.round((1 - STATE.errors / (STATE.score + STATE.errors)) * 100) : 0;
  document.getElementById('resVs').innerHTML = `Точность: <strong>${accuracy}%</strong>. ${accuracy > 80 ? 'Ты жонглёр задачами!' : accuracy > 60 ? 'Хороший фокус' : 'Нужно больше тренировок'}`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.dual;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🎯</div>';
Utils.cursor();
