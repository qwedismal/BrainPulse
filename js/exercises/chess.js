'use strict';

const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const STATE = {
  timer: 300,
  running: false,
  iv: null,
  score: 0,
  currentPuzzle: null,
  selectedSquare: null,
  hintShown: false,
  puzzlesSolved: [],
  moveHistory: []
};

document.getElementById('record').textContent = (data.records && data.records.chess) || 0;

// ============================================================
// FEN PARSER — превращает строку FEN в 2D массив доски
// ============================================================
function parseFEN(fen) {
  const board = [];
  const rows = fen.split(' ')[0].split('/');
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  return board;
}

function squareName(r, c) {
  return String.fromCharCode(97 + c) + (8 - r);
}

function parseSquare(name) {
  return { r: 8 - parseInt(name[1]), c: name.charCodeAt(0) - 97 };
}

// ============================================================
// MOVE GENERATOR — генерирует все легальные ходы фигуры
// ============================================================
function generateMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  
  const isWhite = piece === piece.toUpperCase();
  const moves = [];
  const dir = isWhite ? -1 : 1;
  const enemy = (p) => p && (p === p.toUpperCase()) !== isWhite;
  const empty = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c];
  const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  
  const type = piece.toLowerCase();
  
  if (type === 'p') {
    // Пешка: вперёд на 1 (или 2 с начальной), бьёт по диагонали
    const startRow = isWhite ? 6 : 1;
    const nr = r + dir;
    if (onBoard(nr, c) && empty(nr, c)) {
      moves.push({ r: nr, c: c });
      if (r === startRow && onBoard(nr + dir, c) && empty(nr + dir, c)) {
        moves.push({ r: nr + dir, c: c });
      }
    }
    // Бить по диагонали
    for (const dc of [-1, 1]) {
      if (onBoard(nr, c + dc) && enemy(board[nr][c + dc])) {
        moves.push({ r: nr, c: c + dc, capture: true });
      }
    }
  }
  
  if (type === 'n') {
    // Конь: 8 возможных ходов
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of deltas) {
      const nr = r + dr, nc = c + dc;
      if (onBoard(nr, nc) && (!board[nr][nc] || enemy(board[nr][nc]))) {
        moves.push({ r: nr, c: nc });
      }
    }
  }
  
  if (type === 'b' || type === 'r' || type === 'q') {
    // Слон, ладья, ферзь — скользящие ходы
    const dirs = [];
    if (type === 'b' || type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type === 'r' || type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (onBoard(nr, nc)) {
        if (empty(nr, nc)) {
          moves.push({ r: nr, c: nc });
        } else {
          if (enemy(board[nr][nc])) moves.push({ r: nr, c: nc, capture: true });
          break;
        }
        nr += dr; nc += dc;
      }
    }
  }
  
  if (type === 'k') {
    // Король: 8 клеток вокруг
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (onBoard(nr, nc) && (!board[nr][nc] || enemy(board[nr][nc]))) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
  }
  
  return moves;
}

