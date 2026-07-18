/**
 * Core Sudoku engine — pure functions over a 9x9 2D array.
 * Cell values: 1–9 for filled cells, 0 for empty cells.
 * No I/O, no framework code: everything here is unit-testable in isolation.
 */

const SIZE = 9;
const BOX = 3;
const EMPTY = 0;

/**
 * Structural check: is `grid` a 9x9 array of integers 0–9?
 * Returns an error message string, or null when the shape is valid.
 */
function gridShapeError(grid) {
  if (!Array.isArray(grid) || grid.length !== SIZE) {
    return `Grid must be an array of ${SIZE} rows.`;
  }
  for (let r = 0; r < SIZE; r++) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length !== SIZE) {
      return `Row ${r + 1} must contain exactly ${SIZE} cells.`;
    }
    for (let c = 0; c < SIZE; c++) {
      const v = row[c];
      if (!Number.isInteger(v) || v < 0 || v > 9) {
        return `Cell (${r + 1}, ${c + 1}) must be an integer between 0 and 9.`;
      }
    }
  }
  return null;
}

/** Deep-copy a grid so callers never see their input mutated. */
function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

/** True when the grid has no empty (0) cells. */
function isComplete(grid) {
  return grid.every((row) => row.every((v) => v !== EMPTY));
}

/**
 * Find every cell that participates in a duplicate within its row,
 * column, or 3x3 box. Empty cells are ignored.
 * Returns an array of unique { row, col } positions (0-indexed).
 */
function findConflicts(grid) {
  const conflicted = new Set();

  const scanUnit = (cells) => {
    // cells: array of { row, col, value } for one row/column/box
    const seen = new Map(); // value -> first cell holding it
    for (const cell of cells) {
      if (cell.value === EMPTY) continue;
      if (seen.has(cell.value)) {
        const first = seen.get(cell.value);
        conflicted.add(`${first.row},${first.col}`);
        conflicted.add(`${cell.row},${cell.col}`);
      } else {
        seen.set(cell.value, cell);
      }
    }
  };

  for (let r = 0; r < SIZE; r++) {
    scanUnit(grid[r].map((value, col) => ({ row: r, col, value })));
  }
  for (let c = 0; c < SIZE; c++) {
    scanUnit(grid.map((row, r) => ({ row: r, col: c, value: row[c] })));
  }
  for (let br = 0; br < SIZE; br += BOX) {
    for (let bc = 0; bc < SIZE; bc += BOX) {
      const cells = [];
      for (let r = br; r < br + BOX; r++) {
        for (let c = bc; c < bc + BOX; c++) {
          cells.push({ row: r, col: c, value: grid[r][c] });
        }
      }
      scanUnit(cells);
    }
  }

  return [...conflicted].map((key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

/**
 * Validate a grid: no rule conflicts.
 * A grid can be valid without being complete (empty cells are fine).
 */
function validate(grid) {
  const conflicts = findConflicts(grid);
  return {
    valid: conflicts.length === 0,
    complete: isComplete(grid),
    conflicts,
  };
}

/** Can `num` legally go at (row, col)? Checks row, column, and 3x3 box. */
function isSafe(grid, row, col, num) {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const boxRow = row - (row % BOX);
  const boxCol = col - (col % BOX);
  for (let r = boxRow; r < boxRow + BOX; r++) {
    for (let c = boxCol; c < boxCol + BOX; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

/** Locate the next empty cell in row-major order, or null when full. */
function findEmpty(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === EMPTY) return { row: r, col: c };
    }
  }
  return null;
}

/**
 * Classic backtracking: place 1–9 in the next empty cell, recurse,
 * undo on dead ends. `stats.steps` counts placement attempts.
 */
function backtrack(grid, stats) {
  const cell = findEmpty(grid);
  if (!cell) return true; // no empties left: solved

  const { row, col } = cell;
  for (let num = 1; num <= 9; num++) {
    if (isSafe(grid, row, col, num)) {
      grid[row][col] = num;
      stats.steps++;
      if (backtrack(grid, stats)) return true;
      grid[row][col] = EMPTY; // undo and try the next candidate
      stats.backtracks++;
    }
  }
  return false; // no digit fits: caller must backtrack
}

/**
 * Solve a puzzle. Input is never mutated.
 * Returns { solved, grid?, reason?, stats } where stats holds
 * step/backtrack counts and elapsed milliseconds.
 */
function solve(grid) {
  const stats = { steps: 0, backtracks: 0, timeMs: 0 };
  const started = performance.now();

  // A grid whose clues already conflict can never be solved.
  const conflicts = findConflicts(grid);
  if (conflicts.length > 0) {
    stats.timeMs = round2(performance.now() - started);
    return {
      solved: false,
      reason: 'The given clues conflict with each other.',
      conflicts,
      stats,
    };
  }

  const work = cloneGrid(grid);
  const solved = backtrack(work, stats);
  stats.timeMs = round2(performance.now() - started);

  if (!solved) {
    return {
      solved: false,
      reason: 'No solution exists for this puzzle.',
      conflicts: [],
      stats,
    };
  }
  return { solved: true, grid: work, stats };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  SIZE,
  BOX,
  EMPTY,
  gridShapeError,
  cloneGrid,
  isComplete,
  findConflicts,
  validate,
  isSafe,
  findEmpty,
  solve,
};
