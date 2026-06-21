// === TAB SWITCHING ===
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    const loginPane = document.getElementById('loginPane');
    const registerPane = document.getElementById('registerPane');
    if (loginPane) loginPane.style.display = which === 'login' ? 'block' : 'none';
    if (registerPane) registerPane.style.display = which === 'register' ? 'block' : 'none';
  });
});

// === LOGIN ===
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById('loginError');
    err.textContent = '';
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Входим...';
    }
    
    try {
      await API.login(fd.get('email'), fd.get('password'));
      window.location.href = 'trainer.html';
    } catch (e) {
      err.textContent = '❌ ' + (e.message || 'Ошибка входа');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти →';
      }
    }
  });
}

// === REGISTER ===
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById('registerError');
    err.textContent = '';
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Создаём аккаунт...';
    }
    
    try {
      await API.register(fd.get('name'), fd.get('email'), fd.get('password'));
      window.location.href = 'trainer.html';
    } catch (e) {
      err.textContent = '❌ ' + (e.message || 'Ошибка регистрации');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зарегистрироваться ⚡';
      }
    }
  });
}

// === IF ALREADY LOGGED IN — REDIRECT ===
const existingUser = Utils.loadUser();
if (existingUser) {
  window.location.href = 'trainer.html';
}

// === CURSOR (only desktop) ===
if (!window.matchMedia('(hover: none)').matches) {
  Utils.cursor();
}
