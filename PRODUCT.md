# PRODUCT.md

## What

Sudoku Validator & Solver — a single-page web tool backed by a small Node.js API. Users load a sample puzzle (or enter their own), validate it against Sudoku rules, and solve the remaining cells with a backtracking search.

## Who

Students and self-learners studying **2D arrays** and the **backtracking algorithm**. The interface doubles as a demonstration: solver statistics (placements, backtracks, time) make the search effort visible.

## Why

A study project that turns two textbook concepts into something interactive: the grid *is* the 2D array, and the Solve button *is* the backtracking algorithm running against it.

## Register

`product` — this is a tool. Design serves the task (entering digits, spotting conflicts, reading results); familiarity and clarity beat spectacle.

## Platform

`web` — desktop-first, fully usable on mobile (number pad for touch input).

## Core flows

1. **Load** — pick easy/medium/hard sample or a blank grid.
2. **Enter** — arrow keys + digits on desktop; tap + number pad on touch.
3. **Validate** — conflicting cells highlight in place; status line explains.
4. **Solve** — empty cells fill (staggered), givens untouched, stats reported.
5. **Reset** — return to the loaded puzzle's clues.

## Non-goals

- Puzzle generation with difficulty grading
- Accounts, saving, or sharing
- Hint systems / pencil marks
