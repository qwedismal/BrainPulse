// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// Live counter
let n = 12847;
setInterval(() => {
  n += Math.random() < 0.5 ? 1 : 0;
  const el = document.getElementById('liveCount');
  if (el) el.textContent = n.toLocaleString();
}, 4000);

// Cursor
if (!window.matchMedia('(hover: none)').matches) {
  Utils.cursor();
}

// Magnetic buttons (desktop only)
if (!window.matchMedia('(hover: none)').matches) {
  document.querySelectorAll('.btn-primary, .b-card').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// Reveal observer
document.addEventListener('DOMContentLoaded', Utils.reveal);
