Utils.cursor();

// Tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    document.getElementById('loginPane').style.display = which === 'login' ? 'block' : 'none';
    document.getElementById('registerPane').style.display = which === 'register' ? 'block' : 'none';
  });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const err = document.getElementById('loginError');
  err.textContent = '';
  
  try {
    const result = await API.login(fd.get('email'), fd.get('password'));
    localStorage.setItem('bp_user_id', result.user.id);
    localStorage.setItem('bp_token', result.token);
    window.location.href = 'trainer.html';
  } catch (e) {
    err.textContent = '❌ ' + (e.message || 'Неверный email или пароль');
  }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const err = document.getElementById('registerError');
  err.textContent = '';
  
  try {
    const result = await API.register(fd.get('name'), fd.get('email'), fd.get('password'));
    localStorage.setItem('bp_user_id', result.user.id);
    localStorage.setItem('bp_token', result.token);
    window.location.href = 'trainer.html';
  } catch (e) {
    err.textContent = '❌ ' + (e.message || 'Ошибка регистрации');
  }
});

// Если уже залогинен — редирект
API.getUser().then(user => {
  if (user) window.location.href = 'trainer.html';
});
