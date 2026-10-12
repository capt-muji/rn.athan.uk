// The board reader: committed repository state plus two machine-local caches to board.json.
// Derived, disposable, never a source of truth; every absent input degrades silently
// except the queue itself. Deterministic by construction: sorted directory reads,
// fixed key order, no timestamps beyond generatedAt and context age.

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const CONFIG_DEFAULTS = { port: 8788, host: '127.0.0.1', reconcileMs: 15000, doneColumnCount: 5 };

const STATUS_MAP = [
  ['IN PROGRESS', 'In progress'],
  ['NEEDS REPLAN', 'Planning'],
  ['NOT PLANNED', 'Backlog'],
  ['PLANNING', 'Planning'],
  ['READY', 'Ready'],
  ['EXECUTED', 'Audit'],
  ['DONE', 'Done'],
  ['BLOCKED', 'Blocked'],
  ['OWNER-LED', 'Owner-led'],
];

const closedStatus = (cell) => cell.startsWith('CANCELLED') || cell.startsWith('SUPERSEDED');

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

function readConfig(file) {
  let parsed = {};
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    // A config that is absent or unparseable answers the defaults; the board never dies on it.
    parsed = {};
  }
  const config = {};
  for (const [key, value] of Object.entries(CONFIG_DEFAULTS)) {
    config[key] = parsed[key] === undefined ? value : parsed[key];
  }
  return config;
}

function parseQueue(markdown) {
  const open = [];
  const doneRows = [];
  const doneOrders = [];
  const settled = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const fields = line.split('|');
    const order = Number.parseInt(fields[1].trim(), 10);
    if (!Number.isInteger(order)) continue;
    if (fields.length === 5) {
      const name = fields[2].trim();
      const status = fields[3].trim();
      if (status.startsWith('DONE')) {
        doneRows.push({ order, name });
        doneOrders.push(order);
      } else if (closedStatus(status)) {
        settled.push(order);
      }
    } else if (fields.length === 7) {
      const name = fields[2].trim();
      const brief = fields[3].trim();
      const statusCell = fields[4].trim();
      const needsCell = fields[5].trim();
      if (statusCell.startsWith('DONE')) {
        doneRows.push({ order, name, brief, statusCell, needsCell });
        doneOrders.push(order);
      } else {
        open.push({ order, name, brief, statusCell, needsCell });
      }
    }
  }
  return { open, doneRows, doneOrders, settled };
}

function mapStatus(statusCell) {
  const cell = statusCell.trim();
  const matched = STATUS_MAP.find(([phrase]) => cell.startsWith(phrase));
  const rendered = !closedStatus(cell);
  const cursorMatch = cell.match(/step (\d+)/);
  const cursor = cursorMatch ? Number.parseInt(cursorMatch[1], 10) : null;
  if (!matched) {
    const firstSpace = cell.indexOf(' ');
    const head = firstSpace === -1 ? cell : cell.slice(0, firstSpace);
    const rest = firstSpace === -1 ? '' : cell.slice(firstSpace);
    return { status: head, column: 'Deferred', cursor, statusText: collapse(rest).slice(0, 140), rendered };
  }
  const [phrase, column] = matched;
  return { status: phrase, column, cursor, statusText: collapse(cell.slice(phrase.length)).slice(0, 140), rendered };
}

function parseNeeds(needsCell) {
  const orders = (needsCell.match(/\d+/g) ?? []).map((digit) => Number.parseInt(digit, 10));
  return [...new Set(orders)].sort((a, b) => a - b);
}

function isMet(order, tickets, metOrders) {
  if (metOrders.includes(order)) return true;
  const row = tickets.find((ticket) => ticket.order === order);
  return Boolean(row) && !row.rendered;
}