// ============================================================
// BOARD RENDERER — рисует доску с подсветкой
// ============================================================
function renderBoard(puzzle, highlightSquares = []) {
  const board = parseFEN(puzzle.fen);
  const area = document.getElementById('problem-area');
  
  let html = '<div class="chess-puzzle-title">' + puzzle.title + '</div>';
  html += '<div class="chess-puzzle-desc">' + puzzle.description + '</div>';
  
  if (puzzle.hint) {
    html += '<div class="chess-hint" id="chessHint" style="display:none"><strong>💡 Подсказка:</strong> ' + puzzle.hint + '</div>';
  }
  
  html += '<div class="chess-board" id="chessBoard">';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = board[r][c];
      const sqName = squareName(r, c);
      const isSelected = STATE.selectedSquare === sqName;
      const isHighlight = highlightSquares.includes(sqName);
      
      let cls = 'chess-square ' + (isLight ? 'light' : 'dark');
      if (isSelected) cls += ' selected';
      if (isHighlight) cls += ' highlight';
      
      html += '<div class="' + cls + '" data-sq="' + sqName + '" data-r="' + r + '" data-c="' + c + '">';
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        const textShadow = isWhite ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.4)';
        const color = isWhite ? '#fff' : '#000';
        html += '<span style="color:' + color + ';text-shadow:' + textShadow + '">' + PIECES[piece] + '</span>';
      }
      html += '</div>';
    }
  }
  html += '</div>';
  
  html += '<div class="chess-info">';
  html += '<span>Найди лучший ход: <strong style="color:var(--ec)">' + puzzle.solution[0].toUpperCase() + '</strong> → ?</span>';
  html += '<button class="chess-hint-btn" id="hintBtn">💡 Подсказка</button>';
  html += '</div>';
  
  area.innerHTML = html;
  
  // Подвязываем обработчики
  const squares = area.querySelectorAll('.chess-square');
  for (let i = 0; i < squares.length; i++) {
    squares[i].addEventListener('click', function() {
      onSquareClick(this.dataset.sq, parseInt(this.dataset.r), parseInt(this.dataset.c));
    });
  }
  
  const hintBtn = document.getElementById('hintBtn');
  if (hintBtn && puzzle.hint) {
    hintBtn.addEventListener('click', () => {
      const h = document.getElementById('chessHint');
      if (h) h.style.display = 'block';
      hintBtn.disabled = true;
      hintBtn.textContent = '✓ Подсказка показана';
    });
  }
}

// ============================================================
// CLICK HANDLER — обработка клика по клетке
// ============================================================
function onSquareClick(sqName, r, c) {
  if (!STATE.running) return;
  if (!STATE.currentPuzzle) return;
  
  if (!STATE.selectedSquare) {
    // Выбираем свою фигуру (белую)
    const board = parseFEN(STATE.currentPuzzle.fen);
    const piece = board[r][c];
    if (!piece) return;
    if (piece !== piece.toUpperCase()) return; // Только белые
    
    // Подсвечиваем возможные ходы
    const moves = generateMoves(board, r, c);
    const highlights = moves.map(m => squareName(m.r, m.c));
    
    STATE.selectedSquare = sqName;
    renderBoard(STATE.currentPuzzle, highlights);
    return;
  }
  
  // Кликнули повторно по той же клетке — снимаем выбор
  if (sqName === STATE.selectedSquare) {
    STATE.selectedSquare = null;
    renderBoard(STATE.currentPuzzle);
    return;
  }
  
  // Пытаемся сделать ход
  const solution = STATE.currentPuzzle.solution;
  const fromSq = solution[0];
  const toSq = solution[1];
  
  // Проверка: правильная ли начальная и конечная клетка
  if (sqName.toLowerCase() === toSq.toLowerCase() && STATE.selectedSquare.toLowerCase() === fromSq.toLowerCase()) {
    // Правильный ход!
    Snd.ok();
    Utils.flash('green');
    STATE.score++;
    STATE.moveHistory.push({ from: fromSq, to: toSq });
    document.getElementById('score').textContent = STATE.score;
    STATE.selectedSquare = null;
    
    // Показываем что задача решена
    showSolution(solution);
    
    setTimeout(nextPuzzle, 1500);
  } else {
    // Неправильный ход
    Snd.err();
    Utils.flash('red');
    
    const problemArea = document.getElementById('problem-area');
    if (problemArea) {
      problemArea.style.animation = 'shake 0.3s';
      setTimeout(() => {
        if (problemArea) problemArea.style.animation = '';
      }, 300);
    }
    STATE.selectedSquare = null;
    renderBoard(STATE.currentPuzzle);
  }
}

function showSolution(solution) {
  const board = document.getElementById('chessBoard');
  if (!board) return;
  
  // Подсветить исходную и конечную клетки
  const squares = board.querySelectorAll('.chess-square');
  for (const sq of squares) {
    if (sq.dataset.sq === solution[0] || sq.dataset.sq === solution[1]) {
      sq.classList.add('selected');
    }
  }
}

