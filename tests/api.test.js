const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server;
let base;

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

before(async () => {
  server = createApp().listen(0); // OS-assigned port
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

describe('GET /api/health', () => {
  test('reports ok', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });
});

describe('POST /api/validate', () => {
  test('valid partial grid', async () => {
    const { status, data } = await post('/api/validate', { grid: EASY });
    assert.equal(status, 200);
    assert.equal(data.valid, true);
    assert.equal(data.complete, false);
  });

  test('grid with conflicts lists conflicting cells', async () => {
    const bad = EASY.map((r) => r.slice());
    bad[0][2] = 5; // duplicates the 5 at (0,0)
    const { status, data } = await post('/api/validate', { grid: bad });
    assert.equal(status, 200);
    assert.equal(data.valid, false);
    assert.ok(data.conflicts.length >= 2);
  });

  test('missing grid -> 400', async () => {
    const { status, data } = await post('/api/validate', {});
    assert.equal(status, 400);
    assert.ok(data.error);
  });

  test('malformed grid -> 400', async () => {
    const { status } = await post('/api/validate', { grid: [[1, 2, 3]] });
    assert.equal(status, 400);
  });
});

describe('POST /api/solve', () => {
  test('solves a puzzle and returns stats', async () => {
    const { status, data } = await post('/api/solve', { grid: EASY });
    assert.equal(status, 200);
    assert.equal(data.solved, true);
    assert.equal(data.grid[0][2], 4);
    assert.ok(typeof data.stats.timeMs === 'number');
  });

  test('conflicting clues -> 422 with reason', async () => {
    const bad = EASY.map((r) => r.slice());
    bad[0][2] = 5;
    const { status, data } = await post('/api/solve', { grid: bad });
    assert.equal(status, 422);
    assert.equal(data.solved, false);
    assert.match(data.reason, /conflict/i);
  });
});

describe('error handling', () => {
  test('invalid JSON body -> 400', async () => {
    const res = await fetch(`${base}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    assert.equal(res.status, 400);
  });

  test('unknown API route -> JSON 404', async () => {
    const res = await fetch(`${base}/api/nope`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.ok(data.error);
  });
});