function findPlanFolder(repo, order) {
  const plans = path.join(repo, 'ai', 'plans');
  if (!existsSync(plans)) return null;
  const match = readdirSync(plans, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${order}-`))
    .map((entry) => entry.name)
    .sort()[0];
  return match ? path.join(plans, match) : null;
}

function stepWeight(planPath, n) {
  const stepsDir = path.join(planPath, 'steps');
  if (!existsSync(stepsDir)) return 1;
  const padded = String(n).padStart(2, '0');
  const file = readdirSync(stepsDir)
    .filter((name) => (name.startsWith(`${n}-`) || name.startsWith(`${padded}-`)) && name.endsWith('.md'))
    .sort()[0];
  if (!file) return 1;
  const match = readFileSync(path.join(stepsDir, file), 'utf8').match(/Weight:\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

function headerCell(lines, label) {
  const line = lines.find((candidate) => candidate.startsWith(`| ${label} |`));
  if (!line) return null;
  return line.split('|')[2].trim();
}

function parsePlan(planPath) {
  const planFile = path.join(planPath, 'PLAN.md');
  if (!existsSync(planFile)) return { parent: null, group: null, steps: [] };
  const lines = readFileSync(planFile, 'utf8').split('\n');
  const parentCell = headerCell(lines, 'Parent');
  let parent = null;
  if (parentCell !== null && !parentCell.startsWith('none')) {
    const digits = parentCell.match(/\d+/);
    if (digits) parent = Number.parseInt(digits[0], 10);
  }
  const groupCell = headerCell(lines, 'Group');
  const group = groupCell && !/^none(\.|$|\s)/.test(groupCell) ? groupCell : null;
  const steps = [];
  for (const line of lines) {
    const match = line.match(/- \[([ x])\] Step (\d+):/);
    if (!match) continue;
    steps.push({ n: Number.parseInt(match[2], 10), weight: stepWeight(planPath, Number.parseInt(match[2], 10)), ticked: match[1] === 'x' });
  }
  return { parent, group, steps };
}

function platformOf(planPath) {
  const stepsDir = path.join(planPath, 'steps');
  if (!existsSync(stepsDir)) return null;
  let android = false;
  let ios = false;
  let shared = false;
  for (const file of readdirSync(stepsDir).filter((name) => name.endsWith('.md')).sort()) {
    const lines = readFileSync(path.join(stepsDir, file), 'utf8').split('\n');
    const start = lines.findIndex((line) => line.startsWith('## Files'));
    if (start === -1) continue;
    for (const line of lines.slice(start + 1)) {
      if (line.startsWith('## ')) break;
      for (const token of line.match(/`([^`]+)`/g) ?? []) {
        const fileToken = token.slice(1, -1);
        if (fileToken.startsWith('android/')) android = true;
        if (fileToken.startsWith('ios/')) ios = true;
        if (fileToken.startsWith('shared/')) shared = true;
      }
    }
  }
  if (shared || (android && ios)) return 'Both';
  if (android) return 'Android';
  if (ios) return 'iOS';
  return null;
}

function parseLogSessions(logPath) {
  if (!existsSync(logPath)) return [];
  const sessions = [];
  for (const line of readFileSync(logPath, 'utf8').split('\n')) {
    const match = line.match(/^session: (ses_\S+)/);
    if (match) sessions.push(match[1]);
  }
  return sessions;
}

function shortSha(sha) {
  return sha === null ? null : sha.trim().slice(0, 12);
}

function readRefs(repo) {
  const read = (ref) => {
    const file = path.join(repo, '.git', ...ref.split('/'));
    if (existsSync(file)) return shortSha(readFileSync(file, 'utf8'));
    const packed = path.join(repo, '.git', 'packed-refs');
    if (!existsSync(packed)) return null;
    for (const line of readFileSync(packed, 'utf8').split('\n')) {
      if (line.endsWith(` ${ref}`)) return shortSha(line.split(' ')[0]);
    }
    return null;
  };
  return { uat: read('refs/heads/uat'), originUat: read('refs/remotes/origin/uat') };
}

function frontmatterValue(lines, key) {
  for (const line of lines) {
    const match = line.match(new RegExp(`^${key}:\\s*"?([^"\\s]+)"?\\s*$`));
    if (match) return match[1];
  }
  return null;
}

