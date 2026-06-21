const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
const STATE = { timer: 300, running: false, iv: null, score: 0, totalQ: 0, currentScene: [], currentQuestions: [] };
document.getElementById('record').textContent = data.records.grip || 0;

const objects = [
  { name: 'Чашка', emoji: '☕', details: ['белая керамическая', 'синяя', 'красная', 'чёрная'] },
  { name: 'Ручка', emoji: '✒', details: ['чёрная гелевая', 'синяя', 'красная', 'золотая'] },
  { name: 'Телефон', emoji: '📱', details: ['iPhone чёрный', 'Samsung', 'Nokia', 'Xiaomi'] },
  { name: 'Книга', emoji: '📖', details: ['толстая красная', 'тонкая', 'с закладкой', 'словарь'] },
  { name: 'Очки', emoji: '👓', details: ['чёрные', 'золотые', 'солнечные', 'круглые'] },
  { name: 'Часы', emoji: '⌚', details: ['золотые', 'Apple Watch', 'кожаные', 'спортивные'] }
];

function genScene() {
  const items = Utils.shuffle(objects).slice(0, 5);
  const positions = [{l:5,t:15},{l:65,t:10},{l:15,t:60},{l:55,t:55},{l:35,t:35}];
  let html = '<div class="grip-scene">';
  items.forEach((it, i) => {
    const det = it.details[Utils.rand(0, it.details.length - 1)];
    html += `<div class="grip-obj" style="left:${positions[i].l}%;top:${positions[i].t}%"><div style="font-size:42px">${it.emoji}</div><div>${det}</div></div>`;
  });
  html += '</div>';
  STATE.currentScene = items.map((it, i) => ({ ...it, detail: it.details.find(d => html.includes(d)) }));
  return html;
}

function genQuestions() {
  const qs = [];
  STATE.currentScene.forEach(it => {
    const correct = it.detail;
    const others = Utils.shuffle(objects.filter(o => o.name !== it.name).map(o => o.details[0])).slice(0, 3);
    qs.push({ q: `Какой был "${it.name}"?`, correct, options: Utils.shuffle([correct, ...others]) });
  });
  return qs;
}

function showScene() {
  document.getElementById('problem-area').innerHTML = `<div class="grip-question">Запомни 5 предметов и их детали (15 сек)</div>${genScene()}`;
  setTimeout(() => askQuestions(), 15000);
}

function askQuestions() {
  if (!STATE.running) return;
  STATE.currentQuestions = genQuestions();
  askOne(0);
}

function askOne(idx) {
  if (idx >= STATE.currentQuestions.length || !STATE.running) { finish(); return; }
  const q = STATE.currentQuestions[idx];
  document.getElementById('problem-area').innerHTML = `
    <div class="grip-question">${q.q}</div>
    <div class="grip-options">
      ${q.options.map(o => `<button class="grip-opt" data-v="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('')}
    </div>
    <div style="margin-top:14px;color:var(--text-muted);font-family:var(--font-mono);font-size:12px">Вопрос ${idx+1}/${q.length}</div>`;
  document.querySelectorAll('.grip-opt').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.v === q.correct) { STATE.score++; Snd.ok(); Utils.flash('green'); }
    else { Snd.err(); Utils.flash('red'); }
    STATE.totalQ++;
    document.getElementById('score').textContent = STATE.score;
    askOne(idx + 1);
  }));
}

function start() {
  if (STATE.running) return;
  Object.assign(STATE, { timer: 300, running: true, score: 0, totalQ: 0 });
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  Snd.start();
  showScene();
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
  const pct = STATE.totalQ > 0 ? Math.round((STATE.score / STATE.totalQ) * 100) : 0;
  Store.recordResult('grip', pct);
  if (window.API && API.token) API.saveResult('grip', pct).catch(()=>{});
  document.getElementById('resScore').textContent = pct;
  document.getElementById('resVs').innerHTML = `Вспомнил <strong>${pct}%</strong> деталей`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.grip;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});
document.getElementById('problem-area').innerHTML = '<div style="font-family:var(--font-head);font-size:80px;font-weight:900;color:var(--text-muted)">🔒</div>';
Utils.cursor();
