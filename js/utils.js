const Utils = {
  $: (s, c = document) => c.querySelector(s),
  $$: (s, c = document) => [...c.querySelectorAll(s)],
  rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  shuffle: arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  formatTime: s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`,
  flash: (type = 'green') => {
    let f = document.querySelector('.flash');
    if (!f) { f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); }
    f.className = `flash ${type} show`;
    setTimeout(() => f.classList.remove('show'), 200);
  },
  haptic: () => { if (navigator.vibrate) navigator.vibrate(20); },
  reveal: () => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  },
  cursor: () => {
    if (window.matchMedia('(hover: none)').matches) return;
    const c = document.createElement('div'); c.className = 'cursor'; document.body.appendChild(c);
    const f = document.createElement('div'); f.className = 'cursor-follower'; document.body.appendChild(f);
    let mx = 0, my = 0, fx = 0, fy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; c.style.transform = `translate(${mx-4}px, ${my-4}px)`; });
    const loop = () => { fx += (mx - fx) * 0.18; fy += (my - fy) * 0.18; f.style.transform = `translate(${fx-18}px, ${fy-18}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('button, a, .b-card, .mode-btn, .ach, summary');
      if (t) { c.classList.add('hover'); f.classList.add('hover'); }
      else { c.classList.remove('hover'); f.classList.remove('hover'); }
    });
  }
};
window.Utils = Utils;
document.addEventListener('DOMContentLoaded', Utils.reveal);
