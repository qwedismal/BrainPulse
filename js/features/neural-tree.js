const NeuralTree = {
  render(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);
    
    // Center brain node
    const cx = W / 2;
    const cy = H / 2;
    
    // Nodes = exercise sessions
    const exercises = ['accelerator','expander','focus','grip','reaction','pattern','nback','sort','chess','mirror'];
    const nodes = [];
    
    exercises.forEach((ex, i) => {
      const count = (data.history[ex] || []).length;
      const angle = (Math.PI * 2 * i) / exercises.length - Math.PI / 2;
      const dist = 100 + Math.random() * 60;
      nodes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        count: count,
        color: this.getColor(ex)
      });
    });
    
    // Draw connections from center
    ctx.lineWidth = 1;
    nodes.forEach(n => {
      const alpha = Math.min(0.6, 0.1 + n.count * 0.05);
      ctx.strokeStyle = `rgba(255,107,0,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    });
    
    // Draw inter-node connections
    nodes.forEach((a, i) => {
      nodes.slice(i + 1).forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120 && (a.count + b.count) > 5) {
          ctx.strokeStyle = `rgba(0,136,255,${Math.min(0.3, (a.count + b.count) * 0.01)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });
    });
    
    // Draw center node
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    grad.addColorStop(0, '#FF6B00');
    grad.addColorStop(1, '#8B3300');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#FF6B00';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧠', cx, cy);
    
    // Draw outer nodes
    nodes.forEach(n => {
      const size = 8 + Math.min(15, n.count);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, size);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, n.color + '40');
      ctx.fillStyle = grad;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (n.count > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.count, n.x, n.y);
      }
    });
    
    // Title
    ctx.fillStyle = '#5a5a6a';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`Всего связей: ${data.totalTrainings || 0} · Уровень: ${data.level}%`, 20, H - 20);
  },
  getColor(ex) {
    const map = {
      accelerator: '#FF6B00', expander: '#0088FF', focus: '#00CC66',
      grip: '#9B59B6', reaction: '#FF3366', pattern: '#FFD700',
      nback: '#9370DB', sort: '#32CD32', chess: '#FFFFFF', mirror: '#FF1493'
    };
    return map[ex] || '#FF6B00';
  }
};
window.NeuralTree = NeuralTree;
