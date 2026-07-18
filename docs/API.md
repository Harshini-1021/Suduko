# API Reference

Base URL: `http://localhost:3000`

All endpoints accept and return JSON. A **grid** is always a 9×9 array of integers `0–9`, where `0` means an empty cell.

Error contract:

| Status | Meaning |
|---|---|
| `400` | Malformed request — missing/invalid JSON, wrong grid shape, out-of-range values. Body: `{ "error": "<message>" }` |
| `404` | Unknown `/api/*` route. Body: `{ "error": "<message>" }` |
| `422` | Well-formed request, but the puzzle cannot be solved. Body: the standard solve failure payload (below) |
| `500` | Unexpected server error |

---

## GET /api/health

Liveness check.

```json
{ "status": "ok", "uptime": 12.34 }
```

---

## POST /api/validate

Check a grid for rule conflicts. The grid may be partially filled — empty cells are never conflicts.

**Request**

```json
{ "grid": [[5,3,0,0,7,0,0,0,0], "... 8 more rows"] }
```

**Response `200`**

```json
{
  "valid": true,
  "complete": false,
  "conflicts": []
}
```

- `valid` — no duplicate digit in any row, column, or 3×3 box
- `complete` — no empty (`0`) cells remain; `valid && complete` means the puzzle is fully solved
- `conflicts` — every cell involved in a duplicate, as `{ "row": r, "col": c }` (0-indexed). Both the original and the duplicate cell are listed.

**Example with a conflict** (two 5s in row 0):

```json
{
  "valid": false,
  "complete": false,
  "conflicts": [ { "row": 0, "col": 0 }, { "row": 0, "col": 2 } ]
}
```

---

## POST /api/solve

Solve a puzzle with backtracking. The input grid is not mutated; given clues are preserved in the solution.

**Request**

```json
{ "grid": [[5,3,0,0,7,0,0,0,0], "... 8 more rows"] }
```

**Response `200` (solved)**

```json
{
  "solved": true,
  "grid": [[5,3,4,6,7,8,9,1,2], "... 8 more rows"],
  "stats": { "steps": 391, "backtracks": 340, "timeMs": 1.42 }
}
```

- `stats.steps` — digit placements attempted during the search
- `stats.backtracks` — placements undone at dead ends
- `stats.timeMs` — wall-clock solve time in milliseconds

**Response `422` (unsolvable)**

Two failure modes, distinguished by `reason`:

```json
{
  "solved": false,
  "reason": "The given clues conflict with each other.",
  "conflicts": [ { "row": 0, "col": 0 }, { "row": 0, "col": 1 } ],
  "stats": { "steps": 0, "backtracks": 0, "timeMs": 0.05 }
}
```

```json
{
  "solved": false,
  "reason": "No solution exists for this puzzle.",
  "conflicts": [],
  "stats": { "steps": 4821, "backtracks": 4821, "timeMs": 3.1 }
}
```

---

## curl examples

```bash
# Health
curl http://localhost:3000/api/health

# Validate
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"grid":[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]}'

# Solve (same payload shape, /api/solve)
```
