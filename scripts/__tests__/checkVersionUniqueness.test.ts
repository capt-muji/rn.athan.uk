/**
 * Proves the cross-commit version gate: one version number may be carried by
 * only one non-merge commit across the unpushed union, with the staged bump
 * counted as a candidate unless a merge is in flight.
 *
 * Every fixture builds a throwaway git repository whose base ref plays the
 * role origin/uat plays in the real one, so no test reads this repository's
 * own history.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
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

const SCRIPT = join(__dirname, '..', 'check-version-uniqueness.js');
const BASE = 'refs/remotes/origin/uat';

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
    cwd,
    encoding: 'utf8',
    env: cleanEnv(),
  });

type Repo = {
  dir: string;
  branch: (name: string) => void;
  commit: (version: string, message: string) => string;
  worktreeVersion: (version: string) => void;
};

const makeRepo = (): Repo => {
  const dir = mkdtempSync(join(tmpdir(), 'uniq-'));
  writeFileSync(join(dir, 'app.json'), '{"expo": {"version": "1.0.0"}}');
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'root');
  // The base ref stands in for origin/uat: everything after it is checked.
  git(dir, 'update-ref', BASE, git(dir, 'rev-parse', 'HEAD').trim());
  const branch = (name: string): void => {
    git(dir, 'checkout', '-q', '-b', name, 'main');
  };
  const commit = (version: string, message: string): string => {
    writeFileSync(join(dir, 'app.json'), `{"expo": {"version": "${version}"}}`);
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', `${version} - ${message}`);
    return git(dir, 'rev-parse', 'HEAD').trim();
  };
  const worktreeVersion = (version: string): void => {
    writeFileSync(join(dir, 'app.json'), `{"expo": {"version": "${version}"}}`);
  };
  return { dir, branch, commit, worktreeVersion };
};

const run = (repo: Repo, allowlist?: string, env: Record<string, string> = {}) =>
  spawnSync('node', [SCRIPT, '--base', BASE, ...(allowlist ? ['--allowlist', allowlist] : [])], {
    cwd: repo.dir,
    encoding: 'utf8',
    env: { ...cleanEnv(), ...env },
  });

describe('check-version-uniqueness', () => {
  it('fails when two branches carry one version', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.commit('1.0.1', 'on main');

    const out = run(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/VERSION COLLISION 1\.0\.1: \w+ \w+/);
  });

  it('passes when branch versions are unique', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.commit('1.0.2', 'on main');

    const out = run(repo);
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSIONS OK \d+ commits/);
  });

  it('grandfathers an allowlisted version', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.commit('1.0.1', 'on main');
    const allowlist = join(repo.dir, 'allowlist.json');
    writeFileSync(allowlist, '[{"version": "1.0.1", "reason": "history"}]');

    const out = run(repo, allowlist);
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSION GRANDFATHERED 1\.0\.1/);
  });

  it('fails when the staged bump equals another branch version', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.worktreeVersion('1.0.1');

    const out = run(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/VERSION COLLISION 1\.0\.1: \w+ staged/);
  });

  it('skips the candidate while MERGE_HEAD is set', () => {
    const repo = makeRepo();
    repo.branch('x');
    const tip = repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    // The merge station's worktree already holds the lane's version while
    // HEAD is still the base side: MERGE_HEAD being set must skip it.
    repo.worktreeVersion('1.0.1');

    const out = run(repo, undefined, { MERGE_HEAD: tip });
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSIONS OK/);
  });

  it('skips the candidate while the MERGE_HEAD ref exists without the env var', () => {
    const repo = makeRepo();
    repo.branch('x');
    const tip = repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.worktreeVersion('1.0.1');
    // Git does not export MERGE_HEAD to hooks: the ref file itself must gate.
    writeFileSync(join(repo.dir, '.git', 'MERGE_HEAD'), `${tip}\n`);

    const out = run(repo);
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSIONS OK/);
    require('node:fs').rmSync(join(repo.dir, '.git', 'MERGE_HEAD'));
  });

  it('skips the candidate under the merge hook --no-candidate flag', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    repo.worktreeVersion('1.0.1');

    const out = spawnSync('node', [SCRIPT, '--base', BASE, '--no-candidate'], {
      cwd: repo.dir,
      encoding: 'utf8',
      env: cleanEnv(),
    });
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSIONS OK/);
  });

  it('excludes merge commits', () => {
    const repo = makeRepo();
    repo.branch('x');
    repo.commit('1.0.1', 'on x');
    git(repo.dir, 'checkout', '-q', 'main');
    git(repo.dir, 'merge', '--no-ff', '-q', 'x', '-m', 'merge repeats the landed version');

    const out = run(repo);
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/VERSIONS OK/);
  });

  it('fails a same-branch missed bump', () => {
    const repo = makeRepo();
    repo.commit('1.0.1', 'first');
    writeFileSync(join(repo.dir, 'b.txt'), 'the next change, same number');
    git(repo.dir, 'add', '-A');
    git(repo.dir, 'commit', '-q', '-m', '1.0.1 - missed the bump');

    const out = run(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/VERSION COLLISION 1\.0\.1/);
  });
});
