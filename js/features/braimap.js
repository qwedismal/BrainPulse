const BrainMap = {
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
    
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.38;
    
    const skills = [
      { key: 'accelerator', name: 'Скорость', color: '#FF6B00' },
      { key: 'expander', name: 'Память', color: '#0088FF' },
      { key: 'focus', name: 'Фокус', color: '#00CC66' },
      { key: 'grip', name: 'Цепкость', color: '#9B59B6' },
      { key: 'reaction', name: 'Реакция', color: '#FF3366' },
      { key: 'pattern', name: 'Паттерн', color: '#FFD700' },
      { key: 'nback', name: 'N-Back', color: '#9370DB' },
      { key: 'chess', name: 'Шахматы', color: '#FFFFFF' }
    ];
    
    // Find max for normalization
    const maxRec = Math.max(100, ...skills.map(s => data.records[s.key] || 0));
    
    // Draw circles
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      const r = (radius / 5) * i;
      for (let j = 0; j <= skills.length; j++) {
        const angle = (Math.PI * 2 * j) / skills.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    skills.forEach((s, i) => {
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();
    });
    
    // Draw values
    ctx.beginPath();
    skills.forEach((s, i) => {
      const val = Math.min(1, (data.records[s.key] || 0) / maxRec);
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      const r = radius * val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,107,0,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FF6B00';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw points
    skills.forEach((s, i) => {
      const val = Math.min(1, (data.records[s.key] || 0) / maxRec);
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      const r = radius * val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Labels
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    skills.forEach((s, i) => {
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      const r = radius + 24;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.fillStyle = s.color;
      ctx.fillText(s.name, x, y);
    });
  }
};
window.BrainMap = BrainMap;