// ============================================================
// PUZZLE GENERATOR — генератор задач разных типов
// ============================================================

// === Тип 1: Мат в 1 ход (ферзь, ладья, слон) ===
function genMateInOne() {
  const mates = [
    {
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 3',
      solution: ['f3', 'f7'],
      title: 'Школьный мат',
      description: 'Белый ферзь атакует чёрного короля. Найди мат!',
      hint: 'Чёрный король на e8 защищён только пешкой f7. Уничтожь её ферзём!',
      type: 'mate1'
    },
    {
      fen: '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
      solution: ['e2', 'e8'],
      title: 'Линейный мат',
      description: 'Белый ферзь должен поставить мат чёрному королю',
      hint: 'Ферзь ставит мат на 8-й горизонтали — король не может отойти',
      type: 'mate1'
    },
    {
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      solution: ['e1', 'e8'],
      title: 'Мат ладьёй',
      description: 'Ладья должна поставить мат чёрному королю на 8-й линии',
      hint: 'Ладья занимает 8-ю горизонталь — король окружён пешками',
      type: 'mate1'
    },
    {
      fen: '7k/5ppp/8/8/8/8/8/4R2K w - - 0 1',
      solution: ['e1', 'e8'],
      title: 'Мат на задней линии',
      description: 'Ладья должна поставить мат чёрному королю на 8-й линии',
      hint: 'Просто передвинь ладью на 8-ю горизонталь',
      type: 'mate1'
    },
    {
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      solution: ['a1', 'a8'],
      title: 'Мат по линии a',
      description: 'Ладья на a1 ставит мат чёрному королю',
      hint: 'Ладья по 1-й горизонтали идёт на 8-ю',
      type: 'mate1'
    }
  ];
  return Utils.shuffle(mates)[0];
}

// === Тип 2: Мат конём ===
function genKnightMate() {
  const mates = [
    {
      fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
      solution: ['c3', 'd5'],
      title: 'Мат конём в центре',
      description: 'Конь ставит мат чёрному королю',
      hint: 'Конь прыгает на d5 — король окружён',
      type: 'knight'
    },
    {
      fen: '7k/8/8/8/8/2N5/8/4K3 w - - 0 1',
      solution: ['c3', 'e4'],
      title: 'Мат конём',
      description: 'Конь должен поставить мат',
      hint: 'Конь на e4 — все клетки короля атакованы',
      type: 'knight'
    },
    {
      fen: 'k7/8/1N6/8/8/8/8/4K3 w - - 0 1',
      solution: ['b6', 'a8'],
      title: 'Конь на край',
      description: 'Конь загоняет короля на край и ставит мат',
      hint: 'Конь идёт на a8 — король в ловушке',
      type: 'knight'
    }
  ];
  return Utils.shuffle(mates)[0];
}

// === Тип 3: Забрать незащищённую фигуру (тактика) ===
function genCapture() {
  const captures = [
    {
      fen: '4k3/8/8/3q4/8/8/8/4K3 w - - 0 1',
      solution: ['e1', 'd1'],
      title: 'Забрать ферзя',
      description: 'Чёрный ферзь не защищён. Забери его!',
      hint: 'Король может безопасно пойти и забрать ферзя',
      type: 'capture'
    },
    {
      fen: '4k3/8/8/3n4/8/8/8/4K3 w - - 0 1',
      solution: ['e1', 'd1'],
      title: 'Даровой конь',
      description: 'Чёрный конь не защищён — забирай',
      hint: 'Король свободно ходит и забирает коня',
      type: 'capture'
    },
    {
      fen: 'r3k3/8/8/8/8/8/8/4K3 w - - 0 1',
      solution: ['e1', 'e2'],
      title: 'Ладья в углу',
      description: 'Чёрная ладья на a8 не может защититься',
      hint: 'Подойди королём поближе для атаки',
      type: 'capture'
    },
    {
      fen: '4k3/8/8/8/8/8/4r3/4K3 w - - 0 1',
      solution: ['e1', 'e2'],
      title: 'Ладья снизу',
      description: 'Забери чёрную ладью',
      hint: 'Король идёт на e2 чтобы атаковать ладью',
      type: 'capture'
    },
    {
      fen: '4k3/8/8/8/8/8/3b4/4K3 w - - 0 1',
      solution: ['e1', 'e2'],
      title: 'Слон в опасности',
      description: 'Забери чёрного слона',
      hint: 'Король подходит ближе к слону',
      type: 'capture'
    }
  ];
  return Utils.shuffle(captures)[0];
}

