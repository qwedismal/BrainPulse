if (!window.matchMedia('(hover: none)').matches) Utils.cursor();

const EX_LABELS = {
  total: 'Общий', accelerator: '⚡', expander: '🧠', focus: '🎯',
  grip: '🔒', reaction: '💥', pattern: '🧬', nback: 'N', chess: '♟️'
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
    list.innerHTML = `<div class="lb-empty">⚠️ Не удалось загрузить<br><br><small>Запусти локальный сервер или зарегистрируйся</small></div>`;
  }
}

function renderLeaderboard(data) {
  const list = document.getElementById('lbList');
  if (!data || data.length === 0) {
    list.innerHTML = '<div class="lb-empty">Пока никого. Будь первым!</div>';
    return;
  }
  
  const myId = localStorage.getItem('bp_user_id') || (Utils.loadUser() && Utils.loadUser().id);
  const medals = ['🥇', '🥈', '🥉'];
  
  list.innerHTML = data.map((u, i) => {
    const rank = i + 1;
    const isMe = u.id === myId;
    const topClass = rank <= 3 ? `top-${rank}` : '';
    return `
      <div class="lb-row ${topClass} ${isMe ? 'me' : ''}">
        <div class="lb-rank">${rank <= 3 ? medals[i] : rank}</div>
        <div class="lb-user">
          <div class="lb-avatar" style="background:${u.color || 'linear-gradient(135deg,var(--c-acc),var(--c-exp))'}">${(u.name || 'А')[0].toUpperCase()}</div>
          <div class="lb-info">
            <div class="lb-username">${u.name || 'Аноним'}${isMe ? ' (ты)' : ''}</div>
            <div class="lb-meta">Ур. ${u.level || 0} · ${u.total_trainings || 0} тр.</div>
          </div>
        </div>
        <div class="lb-score">${u.score}</div>
      </div>`;
  }).join('');
}

async function renderMyStats(ex) {
  const statsEl = document.getElementById('myStats');
  const user = Utils.loadUser();
  if (!user) {
    statsEl.innerHTML = '<div class="lb-stat-card" style="grid-column:1/-1"><h4>Войди чтобы видеть свою позицию</h4><a href="auth.html" class="btn btn-primary" style="margin-top:8px;padding:10px 16px;font-size:13px">Войти</a></div>';
    return;
  }
  try {
    const stats = await API.getMyStats(ex);
    statsEl.innerHTML = `
      <div class="lb-stat-card"><h4>Позиция</h4><div class="val">#${stats.rank || '—'}</div></div>
      <div class="lb-stat-card"><h4>Рекорд</h4><div class="val">${stats.bestScore || 0}</div></div>
      <div class="lb-stat-card"><h4>Тренировок</h4><div class="val">${stats.totalTrainings || 0}</div></div>
    `;
  } catch (e) { statsEl.innerHTML = ''; }
}

document.querySelectorAll('.lb-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadLeaderboard(tab.dataset.ex);
  });
});

(async () => {
  const user = Utils.loadUser();
  const btn = document.getElementById('navAuthBtn');
  const link = document.getElementById('authLink');
  if (user) {
    if (btn) btn.textContent = user.name.split(' ')[0];
    if (link) link.textContent = 'Кабинет';
  }
  await loadLeaderboard('total');
})();

setInterval(() => loadLeaderboard(currentEx), 60000);
