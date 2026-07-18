const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  gridShapeError,
  validate,
  isSafe,
  solve,
  isComplete,
  findConflicts,
} = require('../src/sudoku');

const EASY = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const EASY_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const blank = () => Array.from({ length: 9 }, () => Array(9).fill(0));

describe('gridShapeError', () => {
  test('accepts a well-formed grid', () => {
    assert.equal(gridShapeError(EASY), null);
  });

  test('rejects non-arrays and wrong sizes', () => {
    assert.ok(gridShapeError(null));
    assert.ok(gridShapeError([[1, 2], [3, 4]]));
    assert.ok(gridShapeError(Array.from({ length: 9 }, () => Array(8).fill(0))));
  });

  test('rejects out-of-range and non-integer values', () => {
    const g = blank();
    g[0][0] = 10;
    assert.ok(gridShapeError(g));
    g[0][0] = 4.5;
    assert.ok(gridShapeError(g));
    g[0][0] = '5';
    assert.ok(gridShapeError(g));
  });
});

describe('validate / findConflicts', () => {
  test('a valid partial grid has no conflicts', () => {
    const result = validate(EASY);
    assert.equal(result.valid, true);
    assert.equal(result.complete, false);
    assert.deepEqual(result.conflicts, []);
  });

  test('a complete correct grid is valid and complete', () => {
    const result = validate(EASY_SOLUTION);
    assert.equal(result.valid, true);
    assert.equal(result.complete, true);
  });

  test('detects a row duplicate', () => {
    const g = blank();
    g[0][0] = 5;
    g[0][8] = 5;
    const conflicts = findConflicts(g);
    assert.deepEqual(
      conflicts.sort((a, b) => a.col - b.col),
      [{ row: 0, col: 0 }, { row: 0, col: 8 }]
    );
  });

  test('detects a column duplicate', () => {
    const g = blank();
    g[0][3] = 7;
    g[8][3] = 7;
    assert.equal(findConflicts(g).length, 2);
  });

  test('detects a 3x3 box duplicate that is not in the same row or column', () => {
    const g = blank();
    g[0][0] = 9;
    g[1][1] = 9;
    assert.equal(findConflicts(g).length, 2);
  });

  test('empty cells never conflict', () => {
    assert.deepEqual(findConflicts(blank()), []);
  });
});

describe('isSafe', () => {
  test('respects row, column, and box constraints', () => {
    assert.equal(isSafe(EASY, 0, 2, 5), false); // 5 already in row 0
    assert.equal(isSafe(EASY, 2, 0, 8), false); // 8 already in column 0
    assert.equal(isSafe(EASY, 1, 1, 9), false); // 9 already in top-left box
    assert.equal(isSafe(EASY, 0, 2, 4), true);  // 4 fits at (0,2)
  });
});

describe('solve', () => {
  test('solves the classic easy puzzle to its known solution', () => {
    const result = solve(EASY);
    assert.equal(result.solved, true);
    assert.deepEqual(result.grid, EASY_SOLUTION);
    assert.ok(result.stats.steps > 0);
  });

  test('does not mutate the input grid', () => {
    const copy = EASY.map((r) => r.slice());
    solve(EASY);
    assert.deepEqual(EASY, copy);
  });

  test('solution passes its own validation and is complete', () => {
    const { grid } = solve(EASY);
    const check = validate(grid);
    assert.equal(check.valid, true);
    assert.equal(check.complete, true);
    assert.equal(isComplete(grid), true);
  });

  test('solves a blank grid (any valid completion)', () => {
    const result = solve(blank());
    assert.equal(result.solved, true);
    assert.equal(validate(result.grid).valid, true);
    assert.equal(isComplete(result.grid), true);
  });

  test('refuses a grid whose clues already conflict', () => {
    const g = blank();
    g[0][0] = 1;
    g[0][1] = 1;
    const result = solve(g);
    assert.equal(result.solved, false);
    assert.match(result.reason, /conflict/i);
    assert.equal(result.conflicts.length, 2);
  });

  test('reports unsolvable for a consistent but impossible puzzle', () => {
    // Cell (0,0) is empty but every digit 1-9 is blocked by its row,
    // column, or box — individually consistent, jointly impossible.
    const g = blank();
    g[0][1] = 2; g[0][2] = 3; g[0][3] = 4; g[0][4] = 5; g[0][5] = 6;
    g[1][0] = 7; g[2][0] = 8; g[1][1] = 9; g[3][0] = 1;
    const result = solve(g);
    assert.equal(result.solved, false);
    assert.match(result.reason, /no solution/i);
  });
});