// === Тип 4: Шах и мат ферзём с поддержкой ===
function genQueenMate() {
  const puzzles = [
    {
      fen: '6k1/5ppp/8/8/8/8/5PPP/3QR1K1 w - - 0 1',
      solution: ['d1', 'd8'],
      title: 'Мат ферзём с поддержкой',
      description: 'Ладья защищает ферзя. Поставь мат!',
      hint: 'Ферзь идёт на d8 — мат, потому что ладья защищает',
      type: 'queenmate'
    },
    {
      fen: '7k/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1',
      solution: ['e1', 'e8'],
      title: 'Прямой мат ферзём',
      description: 'Поставь мат чёрному королю',
      hint: 'Ферзь ставит мат на e8',
      type: 'queenmate'
    },
    {
      fen: '6rk/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1',
      solution: ['e1', 'e8'],
      title: 'Мат с защитой',
      description: 'Чёрная ладья защищает короля? Нет, ферзь всё равно ставит мат!',
      hint: 'Просто поставь ферзя на e8 — ладья не защищает',
      type: 'queenmate'
    }
  ];
  return Utils.shuffle(puzzles)[0];
}

// === Тип 5: Двойной удар (вилка) ===
function genFork() {
  const forks = [
    {
      fen: '4k3/8/8/8/8/8/4N3/4K3 w - - 0 1',
      solution: ['e2', 'c3'],
      title: 'Вилка конём',
      description: 'Конь должен атаковать две фигуры одновременно',
      hint: 'Конь на c3 атакует и ферзя, и ладью',
      type: 'fork'
    },
    {
      fen: '4k3/8/8/8/8/3q4/4N3/4K3 w - - 0 1',
      solution: ['e2', 'c3'],
      title: 'Двойной удар',
      description: 'Конь атакует ферзя и ладью одновременно',
      hint: 'На c3 конь бьёт и ферзя, и ладью',
      type: 'fork'
    }
  ];
  return Utils.shuffle(forks)[0];
}

// === Тип 6: Пешечное продвижение ===
function genPawnPromotion() {
  return {
    fen: '8/3P4/8/8/8/8/8/4K1k1 w - - 0 1',
    solution: ['d7', 'd8'],
    title: 'Превращение пешки',
    description: 'Пешка дошла до 8-й горизонтали — превращение!',
    hint: 'Передвинь пешку на последнюю горизонталь',
    type: 'promotion'
  };
}

// ============================================================
// SMART PUZZLE SELECTOR — выбирает задачу по уровню игрока
// ============================================================
function generatePuzzle() {
  const solved = STATE.puzzlesSolved.length;
  const difficulty = Math.min(5, Math.floor(solved / 2));
  
  // Распределение по сложности:
  // 0-2 решённых: mate1 + capture (легко)
  // 3-5: knight + capture (средне)
  // 6-9: queenmate + fork (сложно)
  // 10+: все типы (эксперт)
  
  let pool = [];
  if (solved < 3) {
    pool = [genMateInOne, genCapture];
  } else if (solved < 6) {
    pool = [genMateInOne, genCapture, genKnightMate];
  } else if (solved < 10) {
    pool = [genMateInOne, genKnightMate, genQueenMate, genCapture];
  } else {
    pool = [genMateInOne, genKnightMate, genQueenMate, genCapture, genFork, genPawnPromotion];
  }
  
  // Не повторяем решённые задачи подряд
  let puzzle;
  let attempts = 0;
  do {
    puzzle = pool[Utils.rand(0, pool.length - 1)]();
    attempts++;
  } while (
    STATE.puzzlesSolved.length > 0 &&
    STATE.puzzlesSolved[STATE.puzzlesSolved.length - 1] === puzzle.fen &&
    attempts < 3
  );
  
  return puzzle;
}

