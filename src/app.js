/**
 * Express application — routes, validation, and error handling.
 * Separated from server.js so tests can mount the app without
 * binding a port.
 */

const path = require('path');
const express = require('express');
const { gridShapeError, validate, solve } = require('./sudoku');

/** Operational error with an HTTP status the error middleware understands. */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Parse and shape-check the grid from a request body, or throw 400. */
function requireGrid(body) {
  if (!body || typeof body !== 'object' || !('grid' in body)) {
    throw new ApiError(400, 'Request body must be JSON with a "grid" property.');
  }
  const shapeError = gridShapeError(body.grid);
  if (shapeError) {
    throw new ApiError(400, shapeError);
  }
  return body.grid;
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.post('/api/validate', (req, res) => {
    const grid = requireGrid(req.body);
    const result = validate(grid);
    res.json(result);
  });

  app.post('/api/solve', (req, res) => {
    const grid = requireGrid(req.body);
    const result = solve(grid);
    if (!result.solved) {
      // Well-formed request, but the puzzle itself is unsolvable.
      return res.status(422).json(result);
    }
    res.json(result);
  });

  // Unknown API routes -> JSON 404 (static middleware handles the rest).
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `No route: ${req.method} ${req.originalUrl}` });
  });

  // Central error handler: ApiError keeps its status, everything else is 500.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON.' });
    }
    const status = err instanceof ApiError ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.message || 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp, ApiError };
