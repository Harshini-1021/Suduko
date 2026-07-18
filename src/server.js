/**
 * Server entry point: binds the Express app to a port and handles
 * graceful shutdown. Run with `npm start` (or `npm run dev` to watch).
 */

const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Sudoku Validator & Solver running at http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down.`);
  server.close(() => process.exit(0));
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