function nextPuzzle() {
  STATE.currentPuzzle = generatePuzzle();
  STATE.selectedSquare = null;
  renderBoard(STATE.currentPuzzle);
}

function start() {
  if (STATE.running) return;
  STATE.timer = 300;
  STATE.running = true;
  STATE.score = 0;
  STATE.puzzlesSolved = [];
  STATE.moveHistory = [];
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('score').textContent = '0';
  Snd.start();
  nextPuzzle();
  
  STATE.iv = setInterval(() => {
    STATE.timer--;
    document.getElementById('time').textContent = Utils.formatTime(STATE.timer);
    if (STATE.timer <= 10) Snd.tick();
    if (STATE.timer <= 0) finish();
  }, 1000);
}

function finish() {
  STATE.running = false;
  clearInterval(STATE.iv);
  Snd.end();
  
  Store.recordResult('chess', STATE.score);
  if (window.API && API.token) {
    API.saveResult('chess', STATE.score).catch(() => {});
  }
  
  document.getElementById('resScore').textContent = STATE.score;
  
  let rating = '🌱 Пешка';
  if (STATE.score > 20) rating = '♟️ Гроссмейстер';
  else if (STATE.score > 15) rating = '🎯 Мастер';
  else if (STATE.score > 10) rating = '♞ Кандидат';
  else if (STATE.score > 5) rating = '⚔️ Боец';
  
  document.getElementById('resVs').innerHTML = rating + '. Решено <strong>' + STATE.score + '</strong> задач разного типа';
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.chess;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});

// Shake animation
if (!document.getElementById('shake-style')) {
  const s = document.createElement('style');
  s.id = 'shake-style';
  s.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
  document.head.appendChild(s);
}

// Chess puzzle styles (если нет в CSS)
if (!document.getElementById('chess-inline-styles')) {
  const s = document.createElement('style');
  s.id = 'chess-inline-styles';
  s.textContent = `
    .chess-puzzle-title{font-family:'Montserrat',sans-serif;font-size:18px;font-weight:800;margin-bottom:6px;color:var(--text-primary);text-align:center}
    .chess-puzzle-desc{color:var(--text-secondary);font-size:13px;margin-bottom:10px;text-align:center;padding:0 16px}
    .chess-hint{background:rgba(255,107,0,0.1);border:1px solid var(--c-acc);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:var(--text-primary);text-align:center;padding:0 16px}
    .chess-info{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:0 8px;font-size:13px;color:var(--text-secondary);flex-wrap:wrap;gap:8px}
    .chess-hint-btn{padding:6px 12px;background:var(--bg-elev-2);border:1px solid var(--border);border-radius:100px;font-size:12px;cursor:pointer;color:var(--text-secondary);transition:all .2s}
    .chess-hint-btn:hover{background:var(--bg-base);color:var(--text-primary)}
    .chess-hint-btn:disabled{opacity:0.5;cursor:default}
  `;
  document.head.appendChild(s);
}

// Initial state
document.getElementById('problem-area').innerHTML = 
  '<div style="text-align:center;padding:40px 20px">' +
    '<div style="font-size:80px;margin-bottom:16px">♟️</div>' +
    '<h2 style="font-family:var(--font-head);font-size:24px;margin-bottom:8px;color:var(--text-primary)">Тактические задачи</h2>' +
    '<p style="color:var(--text-secondary);max-width:340px;margin:0 auto;font-size:14px">' +
      'Решай шахматные задачи разного типа: маты в 1 ход, вилки, защиты. С каждым уровнем сложность растёт!' +
    '</p>' +
  '</div>';

if (!window.matchMedia('(hover: none)').matches) {
  try { Utils.cursor(); } catch (e) {}
}
