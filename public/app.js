/**
 * Sudoku Validator & Solver — frontend controller.
 * The board is a 9x9 grid of <input> cells; state lives in two
 * parallel structures: `givens` (the loaded puzzle's clues) and the
 * DOM inputs themselves (current values). All rule logic runs on the
 * server via /api/validate and /api/solve.
 */

(() => {
  const SIZE = 9;

  const PUZZLES = {
    easy: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    medium: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    hard: [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0],
    ],
    blank: Array.from({ length: SIZE }, () => Array(SIZE).fill(0)),
  };

  const board = document.getElementById('board');
  const numpad = document.getElementById('numpad');
  const statusBox = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const statusStats = document.getElementById('status-stats');
  const puzzleSelect = document.getElementById('puzzle-select');
  const btnValidate = document.getElementById('btn-validate');
  const btnSolve = document.getElementById('btn-solve');
  const btnReset = document.getElementById('btn-reset');

  /** cells[r][c] -> the <input> element */
  const cells = [];
  /** the loaded puzzle's clues; 0 = empty */
  let givens = PUZZLES.blank;

  // ---- board construction ----

  function buildBoard() {
    for (let r = 0; r < SIZE; r++) {
      cells.push([]);
      for (let c = 0; c < SIZE; c++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.maxLength = 1;
        input.className = 'cell';
        input.dataset.row = r;
        input.dataset.col = c;
        input.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}`);
        board.appendChild(input);
        cells[r].push(input);
      }
    }
  }

  // ---- state helpers ----

  function readGrid() {
    return cells.map((row) =>
      row.map((input) => {
        const v = parseInt(input.value, 10);
        return Number.isInteger(v) && v >= 1 && v <= 9 ? v : 0;
      })
    );
  }

  function loadPuzzle(name) {
    givens = PUZZLES[name];
    let value;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        value = givens[r][c];
        const input = cells[r][c];
        input.value = value === 0 ? '' : String(value);
        input.readOnly = value !== 0;
        input.classList.toggle('given', value !== 0);
        input.classList.remove('conflict', 'solved-fill');
      }
    }
    setStatus('neutral', name === 'blank'
      ? 'Blank grid — enter your own puzzle, then Validate or Solve.'
      : `${capitalize(name)} puzzle loaded. Fill cells or hit Solve.`);
  }

  function clearMarks() {
    for (const row of cells) {
      for (const input of row) {
        input.classList.remove('conflict', 'solved-fill');
      }
    }
  }

  function setStatus(kind, message, stats) {
    statusBox.classList.toggle('is-success', kind === 'success');
    statusBox.classList.toggle('is-error', kind === 'error');
    statusText.textContent = message;
    if (stats) {
      statusStats.hidden = false;
      statusStats.textContent = stats;
    } else {
      statusStats.hidden = true;
      statusStats.textContent = '';
    }
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---- API calls ----

  async function post(url, grid) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid }),
    });
    const data = await res.json();
    if (res.status >= 400 && res.status !== 422) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  function markConflicts(conflicts) {
    for (const { row, col } of conflicts) {
      cells[row][col].classList.add('conflict');
    }
  }

  async function onValidate() {
    clearMarks();
    try {
      const result = await post('/api/validate', readGrid());
      if (result.valid && result.complete) {
        setStatus('success', 'Solved! Every row, column, and box checks out.');
      } else if (result.valid) {
        setStatus('success', 'Looking good — no conflicts so far.');
      } else {
        markConflicts(result.conflicts);
        const n = result.conflicts.length;
        setStatus('error', `${n} conflicting cell${n === 1 ? '' : 's'} highlighted.`);
      }
    } catch (err) {
      setStatus('error', err.message);
    }
  }

  async function onSolve() {
    clearMarks();
    btnSolve.disabled = true;
    btnSolve.textContent = 'Solving…';
    try {
      const before = readGrid();
      const result = await post('/api/solve', before);
      if (!result.solved) {
        if (result.conflicts && result.conflicts.length) {
          markConflicts(result.conflicts);
        }
        setStatus('error', result.reason || 'This puzzle has no solution.');
        return;
      }
      // Fill only the cells that were empty, with a gentle stagger.
      let fillIndex = 0;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (before[r][c] === 0) {
            const input = cells[r][c];
            input.value = String(result.grid[r][c]);
            input.style.setProperty('--fill-index', fillIndex++);
            input.classList.add('solved-fill');
          }
        }
      }
      const { steps, backtracks, timeMs } = result.stats;
      setStatus(
        'success',
        'Solved by backtracking.',
        `${timeMs} ms · ${steps.toLocaleString()} placements · ${backtracks.toLocaleString()} backtracks`
      );
    } catch (err) {
      setStatus('error', err.message);
    } finally {
      btnSolve.disabled = false;
      btnSolve.textContent = 'Solve';
    }
  }

  function onReset() {
    loadPuzzle(puzzleSelect.value);
  }

  // ---- input handling ----

  function focusedCell() {
    const el = document.activeElement;
    return el && el.classList && el.classList.contains('cell') ? el : null;
  }

  function moveFocus(row, col, dr, dc) {
    const r = (row + dr + SIZE) % SIZE;
    const c = (col + dc + SIZE) % SIZE;
    cells[r][c].focus();
  }

  function setCell(input, num) {
    if (input.readOnly) return;
    input.value = num === 0 ? '' : String(num);
    input.classList.remove('conflict', 'solved-fill');
  }

  board.addEventListener('keydown', (e) => {
    const input = e.target;
    if (!input.classList.contains('cell')) return;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);

    if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(row, col, -1, 0); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(row, col, 1, 0); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(row, col, 0, -1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(row, col, 0, 1); return; }

    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      setCell(input, Number(e.key));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      e.preventDefault();
      setCell(input, 0);
      return;
    }
    // Allow tab / shift-tab to pass through; swallow other printable keys.
    if (e.key.length === 1) e.preventDefault();
  });

  // Mobile / paste path: keep only the last valid digit typed.
  board.addEventListener('input', (e) => {
    const input = e.target;
    if (!input.classList.contains('cell') || input.readOnly) return;
    const match = input.value.match(/[1-9]/g);
    input.value = match ? match[match.length - 1] : '';
    input.classList.remove('conflict', 'solved-fill');
  });

  numpad.addEventListener('click', (e) => {
    const key = e.target.closest('.numpad-key');
    if (!key) return;
    const input = focusedCell() || lastFocused;
    if (!input) {
      setStatus('neutral', 'Tap a cell first, then a number.');
      return;
    }
    setCell(input, Number(key.dataset.num));
    input.focus();
  });

  // Remember the last focused cell so numpad taps (which steal focus) still work.
  let lastFocused = null;
  board.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('cell')) lastFocused = e.target;
  });
  numpad.addEventListener('mousedown', (e) => e.preventDefault());

  // ---- wire up ----

  puzzleSelect.addEventListener('change', () => loadPuzzle(puzzleSelect.value));
  btnValidate.addEventListener('click', onValidate);
  btnSolve.addEventListener('click', onSolve);
  btnReset.addEventListener('click', onReset);

  buildBoard();
  loadPuzzle('easy');
})();
