# Sudoku Validator & Solver

Validate a filled 9×9 Sudoku grid and solve unfilled cells using the **Backtracking** algorithm.

**Key concepts:** 2D Arrays · Backtracking

A full-stack study project: a Node.js/Express backend exposes `validate` and `solve` APIs over a pure-function Sudoku engine, and a vanilla-JS frontend provides an interactive 9×9 board with keyboard navigation, a number pad, conflict highlighting, and solver statistics.

## Quick start

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

- `npm run dev` — run with auto-reload on file changes (`node --watch`)
- `npm test` — run the unit + API test suite (uses the built-in `node:test` runner, no extra dependencies)

Requires Node.js ≥ 18.

## Features

- **Interactive 9×9 board** — click or arrow-key around the grid, type 1–9 to fill, `Backspace`/`Delete`/`0` to erase. A number pad supports touch input.
- **Three sample puzzles** (easy / medium / hard) plus a blank grid for entering your own.
- **Validate** — checks every row, column, and 3×3 box; conflicting cells are highlighted in place.
- **Solve** — fills all empty cells via backtracking and reports elapsed time, placement count, and backtrack count. Given clues stay untouched; solver-filled cells are tinted and animate in.
- **Robust API** — malformed grids get descriptive `400` errors; unsolvable puzzles get a `422` with a reason (conflicting clues vs. no solution exists).

## Project structure

```
Suduko/
├── src/
│   ├── sudoku.js      # Core engine: 2D-array validation + backtracking solver (pure functions)
│   ├── app.js         # Express app: routes, input validation, error middleware
│   └── server.js      # Entry point: port binding, graceful shutdown
├── public/
│   ├── index.html     # Page structure: board, number pad, controls
│   ├── styles.css     # Design tokens (OKLCH), grid layout, states, motion
│   └── app.js         # Frontend controller: board state, keyboard/touch input, API calls
├── tests/
│   ├── sudoku.test.js # Engine unit tests
│   └── api.test.js    # HTTP integration tests
├── docs/
│   ├── ALGORITHM.md   # How validation and backtracking work, with complexity notes
│   └── API.md         # Endpoint reference with request/response examples
├── PRODUCT.md         # Product context (what/who/why)
├── DESIGN.md          # Visual design system notes
└── README.md
```

## How it works (short version)

The grid is a **9×9 2D array** — digits `1–9` for filled cells, `0` for empty.

- **Validation** scans each of the 27 units (9 rows, 9 columns, 9 boxes) with a value→cell map; any value seen twice marks both cells as conflicts.
- **Solving** uses classic **backtracking**: find the next empty cell, try digits 1–9 that pass the row/column/box safety check, recurse; if no digit fits, undo the last placement and try the next candidate. The clue cells are never modified.

See [docs/ALGORITHM.md](docs/ALGORITHM.md) for the full walkthrough and [docs/API.md](docs/API.md) for the endpoint reference.

## Testing

```bash
npm test
```

Covers: grid shape validation, conflict detection in rows/columns/boxes, `isSafe` constraints, solving a known puzzle to its known solution, input immutability, blank-grid solving, conflicting-clue rejection, unsolvable-puzzle detection, and the full HTTP surface (success, 400, 404, 422 paths).

## License

MIT