function readContext(handoffDir, sessionIds) {
  const indexPath = path.join(handoffDir, 'index.json');
  if (!existsSync(indexPath) || sessionIds.length === 0) return null;
  let entries;
  try {
    entries = JSON.parse(readFileSync(indexPath, 'utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(entries) || !entries.every((e) => typeof e.file === 'string' && typeof e.sourceSession === 'string' && typeof e.updatedMs === 'number')) {
    return null;
  }
  let newest = null;
  for (const session of sessionIds) {
    const perSession = entries.filter((e) => e.sourceSession === session);
    if (perSession.length === 0) continue;
    const entry = perSession.reduce((a, b) => (b.updatedMs > a.updatedMs ? b : a));
    const doc = path.join(handoffDir, entry.file);
    if (!existsSync(doc)) continue;
    const lines = readFileSync(doc, 'utf8').split('\n');
    if (lines[0].trim() !== '---') continue;
    const end = lines.indexOf('---', 1);
    if (end === -1) continue;
    const body = lines.slice(1, end);
    const pctText = frontmatterValue(body, 'context_pct');
    const pct = pctText === null || !/^\d+(\.\d+)?$/.test(pctText) ? null : Number.parseFloat(pctText);
    const updatedText = frontmatterValue(body, 'updated_at');
    const updatedMs = updatedText === null ? NaN : Date.parse(updatedText);
    if (pct === null || Number.isNaN(updatedMs)) continue;
    if (newest === null || updatedMs > newest.updatedMs) {
      newest = { pct, updatedMs };
    }
  }
  if (newest === null) return null;
  return { pct: newest.pct, ageMs: Date.now() - newest.updatedMs };
}

function activeNow(dbPath, repoDirectoryInDb, now) {
  if (!dbPath || !repoDirectoryInDb || !existsSync(dbPath)) return false;
  let db = null;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    const row = db
      .prepare('SELECT 1 FROM session_v2 WHERE directory = ? AND time_updated >= ? LIMIT 1')
      .get(repoDirectoryInDb, now - 300000);
    return Boolean(row);
  } catch {
    return false;
  } finally {
    if (db !== null) db.close();
  }
}

function ensureState(stateDir) {
  mkdirSync(stateDir, { recursive: true });
  const ignore = path.join(stateDir, '.gitignore');
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n');
}

function ticketFromOpenRow(row, mapped, lookup, metOrders, repo, handoffDir) {
  const needs = parseNeeds(row.needsCell);
  const planFolder = findPlanFolder(repo, row.order);
  const plan = planFolder ? parsePlan(planFolder) : { parent: null, group: null, steps: [] };
  const platform = planFolder ? platformOf(planFolder) : null;
  const sessions = planFolder ? parseLogSessions(path.join(planFolder, 'LOG.md')) : [];
  const context = readContext(handoffDir, sessions);
  const steps = plan.steps.map((step) => ({
    n: step.n,
    weight: step.weight,
    state: step.ticked ? 'Merged' : step.n === mapped.cursor ? 'Running' : 'Pending',
  }));
  return {
    order: row.order,
    name: row.name,
    status: mapped.status,
    statusText: mapped.statusText,
    column: mapped.column,
    needs,
    needsMet: needs.map((need) => isMet(need, lookup, metOrders)),
    parent: plan.parent,
    group: plan.group,
    platform,
    cursor: mapped.cursor,
    steps,
    context,
  };
}

function main(argv) {
  const flag = (name, fallback) => {
    const at = argv.indexOf(name);
    return at === -1 || at + 1 >= argv.length ? fallback : argv[at + 1];
  };
  const repo = path.resolve(flag('--repo', process.cwd()));
  const stateDir = flag('--state', path.join(repo, 'board', 'state'));
  const configFile = flag('--config', path.join(repo, 'board', 'config.json'));
  const defaultDb = path.join(process.env.HOME ?? '', '.local', 'share', 'opencode', 'opencode.db');
  const db = flag('--db', existsSync(defaultDb) ? defaultDb : null);
  const handoffDir = flag('--handoffs', path.join(repo, '.local-handoffs'));

  const config = readConfig(configFile);

  const queuePath = path.join(repo, 'ai', 'plans', 'README.md');
  let markdown;
  try {
    markdown = readFileSync(queuePath, 'utf8');
  } catch {
    process.stderr.write(`board-reader: cannot read ${queuePath}\n`);
    process.exit(1);
  }

  const queue = parseQueue(markdown);
  const mappedRows = queue.open.map((row) => ({ row, mapped: mapStatus(row.statusCell) }));
  // The needs lookup keeps unrendered rows: a need on a CANCELLED row is met.
  const lookup = mappedRows.map(({ row, mapped }) => ({ order: row.order, rendered: mapped.rendered }));
  const metOrders = [...queue.doneOrders, ...queue.settled];

  const tickets = [];
  for (const { row, mapped } of mappedRows) {
    if (!mapped.rendered) continue;
    tickets.push(ticketFromOpenRow(row, mapped, lookup, metOrders, repo, handoffDir));
  }

  const doneTop = [...queue.doneRows].sort((a, b) => b.order - a.order).slice(0, config.doneColumnCount);
  for (const row of doneTop) {
    if (row.statusCell === undefined) {
      tickets.push({
        order: row.order,
        name: row.name,
        status: 'DONE',
        statusText: '',
        column: 'Done',
        needs: [],
        needsMet: [],
        parent: null,
        group: null,
        platform: null,
        cursor: null,
        steps: [],
        context: null,
      });
      continue;
    }
    tickets.push(ticketFromOpenRow(row, mapStatus(row.statusCell), lookup, metOrders, repo, handoffDir));
  }

  let version = null;
  try {
    version = JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf8')).version;
  } catch {
    version = null;
  }
  const refs = readRefs(repo);
  const generatedAt = new Date().toISOString();

  const board = {
    schemaVersion: 1,
    generatedAt,
    reconcileMs: config.reconcileMs,
    repo: { version, uat: refs.uat, originUat: refs.originUat, unpushed: refs.uat !== refs.originUat },
    activeNow: activeNow(db, process.env.REPO_DIR_IN_DB ?? '', Date.now()),
    doneCount: queue.doneOrders.length,
    tickets,
  };

  ensureState(stateDir);
  const tmp = path.join(stateDir, 'board.json.tmp');
  writeFileSync(tmp, `${JSON.stringify(board, null, 2)}\n`);
  renameSync(tmp, path.join(stateDir, 'board.json'));

  process.stdout.write(`board.json written: ${tickets.length} tickets, ${queue.doneOrders.length} done, generatedAt ${generatedAt}\n`);
  process.exit(0);
}

main(process.argv.slice(2));
