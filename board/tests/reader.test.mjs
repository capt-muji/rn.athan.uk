// The fixture rows mirror the queue's landed shapes; the spawn test proves
// the server's own spawn path end to end.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { main, waitingLine } from '../reader.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMPLATE = readFileSync(path.join(REPO_ROOT, 'board', 'index.html'), 'utf8');

const QUEUE = [
  '| Order | Name | Brief | Status | Needs first |',
  '| --- | --- | --- | --- | --- |',
  '| 901 | Fixture investigation | The full brief sits in history | DONE 2026-10-16, audited: the answer landed and shipped | nothing |',
  '| 902 | Fixture owner ruling | The full brief sits in history | OWNER-LED 2026-10-17: the investigation answers, the recommendation is adopt option B; the work is DONE pending her word | her ruling on option B |',
  '| 903 | Fixture plain row | The full brief sits in history | NOT PLANNED 2026-10-17 | nothing |',
  '| 904 | Fixture waiting silent | The full brief sits in history | OWNER-LED 2026-10-17: the recommendation is keep the current design; nothing further to measure | nothing |',
  '| 905 | Fixture archived | DONE 2026-10-15 |',
].join('\n');

function buildFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'board-126-'));
  const plansDir = path.join(root, 'ai', 'plans');
  mkdirSync(plansDir, { recursive: true });
  writeFileSync(path.join(plansDir, 'README.md'), `${QUEUE}\n`);
  writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({ version: '9.9.9' })}\n`);
  const stateDir = path.join(root, 'board', 'state');
  mkdirSync(stateDir, { recursive: true });
  const handoffDir = path.join(root, '.local-handoffs');
  mkdirSync(handoffDir, { recursive: true });
  return { root, stateDir, handoffDir, db: path.join(root, 'absent.db') };
}

function runMain(fixture) {
  const out = [];
  let exitCode = null;
  const exit = process.exit;
  const write = process.stdout.write;
  process.exit = (code) => {
    exitCode = code;
  };
  process.stdout.write = (chunk) => {
    out.push(String(chunk));
    return true;
  };
  try {
    main(['--repo', fixture.root, '--state', fixture.stateDir, '--handoffs', fixture.handoffDir, '--db', fixture.db]);
  } finally {
    process.exit = exit;
    process.stdout.write = write;
  }
  const board = JSON.parse(readFileSync(path.join(fixture.stateDir, 'board.json'), 'utf8'));
  return { exitCode, out, board };
}

test('owner-led row carries awaitingOwner, column and waiting text', () => {
  const fixture = buildFixture();
  try {
    const run = runMain(fixture);
    assert.equal(run.exitCode, 0);
    const ticket = run.board.tickets.find((entry) => entry.order === 902);
    assert.ok(ticket, 'ticket 902 rendered');
    assert.equal(ticket.status, 'OWNER-LED');
    assert.equal(ticket.column, 'Owner-led');
    assert.equal(ticket.awaitingOwner, true);
    assert.ok(
      ticket.statusText.startsWith('2026-10-17: the investigation answers, the recommendation is adopt option B'),
      `statusText was ${ticket.statusText}`,
    );
    assert.equal(ticket.waitingOn, 'her ruling on option B');
    assert.deepEqual(ticket.needs, []);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('owner-led row with silent needs cell answers waitingOn null', () => {
  const fixture = buildFixture();
  try {
    const { board } = runMain(fixture);
    const ticket = board.tickets.find((entry) => entry.order === 904);
    assert.equal(ticket.awaitingOwner, true);
    assert.equal(ticket.waitingOn, null);
    assert.equal(waitingLine(''), null);
    assert.equal(waitingLine('nothing'), null);
    assert.equal(waitingLine('118'), null);
    assert.equal(waitingLine('her ruling on option B'), 'her ruling on option B');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('owner-led row never counts as done though its prose names DONE', () => {
  const fixture = buildFixture();
  try {
    const { board } = runMain(fixture);
    assert.equal(board.doneCount, 2);
    const ticket = board.tickets.find((entry) => entry.order === 902);
    assert.ok(ticket, 'ticket 902 rendered');
    assert.equal(ticket.column, 'Owner-led');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('every ticket carries the uniform owner fields and no other status moves', () => {
  const fixture = buildFixture();
  try {
    const { board } = runMain(fixture);
    assert.equal(board.tickets.length, 5);
    for (const ticket of board.tickets) {
      assert.equal(typeof ticket.awaitingOwner, 'boolean', `ticket ${ticket.order} awaitingOwner boolean`);
      assert.ok(ticket.waitingOn === null || typeof ticket.waitingOn === 'string', `ticket ${ticket.order} waitingOn shape`);
    }
    for (const order of [901, 903, 905]) {
      const ticket = board.tickets.find((entry) => entry.order === order);
      assert.equal(ticket.awaitingOwner, false);
      assert.equal(ticket.waitingOn, null);
    }
    const byOrder = Object.fromEntries(board.tickets.map((ticket) => [ticket.order, ticket]));
    assert.equal(byOrder[901].status, 'DONE');
    assert.equal(byOrder[901].column, 'Done');
    assert.equal(byOrder[903].status, 'NOT PLANNED');
    assert.equal(byOrder[903].column, 'Backlog');
    assert.equal(byOrder[905].status, 'DONE');
    assert.equal(byOrder[905].column, 'Done');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('recompute is idempotent', () => {
  const fixture = buildFixture();
  try {
    const first = runMain(fixture);
    const second = runMain(fixture);
    assert.deepEqual(second.board.tickets, first.board.tickets);
    assert.match(second.out.join(''), /board\.json written: 5 tickets, 2 done, generatedAt /);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('unreadable queue exits 1 with the stderr line', () => {
  const emptyRepo = mkdtempSync(path.join(tmpdir(), 'board-126-empty-'));
  const captured = [];
  let exitCode = null;
  const exit = process.exit;
  const write = process.stderr.write;
  process.exit = (code) => {
    exitCode = code;
    throw new Error('exit ' + code);
  };
  process.stderr.write = (chunk) => {
    captured.push(String(chunk));
    return true;
  };
  try {
    main(['--repo', emptyRepo]);
    assert.fail('main should have thrown through the exit stub');
  } catch (failure) {
    assert.equal(failure.message, 'exit 1');
  } finally {
    process.exit = exit;
    process.stderr.write = write;
    rmSync(emptyRepo, { recursive: true, force: true });
  }
  assert.equal(exitCode, 1);
  assert.ok(captured.join('').includes('board-reader: cannot read'));
});

test('spawned reader writes the same board', () => {
  const fixture = buildFixture();
  const spawnedState = mkdtempSync(path.join(tmpdir(), 'board-126-spawn-'));
  try {
    const inProcess = runMain(fixture);
    const proc = spawnSync(
      process.execPath,
      ['board/reader.mjs', '--repo', fixture.root, '--state', spawnedState, '--handoffs', fixture.handoffDir, '--db', fixture.db],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    assert.equal(proc.status, 0, `stderr: ${proc.stderr}`);
    assert.match(proc.stdout, /board\.json written: 5 tickets, 2 done, generatedAt /);
    const spawned = JSON.parse(readFileSync(path.join(spawnedState, 'board.json'), 'utf8'));
    assert.deepEqual(spawned.tickets, inProcess.board.tickets);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
    rmSync(spawnedState, { recursive: true, force: true });
  }
});

test('template script parses', () => {
  const start = TEMPLATE.lastIndexOf('<script>');
  const end = TEMPLATE.indexOf('</script>', start);
  assert.ok(start !== -1 && end !== -1, 'inline script found');
  new vm.Script(TEMPLATE.slice(start + '<script>'.length, end));
});

test('template words the badge and the waiting line', () => {
  assert.ok(TEMPLATE.includes('Awaiting owner'), 'badge wording present');
  assert.ok(TEMPLATE.includes('waiting on '), 'waiting line wording present');
  assert.ok(!TEMPLATE.includes('Owner steered'), 'stale badge gone');
  assert.ok(TEMPLATE.includes('if (ticket.awaitingOwner) card.append(waitingEl(ticket));'), 'wiring line verbatim');
});

test('displayColumn never blocks an owner-led row', () => {
  const line = TEMPLATE.split('\n').find((candidate) => candidate.includes("'Blocked' : ticket.column"));
  assert.ok(line, 'displayColumn expression found');
  assert.ok(line.includes("ticket.status !== 'DONE'"), 'DONE exclusion present');
  assert.ok(line.includes("ticket.status !== 'OWNER-LED'"), 'OWNER-LED exclusion present');
});
