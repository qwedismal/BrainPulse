const data = Store.load(); Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
let mode = 'countdown'; // or 'list'
let timer = 300, score = 0, running = false, iv = null;

document.getElementById('record').textContent = data.records.expander || 0;

let currentNum = 100, step = 7;
let chainItems = [], chainRound = 1, maxChain = 1, inRecallPhase = false, recallList = [];

function genCountdown() {
  document.getElementById('problem-area').innerHTML = `
    <div class="exp-problem"><small>ВЫЧИТАЙ ${step} И ОТМЕЧАЙ ЧЁТНЫЕ</small>${currentNum}</div>
    <input type="number" class="acc-input exp-input" id="numIn" placeholder="?">
    <div class="exp-choices">
      <button class="exp-chip" id="evenBtn">ЧЁТ ✗</button>
    </div>`;
  document.getElementById('numIn').focus();
  document.getElementById('numIn').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = parseInt(e.target.value);
      if (!isNaN(v)) submitCountdown(v);
    }
  });
  document.getElementById('evenBtn').addEventListener('click', () => submitCountdown(null, true));
}

function submitCountdown(v, isEvenClick = false) {
  if (!running) return;
  const expected = currentNum - step;
  if (isEvenClick) {
    if (expected % 2 === 0) { score++; Snd.ok(); Utils.flash('green'); }
    else { Snd.err(); Utils.flash('red'); }
  } else if (v === expected) {
    score++; Snd.ok(); Utils.flash('green');
  } else { Snd.err(); Utils.flash('red'); }
  currentNum = expected;
  document.getElementById('score').textContent = score;
  if (currentNum < 0) { currentNum = 100; step = 7 + Math.floor(score / 10); }
  genCountdown();
}

const products = ['Яблоко', 'Хлеб', 'Молоко', 'Масло', 'Сыр', 'Яйца', 'Курица', 'Рыба', 'Рис', 'Макароны', 'Помидор', 'Огурец', 'Морковь', 'Лук', 'Чеснок', 'Соль', 'Сахар', 'Кофе', 'Чай', 'Шоколад', 'Вода', 'Сок', 'Вино', 'Пиво', 'Печенье', 'Торт', 'Мясо', 'Колбаса', 'Орехи', 'Мёд'];

function genList() {
  inRecallPhase = false;
  chainRound = 1;
  maxChain = 1;
  chainItems = [];
  nextListRound();
}

function nextListRound() {
  const newItem = products[Utils.rand(0, products.length - 1)];
  chainItems.push(newItem);
  document.getElementById('problem-area').innerHTML = `
    <div class="exp-problem"><small>ЗАПОМНИ ЦЕПОЧКУ (${chainItems.length} шт.)</small></div>
    <div class="chain-display">
      ${chainItems.map(i => `<div class="chain-item">${i}</div>`).join('')}
    </div>
    <div style="color:var(--text-muted);margin-top:30px;font-family:var(--font-mono);font-size:13px">Запоминай...</div>`;
  setTimeout(() => {
    if (chainItems.length < 6) {
      chainItems.push(...Utils.shuffle(products.filter(p => !chainItems.includes(p))).slice(0, 1));
      nextListRound();
    } else startRecall();
  }, 1500 + chainItems.length * 400);
}

function startRecall() {
  inRecallPhase = true;
  recallList = [...chainItems];
  document.getElementById('problem-area').innerHTML = `
    <div class="exp-problem"><small>ВОСПРОИЗВЕДИ ПО ПОРЯДКУ</small>${chainItems.length} предметов</div>
    <input type="text" class="acc-input exp-input" id="listIn" placeholder="Введи первый предмет" autocomplete="off">
    <div class="chain-display" id="recalled"></div>`;
  const inp = document.getElementById('listIn');
  inp.focus();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = inp.value.trim();
      const expected = recallList[0];
      if (v.toLowerCase() === expected.toLowerCase()) {
        score += 10; Snd.ok(); Utils.flash('green');
        recallList.shift();
        document.getElementById('recalled').innerHTML += `<div class="chain-item" style="background:var(--c-foc);color:#000">${expected}</div>`;
        inp.value = '';
        if (recallList.length === 0) {
          maxChain = chainItems.length + 1;
          chainItems = [];
          nextListRound();
        }
      } else { Snd.err(); Utils.flash('red'); }
      document.getElementById('score').textContent = score;
    }
  });
}

function start() {
  if (running) return;
  running = true; timer = 300; score = 0;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  Snd.start();
  if (mode === 'countdown') { currentNum = 100; step = 7; genCountdown(); }
  else genList();
  iv = setInterval(() => {
    timer--; document.getElementById('time').textContent = Utils.formatTime(timer);
    if (timer <= 10) { Snd.tick(); }
    if (timer <= 0) finish();
  }, 1000);
}

function finish() {
  running = false; clearInterval(iv); Snd.end();
  Store.recordResult('expander', score);
  document.getElementById('resScore').textContent = score;
  document.getElementById('resVs').innerHTML = `Ты удержал в голове больше, чем <strong>${Math.min(95, 30 + Math.floor(score / 5))}%</strong> людей`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.expander;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => { document.getElementById('resultModal').classList.remove('show'); start(); });
document.getElementById('modeBtn').addEventListener('click', () => {
  mode = mode === 'countdown' ? 'list' : 'countdown';
  document.getElementById('modeBtn').textContent = mode === 'countdown' ? 'Список покупок' : 'Обратный отсчёт';
  if (!running) document.getElementById('problem-area').innerHTML = '<div class="exp-problem" style="opacity:.4">Готов?</div>';
});
Utils.cursor();
