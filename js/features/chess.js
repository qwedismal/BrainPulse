const data = Store.load();
Snd.enabled = data.settings.sound !== false;
const $ = id => document.getElementById(id);

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

// Набор простых тактических задач
// Формат: FEN-позиция + правильный ход (откуда -> куда)
const PUZZLES = [
  {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 3',
    solution: ['f3', 'f7'],
    description: 'Ферзь атакует f7'
  },
  {
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['e1', 'e8'],
    description: 'Ладья атакует 8-ю линию'
  },
  {
    fen: 'r3k2r/ppp2ppp/2n5/3p4/3P4/2N5/PPP2PPP/R3K2R w KQkq - 0 1',
    solution: ['e1', 'g1'],
    description: 'Короткая рокировка'
  },
  {
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 1',
    solution: ['f3', 'e5'],
    description: 'Конь атакует пешку'
  },
  {
    fen: '8/8/8/3k4/8/3K4/3R4/8 w - - 0 1',
    solution: ['d2', 'd3'],
    description: 'Ладья защищает короля'
  },
  {
    fen: 'rnbqkb1r/ppp1pppp/3p1n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1',
    solution: ['d1', 'h5'],
    description: 'Ферзь атакует пешку'
  },
  {
    fen: '4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
    solution: ['e2', 'e8'],
    description: 'Ферзь ставит мат'
  },
  {
    fen: 'r1b1k2r/ppppnppp/2n5/3pP3/3P4/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 1',
    solution: ['g1', 'f3'],
    description: 'Развитие коня'
  },
  {
    fen: '6k1/pp3ppp/8/8/8/8/PP3PPP/6K1 w - - 0 1',
    solution: ['g1', 'h1'],
    description: 'Король уходит от шаха'
  },
  {
    fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1',
    solution: ['d1', 'h5'],
    description: 'Выпад ферзя'
  },
  {
    fen: '8/8/8/3k4/8/8/3Q4/3K4 w - - 0 1',
    solution: ['d2', 'd3'],
    description: 'Защита от шаха'
  },
  {
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2PP1N2/PP3PPP/RNBQKB1R w KQkq - 0 1',
    solution: ['f3', 'g5'],
    description: 'Атака коня'
  },
  {
    fen: '8/8/8/8/4k3/8/4Q3/4K3 w - - 0 1',
    solution: ['e2', 'e3'],
    description: 'Защита ферзем'
  },
  {
    fen: 'r2qkbnr/ppp2ppp/2np4/4p3/2B1P3/2N5/PPPP1PPP/R1BQK1NR w KQkq - 0 1',
    solution: ['c4', 'f7'],
    description: 'Слон атакует'
  },
  {
    fen: '6k1/5ppp/8/8/8/2B5/5PPP/6K1 w - - 0 1',
    solution: ['c3', 'a5'],
    description: 'Слон на диагональ'
  }
];

const STATE = {
  timer: 300,
  running: false,
  iv: null,
  score: 0,
  currentPuzzle: null,
  selectedSquare: null
};

document.getElementById('record').textContent = data.records.chess || 0;

// === FEN PARSER ===
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

// === COORDINATE CONVERSION ===
function squareName(r, c) {
  return String.fromCharCode(97 + c) + (8 - r);
}

// === RENDER BOARD ===
function renderBoard(puzzle) {
  const board = parseFEN(puzzle.fen);
  const area = document.getElementById('problem-area');
  
  let html = '<div class="chess-puzzle-title">' + puzzle.description + '</div>';
  html += '<div class="chess-board" id="chessBoard">';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const piece = board[r][c];
      const sqName = squareName(r, c);
      const isSelected = STATE.selectedSquare === sqName;
      
      let cls = 'chess-square ' + (isLight ? 'light' : 'dark');
      if (isSelected) cls += ' selected';
      
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
  html += '<div class="chess-info">Сделай ход: ' + puzzle.solution[0].toUpperCase() + ' → ?</div>';
  
  area.innerHTML = html;
  
  const squares = area.querySelectorAll('.chess-square');
  squares.forEach(sq => {
    sq.addEventListener('click', function() {
      onSquareClick(this.dataset.sq, this.dataset.r, this.dataset.c);
    });
  });
}

function onSquareClick(sqName, r, c) {
  if (!STATE.running) return;
  
  if (!STATE.selectedSquare) {
    const board = parseFEN(STATE.currentPuzzle.fen);
    const piece = board[r][c];
    if (!piece) return;
    if (piece !== piece.toUpperCase()) return; // Только белые
    STATE.selectedSquare = sqName;
    renderBoard(STATE.currentPuzzle);
  } else {
    if (sqName === STATE.selectedSquare) {
      STATE.selectedSquare = null;
      renderBoard(STATE.currentPuzzle);
      return;
    }
    
    const solution = STATE.currentPuzzle.solution;
    const targetSq = solution[1];
    
    if (sqName.toLowerCase() === targetSq.toLowerCase()) {
      Snd.ok();
      Utils.flash('green');
      STATE.score++;
      document.getElementById('score').textContent = STATE.score;
      STATE.selectedSquare = null;
      setTimeout(nextPuzzle, 800);
    } else {
      Snd.err();
      Utils.flash('red');
      const problemArea = document.getElementById('problem-area');
      if (problemArea) {
        problemArea.style.animation = 'shake 0.3s';
        setTimeout(() => { if (problemArea) problemArea.style.animation = ''; }, 300);
      }
      STATE.selectedSquare = null;
      renderBoard(STATE.currentPuzzle);
    }
  }
}

function nextPuzzle() {
  STATE.currentPuzzle = Utils.shuffle(PUZZLES)[0];
  STATE.selectedSquare = null;
  renderBoard(STATE.currentPuzzle);
}

function start() {
  if (STATE.running) return;
  STATE.timer = 300;
  STATE.running = true;
  STATE.score = 0;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
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
  if (window.API && API.token) API.saveResult('chess', STATE.score).catch(() => {});
  
  document.getElementById('resScore').textContent = STATE.score;
  const rating = STATE.score > 15 ? '♟️ Гроссмейстер' :
                 STATE.score > 10 ? '🎯 Мастер' :
                 STATE.score > 5 ? '♞ Любитель' : '🌱 Пешка';
  document.getElementById('resVs').innerHTML = rating + '. Решено <strong>' + STATE.score + '</strong> задач';
  document.getElementById('resultModal').classList.add('show');
  document.getElementById('record').textContent = Store.load().records.chess;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

// === EVENT LISTENERS ===
document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('stopBtn').addEventListener('click', finish);
document.getElementById('againBtn').addEventListener('click', () => {
  document.getElementById('resultModal').classList.remove('show');
  start();
});

// === SHAKE ANIMATION (если ещё не добавлен) ===
if (!document.getElementById('shake-style')) {
  const shakeStyle = document.createElement('style');
  shakeStyle.id = 'shake-style';
  shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
  document.head.appendChild(shakeStyle);
}

// === INITIAL EMPTY STATE ===
document.getElementById('problem-area').innerHTML = 
  '<div style="text-align:center;padding:40px 20px">' +
    '<div style="font-size:80px;margin-bottom:16px">♟️</div>' +
    '<h2 style="font-family:var(--font-head);font-size:24px;margin-bottom:8px">Тактические задачи</h2>' +
    '<p style="color:var(--text-secondary);max-width:340px;margin:0 auto;font-size:14px">' +
      'Решай шахматные задачи на время. Найди лучший ход и кликни по нужной клетке.' +
    '</p>' +
  '</div>';

// === CURSOR ===
if (!window.matchMedia('(hover: none)').matches) {
  Utils.cursor();
}
