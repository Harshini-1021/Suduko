# Algorithm Notes

The whole engine lives in [`src/sudoku.js`](../src/sudoku.js) as pure functions over a 9×9 **2D array**. Cell values are integers: `1–9` for filled cells, `0` for empty.

```js
const grid = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  // ... 7 more rows
];
```

## 1. Validation

A Sudoku grid is valid when no digit repeats within any **unit**. There are 27 units: 9 rows, 9 columns, and 9 non-overlapping 3×3 boxes.

`findConflicts(grid)` scans each unit with a `Map` from value → first cell that held it:

1. Walk the unit's 9 cells, skipping empties.
2. First time a value appears, remember which cell had it.
3. If it appears again, mark **both** cells (the original and the duplicate) as conflicted.

Conflicted positions are collected in a `Set` keyed by `"row,col"` so a cell involved in several conflicts (say, a row *and* a box duplicate) is only reported once.

**Complexity:** each of the 27 units scans 9 cells → **O(81) = O(n²)** for an n=9 grid, with O(1) map lookups. Effectively constant time.

Iterating the 3×3 boxes uses stride-3 nested loops:

```js
for (let br = 0; br < 9; br += 3)      // box top row: 0, 3, 6
  for (let bc = 0; bc < 9; bc += 3)    // box left col: 0, 3, 6
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        visit(grid[r][c]);
```

`validate(grid)` wraps this and also reports `complete` (no zeros left), so the UI can distinguish "valid so far" from "fully solved".

## 2. The safety check

`isSafe(grid, row, col, num)` answers: *can `num` legally be placed at (row, col)?*

- Scan row `row` — reject if `num` is already present.
- Scan column `col` — same.
- Locate the cell's 3×3 box with `row - (row % 3)` / `col - (col % 3)` and scan its 9 cells.

This is the constraint function the solver calls before every placement.

## 3. Backtracking solver

Backtracking is a depth-first search over partial solutions: extend the current partial grid one cell at a time, and **undo** ("backtrack") as soon as a partial state can't lead to a solution.

```
function backtrack(grid):
    cell = next empty cell (row-major scan)
    if no empty cell:
        return true                       # base case: grid is full ⇒ solved

    for num in 1..9:
        if isSafe(grid, cell, num):
            grid[cell] = num              # choose
            if backtrack(grid):           # explore
                return true
            grid[cell] = 0                # un-choose (backtrack)

    return false                          # no digit fits ⇒ force caller to backtrack
```

Key properties:

- **Choose → explore → un-choose** is the backtracking signature. The `grid[cell] = 0` line is what makes it backtracking rather than plain brute force — it restores the state before trying the next candidate.
- The recursion depth is at most 81 (one frame per empty cell), so stack overflow is impossible.
- `solve()` works on a **clone** of the input (`cloneGrid`), so callers never see their grid mutated and the given clues are naturally preserved — they're simply never "empty".

### Pre-check

Before searching, `solve()` runs `findConflicts` on the clues. If the givens already contradict each other, no search can succeed, so it returns immediately with `reason: "The given clues conflict with each other."` and the conflicting cells. This turns a doomed exponential search into an O(n²) rejection.

### Unsolvable vs. invalid

Two different failure modes, reported separately:

| Case | Detection | Response |
|---|---|---|
| Clues conflict (two 5s in a row) | `findConflicts` pre-check | `reason: clues conflict` + cell list |
| Clues consistent but no completion exists | search exhausts all branches, `backtrack` returns `false` | `reason: no solution exists` |

### Complexity

Worst case the search tree has up to 9 branches per empty cell → **O(9^m)** for m empty cells. In practice the `isSafe` pruning cuts the tree drastically: typical published puzzles solve in a few hundred to a few thousand placements, well under a millisecond in Node. The solver counts `steps` (placements tried) and `backtracks` (undos) and reports both, so you can watch the search effort grow from easy → hard puzzles in the UI.

### Possible optimizations (not implemented, by design)

This project keeps the textbook row-major backtracking for clarity. Classic speedups, in increasing order of effort:

1. **MRV heuristic** — instead of the next empty cell, pick the empty cell with the *fewest* legal candidates. Dramatically shrinks the branching factor.
2. **Candidate bitmasks** — track used digits per row/column/box as 9-bit masks, making `isSafe` O(1) bitwise ops.
3. **Constraint propagation** (naked singles, hidden singles) before searching — many easy puzzles solve with no search at all.
4. **Dancing Links (Algorithm X)** — model Sudoku as exact cover; the heavyweight solution.
