// === TAB SWITCHING ===
function switchTab(tabName) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => {
    if (t.dataset.tab === tabName) t.classList.add('active');
  });
  
  const loginPane = document.getElementById('loginPane');
  const registerPane = document.getElementById('registerPane');
  
  if (tabName === 'login') {
    if (loginPane) loginPane.style.display = 'block';
    if (registerPane) registerPane.style.display = 'none';
  } else {
    if (loginPane) loginPane.style.display = 'none';
    if (registerPane) registerPane.style.display = 'block';
  }
}

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// === LOGIN ===
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const err = document.getElementById('loginError');
    if (err) err.textContent = '';
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Войти →';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Входим...';
    }
    
    try {
      await API.login(fd.get('email'), fd.get('password'));
      window.location.href = 'trainer.html';
    } catch (error) {
      if (err) err.textContent = '❌ ' + (error.message || 'Ошибка входа');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
    if (err) err.textContent = '';
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Зарегистрироваться ⚡';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Создаём аккаунт...';
    }
    
    try {
      await API.register(fd.get('name'), fd.get('email'), fd.get('password'));
      window.location.href = 'trainer.html';
    } catch (error) {
      if (err) err.textContent = '❌ ' + (error.message || 'Ошибка регистрации');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

// === IF ALREADY LOGGED IN — REDIRECT ===
try {
  const existingUser = Utils.loadUser();
  if (existingUser) {
    window.location.href = 'trainer.html';
  }
} catch (e) {
  console.error('Auth check failed:', e);
}

// === CURSOR (только desktop) ===
if (!window.matchMedia('(hover: none)').matches) {
  try { Utils.cursor(); } catch (e) {}
}
