const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const STATE = {
  timer: 300, running: false, iv: null,
  score: 0, level: 1, errors: 0,
  currentItem: null, currentCategory: 0,
  dragging: false, dragOffset: { x: 0, y: 0 }
};

document.getElementById('record').textContent = data.records.sort || 0;

const CATEGORIES = {
  1: { emoji: '🍎', items: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝'] },
  2: { emoji: '⚽', items: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐', '🎱', '🏓'] },
  3: { emoji: '🚗', items: ['🚗', '🚕', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒'] },
  4: { emoji: '🐶', items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'] }
};

function pickItem() {
  const cat = Utils.rand(1, 4);
  const items = CATEGORIES[cat].items;
  return { emoji: items[Utils.rand(0, items.length - 1)], category: cat };
}

function render() {
  STATE.currentItem = pickItem();
  STATE.currentCategory = STATE.currentItem.category;
  
  document.getElementById('problem-area').innerHTML = `
    <div class="sort-board" id="sortBoard">
      <div class="sort-target zone-1" data-zone="1"><span class="sort-zone-label">ФРУКТЫ</span>${CATEGORIES[1].emoji}</div>
      <div class="sort-target zone-2" data-zone="2"><span class="sort-zone-label">СПОРТ</span>${CATEGORIES[2].emoji}</div>
      <div class="sort-target zone-3" data-zone="3"><span class="sort-zone-label">ТРАНСПОРТ</span>${CATEGORIES[3].emoji}</div>
      <div class="sort-target zone-4" data-zone="4"><span class="sort-zone-label">ЖИВОТНЫЕ</span>${CATEGORIES[4].emoji}</div>
      <div class="sort-item" id="sortItem" style="left:50%;top:50%;transform:translate(-50%,-50%)">${STATE.currentItem.emoji}</div>
    </div>
    <div class="sort-hint">Перетащи предмет в правильную зону (или кликни по зоне)</div>`;
  
  // Drag для десктопа
  const item = document.getElementById('sortItem');
  item.addEventListener('mousedown', startDrag);
  item.addEventListener('touchstart', startDragTouch, { passive: false });
  
  // Клик по зоне (мобильный/быстрый режим)
  document.querySelectorAll('.sort-target').forEach(z => {
    z.addEventListener('click', () => {
      if (STATE.dragging) return;
      const zCat = parseInt(z.dataset.zone);
      submit(zCat);
    });
  });
}

function startDrag(e) {
  e.preventDefault();
  STATE.dragging = true;
  const item = document.getElementById('sortItem');
  const rect = item.getBoundingClientRect();
  STATE.dragOffset.x = e.clientX - rect.left;
  STATE.dragOffset.y = e.clientY - rect.top;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
}

function startDragTouch(e) {
  e.preventDefault();
  STATE.dragging = true;
  const t = e.touches[0];
  const item = document.getElementById('sortItem');
  const rect = item.getBoundingClientRect();
  STATE.dragOffset.x = t.clientX - rect.left;
  STATE.dragOffset.y = t.clientY - rect.top;
  document.addEventListener('touchmove', onDragTouch, { passive: false });
  document.addEventListener('touchend', endDrag);
}

function onDrag(e) {
  const item = document.getElementById('sortItem');
  const board = document.getElementById('sortBoard');
  const boardRect = board.getBoundingClientRect();
  const x = e.clientX - boardRect.left - STATE.dragOffset.x;
  const y = e.clientY - boardRect.top - STATE.dragOffset.y;
  item.style.left = (x / boardRect.width * 100) + '%';
  item.style.top = (y / boardRect.height * 100) + '%';
  item.style.transform = 'none';
  checkHover(e.clientX, e.clientY);
}

function onDragTouch(e) {
  e.preventDefault();
  const t = e.touches[0];
  const item = document.getElementById('sortItem');
  const board = document.getElementById('sortBoard');
  const boardRect = board.getBoundingClientRect();
  const x = t.clientX - boardRect.left - STATE.dragOffset.x;
  const y = t.clientY - boardRect.top - STATE.dragOffset.y;
  item.style.left = (x / boardRect.width * 100) + '%';
  item.style.top = (y / boardRect.height * 100) + '%';
  item.style.transform = 'none';
  checkHover(t.clientX, t.clientY);
}

function checkHover(x, y) {
  document.querySelectorAll('.sort-target').forEach(z => z.classList.remove('highlight'));
  document.querySelectorAll('.sort-target').forEach(z => {
    const r = z.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      z.classList.add('highlight');
    }
  });
}

function endDrag(e) {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDragTouch);
  document.removeEventListener('touchend', endDrag);
  
  // Определяем зону
  let x, y;
  if (e.changedTouches) {
    x = e.changedTouches[0].clientX;
    y = e.changedTouches[0].clientY;
  } else {
    x = e.clientX; y = e.clientY;
  }
  
  let matchedZone = null;
  document.querySelectorAll('.sort-target').forEach(z => {
    const r = z.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      matchedZone = parseInt(z.dataset.zone);
    }
    z.classList.remove('highlight');
  });
  
  if (matchedZone) submit(matchedZone);
  STATE.dragging = false;
}

function submit(zone) {
  if (!STATE.running) return;
  if (zone === STATE.currentCategory) {
    STATE.score++;
    Snd.ok();
    Utils.flash('green');
    if (STATE.score > 0 && STATE.score % 10 === 0) {
      STATE.level++;
      document.getElementById('lvl').textContent = STATE.level;
    }
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
  Object.assign(STATE, { timer: 300, running: true, score: 0, errors: 0, level: 1, dragging: false });
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
  document.getElementById('resVs').innerHTML = `Ты рассортировал <strong>${final}</strong> предметов с ${STATE.errors} ошибками. ${STATE.errors < 3 ? '🎯 Отличная категоризация!' : '👌 Неплохо!'}`;
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
