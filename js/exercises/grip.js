const data = Store.load(); Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);
let timer = 300, score = 0, totalQ = 0, running = false, iv = null;
let currentScene = [], currentQuestions = [], phase = 'show';

document.getElementById('record').textContent = data.records.grip || 0;

const objects = [
  { name: 'Чашка', emoji: '☕', details: ['белая керамическая', 'синяя с цветочком', 'красная большая', 'чёрная маленькая', 'с золотым ободком'] },
  { name: 'Ручка', emoji: '✒', details: ['чёрная гелевая', 'синяя шариковая', 'красная с колпачком', 'золотая перьевая', 'зелёная автоматическая'] },
  { name: 'Телефон', emoji: '📱', details: ['iPhone в чёрном чехле', 'Samsung с разбитым экраном', 'старый кнопочный Nokia', 'Xiaomi в розовом чехле', 'iPhone в прозрачном чехле'] },
  { name: 'Книга', emoji: '📖', details: ['толстая красная', 'тонкая в мягкой обложке', 'с закладкой', 'английская словарь', 'Донцова в мягкой'] },
  { name: 'Очки', emoji: '👓', details: ['чёрные квадратные', 'круглые в золотой оправе', 'солнцезащитные', 'с цепочкой', 'розовые детские'] },
  { name: 'Часы', emoji: '⌚', details: ['золотые наручные', 'Apple Watch чёрные', 'с кожаным ремешком', 'с браслетом', 'большие спортивные'] },
  { name: 'Ключи', emoji: '🔑', details: ['связка из 3 штук', 'с брелком машины', 'с красным флажком', 'серебряные', 'с биркой'] },
  { name: 'Кошелёк', emoji: '👛', details: ['коричневый кожаный', 'чёрный маленький', 'с монетами внутри', 'с картой', 'Lady Gaga розовый'] },
  { name: 'Зонт', emoji: '☂', details: ['чёрный большой', 'красный складной', 'с деревянной ручкой', 'прозрачный', 'в горошек'] },
  { name: 'Шарф', emoji: '🧣', details: ['красный вязаный', 'белый кашемировый', 'серый длинный', 'с узором', 'розовый шерстяной'] },
  { name: 'Шапка', emoji: '🧢', details: ['чёрная бейсболка', 'серая вязаная', 'красная с помпоном', 'ушанка', 'берет'] },
  { name: 'Перчатки', emoji: '🧤', details: ['кожаные чёрные', 'белые хлопковые', 'красные шерстяные', 'с мехом', 'розовые детские'] },
  { name: 'Бутылка', emoji: '🍾', details: ['зелёная стеклянная', 'пластиковая вода', 'с вином', 'с молоком', 'с лимонадом'] },
  { name: 'Нож', emoji: '🔪', details: ['кухонный большой', 'перочинный', 'с чёрной ручкой', 'серебряный', 'с деревянной ручкой'] },
  { name: 'Тарелка', emoji: '🍽', details: ['белая керамическая', 'с цветочками', 'глубокая', 'деревянная', 'чёрная матовая'] }
];

function genScene() {
  const items = Utils.shuffle(objects).slice(0, 5);
  const positions = [{l:5,t:15},{l:65,t:10},{l:15,t:60},{l:55,t:55},{l:35,t:35}];
  let html = '<div class="grip-scene">';
  items.forEach((it, i) => {
    const det = it.details[Utils.rand(0, it.details.length - 1)];
    html += `<div class="grip-obj" style="left:${positions[i].l}%;top:${positions[i].t}%">
      <div style="font-size:48px">${it.emoji}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;font-family:var(--font-mono)">${det}</div>
    </div>`;
  });
  html += '</div>';
  currentScene = items.map((it, i) => ({ ...it, detail: it.details.find(d => html.includes(d)) }));
  return html;
}

function genQuestions() {
  const qs = [];
  currentScene.forEach(it => {
    const correct = it.detail;
    const others = Utils.shuffle(objects.filter(o => o.name !== it.name).map(o => o.details[0])).slice(0, 3);
    qs.push({ q: `Какой был предмет "${it.name}"?`, correct, options: Utils.shuffle([correct, ...others]) });
  });
  qs.push({ q: 'Сколько предметов было на столе?', correct: '5', options: ['3', '5', '7', '10'] });
  return qs;
}

function showScene() {
  phase = 'show';
  document.getElementById('problem-area').innerHTML = `
    <div class="grip-question">Запомни 5 предметов и их детали (30 сек)</div>
    ${genScene()}`;
  setTimeout(() => askQuestions(), 30000);
}

function askQuestions() {
  if (!running) return;
  phase = 'q';
  currentQuestions = genQuestions();
  askOne(0);
}

function askOne(idx) {
  if (idx >= currentQuestions.length || !running) { finish(); return; }
  const q = currentQuestions[idx];
  document.getElementById('problem-area').innerHTML = `
    <div class="grip-question">${q.q}</div>
    <div class="grip-options">
      ${q.options.map(o => `<button class="grip-opt" data-v="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('')}
    </div>
    <div style="margin-top:20px;color:var(--text-muted);font-family:var(--font-mono);font-size:13px">Вопрос ${idx+1} из ${currentQuestions.length}</div>`;
  document.querySelectorAll('.grip-opt').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.v === q.correct) { score++; Snd.ok(); Utils.flash('green'); }
    else { Snd.err(); Utils.flash('red'); }
    totalQ++;
    document.getElementById('score').textContent = score;
    askOne(idx + 1);
  }));
}

function start() {
  if (running) return;
  running = true; timer = 300; score = 0; totalQ = 0;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  Snd.start();
  showScene();
  iv = setInterval(() => {
    timer--; document.getElementById('time').textContent = Utils.formatTime(timer);
    if (timer <= 10) Snd.tick();
    if (timer <= 0) finish();
  }, 1000);
}

function finish() {
  running = false; clearInterval(iv); Snd.end();
  const pct = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
  Store.recordResult('grip', pct);
  document.getElementById('resScore').textContent = pct;
  document.getElementById('resVs').innerHTML = `Ты вспомнил <strong>${pct}%</strong> деталей. Это уровень <strong>${pct > 70 ? 'детектива' : pct > 40 ? 'наблюдателя' : 'сонной мухи'}</strong>`;
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.grip;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => { document.getElementById('resultModal').classList.remove('show'); start(); });
Utils.cursor();
