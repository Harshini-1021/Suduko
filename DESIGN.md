# DESIGN.md

Visual system for the Sudoku Validator & Solver. Register: **product** — restrained color strategy.

## Scene

A student at a desk in daylight, moving between a textbook and this tool. Light theme: the board should read like a printed puzzle page, with the app's one warm accent marking what the *user* (or the solver) added to it.

## Color

All tokens in OKLCH, defined in [`public/styles.css`](public/styles.css) `:root`.

| Role | Token | Value | Use |
|---|---|---|---|
| Background | `--bg` | `oklch(1 0 0)` | Pure white page + empty cells |
| Surface | `--surface` | `oklch(0.965 0.004 34.8)` | Given-clue cells, secondary buttons |
| Ink | `--ink` | `oklch(0.23 0.014 34.8)` | Headings, given clues, body text |
| Muted | `--muted` | `oklch(0.45 0.02 34.8)` | Labels, captions, quiet buttons |
| Accent | `--accent` | `oklch(0.58 0.215 34.8)` | Primary button (Solve), focus ring |
| Accent text | `--accent-text` | `oklch(0.5 0.2 34.8)` | User-entered + solver-filled digits |
| Error | `--error-bg` / `--error-text` | `oklch(0.93 0.045 25)` / `oklch(0.42 0.17 25)` | Conflict cells |
| Success | `--success-text` | `oklch(0.44 0.11 150)` | Positive status messages |

Seed: `oklch(0.652 0.229 34.8)` (warm crimson), darkened per role for contrast — white-on-accent and accent-on-white both clear WCAG AA.

**Meaning system:** color encodes *authorship* on the board. Ink = the puzzle (givens, bold, surface-tinted). Crimson = additions (user entries and solver fills; solver fills get a soft tint so the two are distinguishable). Red tint = rule violations. The legend under the controls teaches this.

## Typography

One family: `"Segoe UI", system-ui, -apple-system, "Inter", sans-serif`. Fixed rem scale (no fluid clamp — product register):

- H1 `1.75rem/700`, subtitle `0.95rem`, board digits `1.3rem/500` (givens `700`), controls `0.95rem/600`, captions `0.82–0.85rem`. Stats use `font-variant-numeric: tabular-nums`.

## Layout

- Flex workspace: board column + control panel, wrapping to stacked below ~640px.
- Board: CSS Grid `repeat(9, minmax(2.2rem, 3rem))`; 1px hairlines between cells, 2px `--line-strong` between 3×3 boxes and around the frame.
- Radii: 6px controls, 10px status card. No decorative shadows.

## Motion

- State transitions 150ms `ease-out`.
- Solver fills animate in (`scale 0.75 → 1`, opacity) with a 12ms-per-cell stagger — motion conveys "the algorithm filled these", nothing decorative.
- Full `prefers-reduced-motion` fallback: instant fills, no transitions.

## Components & states

- **Cells:** default / hover / focus-visible (inset accent ring) / given (readonly) / solved-fill / conflict.
- **Buttons:** primary (accent), secondary (outlined), quiet (borderless muted); all with hover, focus-visible, disabled. Solve shows a "Solving…" working state.
- **Status card:** neutral / success / error, `aria-live=polite`, with a stats line after solving.
