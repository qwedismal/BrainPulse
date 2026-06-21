Utils.cursor();
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30));
// Live counter
let n = 12847;
setInterval(() => { n += Math.random() < 0.5 ? 1 : 0; const el = document.getElementById('liveCount'); if (el) el.textContent = n.toLocaleString(); }, 4000);
