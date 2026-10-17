/**
 * Proves the hook-path pin: the tracked .husky/ directory can serve as git's
 * hooks path with no generated shim, and pin-hooks.js sets exactly that.
 *
 * The second test pins the defect this ticket exists to kill: with
 * core.hooksPath at the gitignored .husky/_ and no install, git runs nothing
 * and an unhooked commit passes green.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Under a git hook the process inherits GIT_DIR, GIT_INDEX_FILE and friends,
// which would point every fixture's git at the real repository instead of the
// fixture: the spawned git must start from the plain environment.
const cleanEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_NAMESPACE']) {
    delete env[key];
  }
  return env;
};

const SCRIPT = join(__dirname, '..', 'pin-hooks.js');

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
    cwd,
    encoding: 'utf8',
    env: cleanEnv(),
  });

const makeRepo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pinhooks-'));
  git(dir, 'init', '-q');
  return dir;
};

const commitAll = (dir: string, message: string): void => {
  git(dir, 'add', '-A');
  git(dir, 'commit', '--no-verify', '-q', '-m', message);
};

describe('pin-hooks', () => {
  it('sets core.hooksPath to .husky in a git repository', () => {
    const dir = makeRepo();
    const out = spawnSync('node', [SCRIPT], { cwd: dir, encoding: 'utf8', env: cleanEnv() });

    expect(out.status).toBe(0);
    expect(out.stdout.trim()).toBe('core.hooksPath -> .husky');
    expect(git(dir, 'config', 'core.hooksPath').trim()).toBe('.husky');
  });

  it('runs the tracked hook with hooksPath .husky and no installed shim, and skips it with a missing .husky/_', () => {
    const dir = makeRepo();
    mkdirSync(join(dir, '.husky'));
    writeFileSync(join(dir, '.husky', 'pre-commit'), '#!/bin/sh\necho ran > hook-ran.txt\nexit 1\n', { mode: 0o755 });
    writeFileSync(join(dir, 'a.txt'), 'a');
    commitAll(dir, 'root');

    // The guarded world: the tracked directory is the hooks path.
    git(dir, 'config', 'core.hooksPath', '.husky');
    writeFileSync(join(dir, 'b.txt'), 'b');
    git(dir, 'add', '-A');
    const hooked = spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'x'], {
      cwd: dir,
      encoding: 'utf8',
      env: cleanEnv(),
    });
    expect(hooked.status).not.toBe(0);
    expect(existsSync(join(dir, 'hook-ran.txt'))).toBe(true);

    // The defect, pinned: a hooksPath whose directory does not exist is
    // silently skipped and the commit passes green.
    const marker = join(dir, 'hook-ran.txt');
    require('node:fs').rmSync(marker);
    git(dir, 'config', 'core.hooksPath', '.husky/_');
    writeFileSync(join(dir, 'c.txt'), 'c');
    git(dir, 'add', '-A');
    const unhooked = spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'y'], {
      cwd: dir,
      encoding: 'utf8',
      env: cleanEnv(),
    });
    expect(unhooked.status).toBe(0);
    expect(existsSync(marker)).toBe(false);
  });

  it('exits 0 silently outside a git repository and skips a bare one with one line', () => {
    const empty = mkdtempSync(join(tmpdir(), 'no-repo-'));
    const outside = spawnSync('node', [SCRIPT], { cwd: empty, encoding: 'utf8', env: cleanEnv() });
    expect(outside.status).toBe(0);
    expect(outside.stdout).toBe('');

    const bare = mkdtempSync(join(tmpdir(), 'bare-'));
    git(bare, 'init', '-q', '--bare');
    const bareRun = spawnSync('node', [SCRIPT], { cwd: bare, encoding: 'utf8', env: cleanEnv() });
    expect(bareRun.status).toBe(0);
    expect(bareRun.stdout.trim()).toBe('bare repository, no hooks path pinned');
  });
});
