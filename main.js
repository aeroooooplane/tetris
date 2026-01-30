(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d', { alpha: false });

  const elScore = document.getElementById('score');
  const elLevel = document.getElementById('level');
  const elLines = document.getElementById('lines');

  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayHint = document.getElementById('overlayHint');
  const btnPause = document.getElementById('btnPause');
  const btnRestart = document.getElementById('btnRestart');
  const btnOverlayResume = document.getElementById('btnOverlayResume');
  const btnOverlayRestart = document.getElementById('btnOverlayRestart');
  const speedSlider = document.getElementById('speedSlider');

  // 速度滑轨：0=慢 50=默认 100=快，返回下落间隔的倍率
  function getSpeedIntervalMultiplier() {
    const val = Number(speedSlider?.value ?? 50);
    if (val <= 50) return 1 + (50 - val) / 50;
    return 1 - 0.65 * (val - 50) / 50;
  }

  // Board config
  const COLS = 10;
  const ROWS = 20;
  const TILE = Math.floor(canvas.width / COLS); // keep integer
  const TOP_OFFSET_PX = canvas.height - ROWS * TILE; // for exact fit

  // Colors (index -> color)
  const COLORS = [
    '#000000', // 0 empty (not used)
    '#6ea8fe', // I
    '#7cf0c5', // O
    '#b7a4ff', // T
    '#ffd166', // S
    '#ff9fbe', // Z
    '#8ce99a', // J
    '#ff6b6b', // L
  ];

  // Tetromino matrices (4x4 or 3x3 as arrays)
  // Each piece uses an id 1..7 for coloring.
  const SHAPES = {
    I: { id: 1, m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
    O: { id: 2, m: [[2, 2], [2, 2]] },
    T: { id: 3, m: [[0, 3, 0], [3, 3, 3], [0, 0, 0]] },
    S: { id: 4, m: [[0, 4, 4], [4, 4, 0], [0, 0, 0]] },
    Z: { id: 5, m: [[5, 5, 0], [0, 5, 5], [0, 0, 0]] },
    J: { id: 6, m: [[6, 0, 0], [6, 6, 6], [0, 0, 0]] },
    L: { id: 7, m: [[0, 0, 7], [7, 7, 7], [0, 0, 0]] },
  };

  const PIECE_KEYS = Object.keys(SHAPES);

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function cloneMatrix(m) {
    return m.map((row) => row.slice());
  }

  function rotateMatrixCW(m) {
    const h = m.length;
    const w = m[0].length;
    const out = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) out[x][h - 1 - y] = m[y][x];
    }
    return out;
  }

  function randInt(n) {
    return Math.floor(Math.random() * n);
  }

  // 7-bag randomizer for fair distribution
  function* bagGenerator() {
    let bag = [];
    while (true) {
      if (bag.length === 0) {
        bag = PIECE_KEYS.slice();
        for (let i = bag.length - 1; i > 0; i--) {
          const j = randInt(i + 1);
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      yield bag.pop();
    }
  }

  const bag = bagGenerator();

  function spawnPiece(key) {
    const shape = SHAPES[key];
    const m = cloneMatrix(shape.m);
    const w = m[0].length;
    return {
      key,
      id: shape.id,
      m,
      x: Math.floor((COLS - w) / 2),
      y: -1, // start slightly above top for smoother spawn
    };
  }

  function collides(board, piece, dx = 0, dy = 0, testMatrix = null) {
    const m = testMatrix || piece.m;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        const v = m[y][x];
        if (!v) continue;
        const nx = piece.x + x + dx;
        const ny = piece.y + y + dy;
        if (nx < 0 || nx >= COLS) return true;
        if (ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge(board, piece) {
    const m = piece.m;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        const v = m[y][x];
        if (!v) continue;
        const by = piece.y + y;
        const bx = piece.x + x;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = v;
      }
    }
  }

  function clearLines(board) {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; ) {
      if (board[y].every((c) => c !== 0)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
      } else {
        y--;
      }
    }
    return cleared;
  }

  function shade(hex, amt) {
    // amt: -0.3..0.3
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
    return `rgb(${r},${g},${b})`;
  }

  function drawCell(g, x, y, color) {
    const px = x * TILE;
    const py = TOP_OFFSET_PX + y * TILE;
    g.fillStyle = color;
    g.fillRect(px, py, TILE, TILE);
    // bevel
    g.fillStyle = shade(color, 0.22);
    g.fillRect(px, py, TILE, 3);
    g.fillRect(px, py, 3, TILE);
    g.fillStyle = shade(color, -0.18);
    g.fillRect(px, py + TILE - 3, TILE, 3);
    g.fillRect(px + TILE - 3, py, 3, TILE);
    // inner border
    g.strokeStyle = 'rgba(0,0,0,.28)';
    g.lineWidth = 1;
    g.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
  }

  function drawBoard() {
    // background
    ctx.fillStyle = '#050a16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE + 0.5, TOP_OFFSET_PX + 0.5);
      ctx.lineTo(x * TILE + 0.5, TOP_OFFSET_PX + ROWS * TILE + 0.5);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0.5, TOP_OFFSET_PX + y * TILE + 0.5);
      ctx.lineTo(COLS * TILE + 0.5, TOP_OFFSET_PX + y * TILE + 0.5);
      ctx.stroke();
    }

    // settled blocks
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = state.board[y][x];
        if (v) drawCell(ctx, x, y, COLORS[v]);
      }
    }

    // ghost
    if (state.running && !state.gameOver) {
      const gy = getGhostY();
      drawPiece(state.active, 0, gy - state.active.y, true);
    }

    // active piece
    if (!state.gameOver) drawPiece(state.active);
  }

  function drawPiece(piece, dx = 0, dy = 0, ghost = false) {
    const m = piece.m;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        const v = m[y][x];
        if (!v) continue;
        const bx = piece.x + x + dx;
        const by = piece.y + y + dy;
        if (by < 0) continue;
        if (ghost) {
          ctx.fillStyle = 'rgba(255,255,255,.10)';
          ctx.fillRect(bx * TILE, TOP_OFFSET_PX + by * TILE, TILE, TILE);
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.strokeRect(bx * TILE + 0.5, TOP_OFFSET_PX + by * TILE + 0.5, TILE - 1, TILE - 1);
        } else {
          drawCell(ctx, bx, by, COLORS[v]);
        }
      }
    }
  }

  function drawNext() {
    nextCtx.fillStyle = '#050a16';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const p = state.next;
    const m = p.m;
    const cell = Math.floor(nextCanvas.width / 5);
    const w = m[0].length;
    const h = m.length;
    const ox = Math.floor((5 - w) / 2);
    const oy = Math.floor((5 - h) / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = m[y][x];
        if (!v) continue;
        const px = (ox + x) * cell;
        const py = (oy + y) * cell;
        nextCtx.fillStyle = COLORS[v];
        nextCtx.fillRect(px, py, cell, cell);
        nextCtx.fillStyle = shade(COLORS[v], 0.22);
        nextCtx.fillRect(px, py, cell, 3);
        nextCtx.fillRect(px, py, 3, cell);
        nextCtx.fillStyle = shade(COLORS[v], -0.18);
        nextCtx.fillRect(px, py + cell - 3, cell, 3);
        nextCtx.fillRect(px + cell - 3, py, 3, cell);
        nextCtx.strokeStyle = 'rgba(0,0,0,.28)';
        nextCtx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
      }
    }
  }

  function computeDropIntervalMs(level) {
    // Faster with level, but clamp
    return Math.max(80, 800 - (level - 1) * 60);
  }

  function updateHUD() {
    elScore.textContent = String(state.score);
    elLevel.textContent = String(state.level);
    elLines.textContent = String(state.lines);
  }

  function showOverlay(title, hint) {
    overlayTitle.textContent = title;
    overlayHint.textContent = hint;
    overlay.hidden = false;
  }

  function hideOverlay() {
    overlay.hidden = true;
  }

  function getGhostY() {
    let y = state.active.y;
    while (!collides(state.board, state.active, 0, (y - state.active.y) + 1)) y++;
    return y;
  }

  function softDrop() {
    if (state.gameOver) return;
    if (!collides(state.board, state.active, 0, 1)) {
      state.active.y += 1;
      state.score += 1; // tiny reward
      updateHUD();
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    if (state.gameOver) return;
    const gy = getGhostY();
    const dist = gy - state.active.y;
    if (dist > 0) {
      state.active.y = gy;
      state.score += dist * 2;
      updateHUD();
    }
    lockPiece();
  }

  function lockPiece() {
    merge(state.board, state.active);
    const cleared = clearLines(state.board);
    if (cleared > 0) {
      // classic-ish scoring
      const base = [0, 100, 300, 500, 800][cleared] || (cleared * 200);
      state.score += base * state.level;
      state.lines += cleared;
      const newLevel = Math.floor(state.lines / 10) + 1;
      if (newLevel !== state.level) {
        state.level = newLevel;
        state.dropIntervalMs = computeDropIntervalMs(state.level);
      }
      updateHUD();
    }
    spawnNext();
  }

  function spawnNext() {
    state.active = state.next;
    state.next = spawnPiece(bag.next().value);
    drawNext();

    // If spawn collides immediately -> game over
    if (collides(state.board, state.active, 0, 0)) {
      state.gameOver = true;
      state.running = false;
      showOverlay('游戏结束', '按 R 重开');
      btnPause.disabled = true;
    }
  }

  function tryMove(dx, dy) {
    if (state.gameOver) return false;
    if (!collides(state.board, state.active, dx, dy)) {
      state.active.x += dx;
      state.active.y += dy;
      return true;
    }
    return false;
  }

  function tryRotate() {
    if (state.gameOver) return;
    const rotated = rotateMatrixCW(state.active.m);
    if (!collides(state.board, state.active, 0, 0, rotated)) {
      state.active.m = rotated;
      return;
    }
    // simple wall-kick: try shift left/right up to 2 cells
    const kicks = [1, -1, 2, -2];
    for (const k of kicks) {
      if (!collides(state.board, state.active, k, 0, rotated)) {
        state.active.x += k;
        state.active.m = rotated;
        return;
      }
    }
  }

  function resetGame() {
    state.board = createBoard();
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    state.dropIntervalMs = computeDropIntervalMs(state.level);
    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.softDropping = false;
    btnPause.disabled = false;
    btnPause.textContent = '暂停 (P)';
    hideOverlay();
    state.next = spawnPiece(bag.next().value);
    spawnNext();
    updateHUD();
    state.lastTime = performance.now();
    state.dropAcc = 0;
  }

  function togglePause() {
    if (state.gameOver) return;
    state.paused = !state.paused;
    if (state.paused) {
      state.running = false;
      btnPause.textContent = '继续 (P)';
      showOverlay('暂停', '按 P 继续');
    } else {
      state.running = true;
      btnPause.textContent = '暂停 (P)';
      hideOverlay();
      state.lastTime = performance.now(); // prevent huge dt jump
    }
  }

  const state = {
    board: createBoard(),
    active: spawnPiece('T'),
    next: spawnPiece('O'),
    score: 0,
    lines: 0,
    level: 1,
    dropIntervalMs: 800,
    running: true,
    paused: false,
    gameOver: false,
    softDropping: false,
    lastTime: 0,
    dropAcc: 0,
  };

  function tick(now) {
    const dt = now - state.lastTime;
    state.lastTime = now;

    if (state.running && !state.gameOver) {
      const baseInterval = state.softDropping ? 40 : state.dropIntervalMs;
      const interval = baseInterval * getSpeedIntervalMultiplier();
      state.dropAcc += dt;
      while (state.dropAcc >= interval) {
        state.dropAcc -= interval;
        if (!tryMove(0, 1)) {
          lockPiece();
          break;
        }
      }
    }

    drawBoard();
    requestAnimationFrame(tick);
  }

  // Input
  const keyState = new Map();
  function setKey(e, down) {
    keyState.set(e.code, down);
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    setKey(e, true);

    if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.code === 'KeyR') {
      e.preventDefault();
      resetGame();
      return;
    }

    if (state.paused || state.gameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        tryMove(-1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        tryMove(1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        state.softDropping = true;
        break;
      case 'ArrowUp':
        e.preventDefault();
        tryRotate();
        break;
      case 'Space':
        e.preventDefault();
        hardDrop();
        break;
      default:
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    setKey(e, false);
    if (e.code === 'ArrowDown') state.softDropping = false;
  });

  // Buttons
  btnPause.addEventListener('click', () => togglePause());
  btnRestart.addEventListener('click', () => resetGame());
  btnOverlayResume.addEventListener('click', () => {
    if (state.gameOver) return;
    if (state.paused) togglePause();
  });
  btnOverlayRestart.addEventListener('click', () => resetGame());

  // Start
  resetGame();
  drawNext();
  requestAnimationFrame((t) => {
    state.lastTime = t;
    requestAnimationFrame(tick);
  });
})();
