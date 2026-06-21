const Forecast = {
  render(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (data.totalTrainings < 3) {
      el.innerHTML = 'Сделай минимум 3 тренировки, чтобы увидеть прогноз 📈';
      el.style.fontSize = '14px';
      el.style.color = '#9a9aa8';
      return;
    }
    
    // Calculate trend from history
    const allHistory = [];
    Object.values(data.history).forEach(h => {
      h.forEach(p => allHistory.push({ d: p.d, s: p.s }));
    });
    allHistory.sort((a, b) => a.d - b.d);
    
    if (allHistory.length < 2) {
      el.innerHTML = 'Нужно больше данных для прогноза';
      return;
    }
    
    // Simple linear regression
    const n = allHistory.length;
    const sumX = allHistory.reduce((a, b, i) => a + i, 0);
    const sumY = allHistory.reduce((a, b) => a + b.s, 0);
    const sumXY = allHistory.reduce((a, b, i) => a + i * b.s, 0);
    const sumX2 = allHistory.reduce((a, b, i) => a + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict 30 days
    const currentAvg = sumY / n;
    const projectedAvg = Math.max(0, intercept + slope * (n + 20));
    const growthPct = Math.round(((projectedAvg - currentAvg) / Math.max(1, currentAvg)) * 100);
    
    // Streak projection
    const projectedLevel = Math.min(100, data.level + Math.floor(data.totalTrainings * 0.5));
    
    el.style.fontSize = '14px';
    el.style.color = '#9a9aa8';
    el.innerHTML = `
      <div style="font-size:48px;font-weight:900;font-family:'Montserrat';color:#0088FF;margin-bottom:12px">
        ${growthPct > 0 ? '+' : ''}${growthPct}%
      </div>
      <div style="color:#f5f5f7;font-size:16px;margin-bottom:8px;font-weight:600">
        Твой мозг станет ${growthPct > 0 ? 'быстрее' : 'стабильнее'} через 30 дней
      </div>
      <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left">
        <div style="padding:12px;background:rgba(0,0,0,0.3);border-radius:8px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a5a6a">Сейчас</div>
          <div style="font-size:22px;font-weight:900;font-family:'JetBrains Mono';color:#f5f5f7">${Math.round(currentAvg)}</div>
          <div style="font-size:11px;color:#9a9aa8">средний рекорд</div>
        </div>
        <div style="padding:12px;background:rgba(0,136,255,0.1);border-radius:8px;border:1px solid rgba(0,136,255,0.3)">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#0088FF">Через 30 дней</div>
          <div style="font-size:22px;font-weight:900;font-family:'JetBrains Mono';color:#0088FF">${Math.round(projectedAvg)}</div>
          <div style="font-size:11px;color:#9a9aa8">прогноз</div>
        </div>
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#5a5a6a">
        📊 Тренд: ${slope > 0 ? '📈 растёшь' : slope < 0 ? '📉 стагнация' : '➡️ стабильно'} · 
        🎯 Цель: уровень ${projectedLevel}%
      </div>
    `;
  }
};
window.Forecast = Forecast;
