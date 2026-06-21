Utils.cursor();

const EX_LABELS = {
  total: { name: 'Общий счёт', emoji: '🏆' },
  accelerator: { name: 'Ускоритель', emoji: '⚡' },
  expander: { name: 'Расширитель', emoji: '🧠' },
  focus: { name: 'Фокус', emoji: '🎯' },
  grip: { name: 'Цепкость', emoji: '🔒' },
  reaction: { name: 'Реакция', emoji: '💥' },
  pattern: { name: 'Паттерн', emoji: '🧬' },
  mirror: { name: 'Зеркало', emoji: '🪞' },
  dual: { name: 'Двойная задача', emoji: '🎯' },
  nback: { name: 'N-Back', emoji: '🧠' },
  sort: { name: 'Сортировка', emoji: '📦' }
};

let currentEx = 'total';

async function loadLeaderboard(ex) {
  currentEx = ex;
  const list = document.getElementById('lbList');
  list.innerHTML = '<div class="lb-loading">Загрузка...</div>';
  
  try {
    const data = await API.getLeaderboard(ex);
    renderLeaderboard(data);
    renderMyStats(ex);
  } catch (e) {
    list.innerHTML = `<div class="lb-empty">⚠️ Не удалось загрузить лидерборд<br><br>Запустите локальный сервер: <code>npm start</code></div>`;
  }
}

function renderLeaderboard(data) {
  const list = document.getElementById('lbList');
  if (!data || data.length === 0) {
    list.innerHTML = '<div class="lb-empty">Пока никого нет. Будь первым!</div>';
    return;
  }
  
  const myId = localStorage.getItem('bp_user_id');
  const medals = ['🥇', '🥈', '🥉'];
  
  list.innerHTML = data.map((u, i) => {
    const rank = i + 1;
    const isMe = u.id === myId;
    const topClass = rank <= 3 ? `top-${rank}` : '';
    const medal = rank <= 3 ? `<span class="lb-rank medal">${medals[i]}</span>` : `<span class="lb-rank">${rank}</span>`;
    return `
      <div class="lb-row ${topClass} ${isMe ? 'me' : ''}">
        ${medal}
        <div class="lb-user">
          <div class="lb-avatar" style="background:${u.color || 'linear-gradient(135deg,var(--c-acc),var(--c-exp))'}">${(u.name || 'А')[0].toUpperCase()}</div>
          <div>
            <div class="lb-username">${u.name || 'Аноним'}${isMe ? ' (ты)' : ''}</div>
            <div class="lb-meta">Уровень ${u.level || 0} · ${u.trainings || 0} тренировок</div>
          </div>
        </div>
        <div class="lb-ex">${EX_LABELS[currentEx].name}</div>
        <div class="lb-score">${u.score}</div>
      </div>`;
  }).join('');
}

async function renderMyStats(ex) {
  const statsEl = document.getElementById('myStats');
  const user = API.getUser();
  if (!user) {
    statsEl.innerHTML = '<div class="lb-stat-card" style="grid-column:1/-1"><h4>Войди чтобы видеть свою позицию</h4><a href="auth.html" class="btn btn-primary" style="margin-top:12px">Войти →</a></div>';
    return;
  }
  
  try {
    const stats = await API.getMyStats(ex);
    statsEl.innerHTML = `
      <div class="lb-stat-card">
        <h4>Твоя позиция</h4>
        <div class="val">#${stats.rank || '—'}</div>
      </div>
      <div class="lb-stat-card">
        <h4>Твой рекорд</h4>
        <div class="val">${stats.bestScore || 0}</div>
      </div>
      <div class="lb-stat-card">
        <h4>Тренировок</h4>
        <div class="val">${stats.totalTrainings || 0}</div>
      </div>
      <div class="lb-stat-card">
        <h4>Уровень мозга</h4>
        <div class="val">${stats.level || 0}%</div>
      </div>`;
  } catch (e) {
    statsEl.innerHTML = '';
  }
}

document.querySelectorAll('.lb-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadLeaderboard(tab.dataset.ex);
  });
});

// Auth button
API.getUser().then(user => {
  const btn = document.getElementById('authBtn');
  if (user) btn.textContent = user.name + ' →';
});

loadLeaderboard('total');
setInterval(() => loadLeaderboard(currentEx), 60000);
