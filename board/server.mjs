// The board server: three routes, a reconciling timer that re-spawns the reader,
// and one SSE push when the state file's bytes change. Derived, disposable.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, watch } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const flag = (name, fallback) => { const at = process.argv.indexOf(name); return at === -1 || at + 1 >= process.argv.length ? fallback : process.argv[at + 1]; };
const repo = path.resolve(flag('--repo', process.cwd()));
const stateDir = path.resolve(flag('--state', path.join(repo, 'board', 'state')));
const configFile = flag('--config', path.join(repo, 'board', 'config.json'));
const defaultDb = path.join(process.env.HOME ?? '', '.local', 'share', 'opencode', 'opencode.db');
const db = flag('--db', existsSync(defaultDb) ? defaultDb : null);
const handoffs = flag('--handoffs', path.join(repo, '.local-handoffs'));
// an absent or unparseable config answers the defaults, as in the reader
let config = { host: '127.0.0.1', port: 8788, reconcileMs: 15000 };
try { config = { ...config, ...JSON.parse(readFileSync(configFile, 'utf8')) }; } catch {}
const stateFile = path.join(stateDir, 'board.json');
const readerArgs = ['--repo', repo, '--state', stateDir, '--handoffs', handoffs];
if (db) readerArgs.push('--db', db);
let readerRunning = false;
const runReader = () => {
  if (readerRunning) return;
  readerRunning = true;
  spawn('node', [path.join(repo, 'board', 'reader.mjs'), ...readerArgs], { stdio: 'ignore' }).on('exit', () => { readerRunning = false; });
};
mkdirSync(stateDir, { recursive: true });
runReader();
setInterval(runReader, config.reconcileMs);
const clients = new Set();
let lastState = existsSync(stateFile) ? readFileSync(stateFile) : null;
watch(stateDir, () => {
  if (!existsSync(stateFile)) return;
  const fresh = readFileSync(stateFile);
  if (lastState && fresh.equals(lastState)) return;
  lastState = fresh;
  for (const client of clients) { try { client.write('data: rev\n\n'); } catch { clients.delete(client); } }
});
http.createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => clients.delete(res));
  } else if (req.url === '/board.json') {
    try {
      res.writeHead(200, { 'content-type': 'application/json' }).end(readFileSync(stateFile));
    } catch {
      res.writeHead(503, { 'content-type': 'text/plain' }).end('board.json not written yet\n');
    }
  } else if (req.url === '/' && existsSync(path.join(repo, 'board', 'index.html'))) {
    res.writeHead(200, { 'content-type': 'text/html' }).end(readFileSync(path.join(repo, 'board', 'index.html')));
  } else {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found\n');
  }
}).on('error', (error) => {
  process.stderr.write(`board-server: ${error.message}\n`);
  process.exit(1);
}).listen(config.port, flag('--host', config.host));
