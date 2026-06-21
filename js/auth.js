if (!window.matchMedia('(hover: none)').matches) Utils.cursor();

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    document.getElementById('loginPane').style.display = which === 'login' ? 'block' : 'none';
    document.getElementById('registerPane').style.display = which === 'register' ? 'block' : 'none';
  });
});

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const err = document.getElementById('loginError');
  err.textContent = '';
  try {
    await API.login(fd.get('email'), fd.get('password'));
    window.location.href = 'trainer.html';
  } catch (e) {
    err.textContent = '❌ ' + (e.message || 'Ошибка входа');
  }
});

document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const err = document.getElementById('registerError');
  err.textContent = '';
  try {
    await API.register(fd.get('name'), fd.get('email'), fd.get('password'));
    window.location.href = 'trainer.html';
  } catch (e) {
    err.textContent = '❌ ' + (e.message || 'Ошибка регистрации');
  }
});

const user = Utils.loadUser();
if (user) window.location.href = 'trainer.html';
