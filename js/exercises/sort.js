const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STATE = { timer: 300, running: false, iv: null, score: 0, errors: 0, currentItem: null, currentCategory: 0 };
document.getElementById('record').textContent = data.records.sort || 0;

const CATS = {
  1: { emoji: '🍎', items: ['🍎','🍊','🍋','🍇','🍓','🍑','🥝'] },
  2: { emoji: '⚽', items: ['⚽','🏀','🎾','🏈','⚾','🏐','🎱'] },
  3: { emoji: '🚗', items: ['🚗','🚌','🚎','🏎','🚓','🚑','🚒'] },
  4: { emoji: '🐶', items: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼'] }
};

function pickItem() {
  const cat = Utils.rand(1, 4);
  return { emoji: CATS[cat].items[Utils.rand(0, CATS[cat].items.length - 1)], category: cat };
}

function render() {
  STATE.currentItem = pickItem();
  STATE.currentCategory = STATE.currentItem.category;
  document.getElementById('problem-area').innerHTML = `
    <div class="sort-board">
      <div class="sort-target zone-1" data-zone="1"><span class="sort-zone-label">ФРУКТЫ</span>${CATS[1].emoji}</div>
      <div class="sort-target zone-2" data-zone="2"><span class="sort-zone-label">СПОРТ</span>${CATS[2].emoji}</div>
      <div class="sort-target zone-3" data-zone="3"><span class="sort-zone-label">ТРАНСПОРТ</span>${CATS[3].emoji}</div>
      <div class="sort-target zone-4" data-zone="4"><span class="sort-zone-label">ЖИВОТНЫЕ</span>${CATS[4].emoji}</div>
      <div class="sort-item" id="sortItem" style="left:50%;top:50%;transform:translate(-50%,-50%)">${STATE.currentItem.emoji}</div>
    </div>
    <div class="sort-hint">Кликни по правильной зоне</div>`;
  document.querySelectorAll('.sort-target').forEach(z => {
    z.addEventListener('click', () => submit(parseInt(z.dataset.zone)));
  });
}

function submit(zone) {
  if (!STATE.running) return;
  if (zone === STATE.currentCategory) {
    STATE.score++;
    Snd.ok();
    Utils.flash('green');
  } else {
    STATE.errors++;
    Snd.err();
    Utils.flash('red');
  }
  document.getElementById('score').textContent = STATE.score;
  if (STATE.running) setTimeout(render, 300);
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0, errors: 0 });
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
  const final = Math.max(0, STATE.score - STATE.errors);
  Store.recordResult('sort', final);
  if (window.API && API.token) API.saveResult('sort', final).catch(()=>{});
  document.getElementById('resScore').textContent = final;
  document.getElementById('resVs').innerHTML = `Рассортировал: <strong>${final}</strong>, ошибок: ${STATE.errors}`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.sort;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">📦</div>';
Utils.cursor();
