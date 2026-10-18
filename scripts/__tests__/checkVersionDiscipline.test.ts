/**
 * Proves the per-commit class gate: a subject typed `feat` must take the
 * minor, every other non-merge subject the single patch, and a major only
 * through the owner's recorded order in the allowlist.
 *
 * Every fixture builds a throwaway git repository whose HEAD plays the role
 * the parent commit plays at commit-msg time, so no test reads this
 * repository's own history.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

const SCRIPT = join(__dirname, '..', 'check-version-discipline.js');
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

const fixtureDirs: string[] = [];

const makeRepo = (): Repo => {
  const dir = mkdtempSync(join(tmpdir(), 'disc-'));
  fixtureDirs.push(dir);
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

// At commit-msg time the index holds the version being committed, so every
// case stages its candidate before spawning the gate.
const stage = (repo: Repo, version: string): void => {
  repo.worktreeVersion(version);
  git(repo.dir, 'add', 'app.json');
};

const run = (repo: Repo, subject: string, extraArgs: string[] = []) => {
  const message = join(repo.dir, '.git', 'DISCIPLINE_MSG');
  writeFileSync(message, `${subject}\n`);
  return spawnSync('node', [SCRIPT, '--message-file', message, ...extraArgs], {
    cwd: repo.dir,
    encoding: 'utf8',
    env: cleanEnv(),
  });
};

afterEach(() => {
  for (const dir of fixtureDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-version-discipline', () => {
  it('feat subject takes the minor', () => {
    const repo = makeRepo();
    stage(repo, '1.1.0');

    const out = run(repo, '1.1.0 - feat(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.0.0 -> 1.1.0 (minor, feat)\n');
  });

  it('feat subject with a patch delta fails', () => {
    const repo = makeRepo();
    stage(repo, '1.0.1');

    const out = run(repo, '1.0.1 - feat(x): y');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL feat requires a minor/);
  });

  it('non-feat subject takes the patch', () => {
    const repo = makeRepo();
    stage(repo, '1.0.1');

    const out = run(repo, '1.0.1 - fix(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.0.0 -> 1.0.1 (patch, fix)\n');
  });

  it('untyped subject takes the patch', () => {
    const repo = makeRepo();
    stage(repo, '1.0.1');

    const out = run(repo, '1.0.1 - plain subject');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.0.0 -> 1.0.1 (patch, untyped)\n');
  });

  it('non-feat subject with a minor delta fails', () => {
    const repo = makeRepo();
    stage(repo, '1.1.0');

    const out = run(repo, '1.1.0 - fix(x): y');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL only feat may take a minor/);
  });

  it('equal version fails', () => {
    const repo = makeRepo();
    stage(repo, '1.0.0');

    const out = run(repo, '1.0.0 - fix(x): y');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL version did not move/);
  });

  it('skipped patch fails', () => {
    const repo = makeRepo();
    stage(repo, '1.0.2');

    const out = run(repo, '1.0.2 - fix(x): y');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL .*\(1\.0\.0 -> 1\.0\.2\)\n$/);
  });

  it('minor with nonzero patch fails', () => {
    const repo = makeRepo();
    repo.commit('1.0.5', 'parent');
    stage(repo, '1.1.2');

    const out = run(repo, '1.1.2 - fix(x): y');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL/);
  });

  it('major without allowlist fails', () => {
    const repo = makeRepo();
    repo.commit('1.9.3', 'parent');
    stage(repo, '2.0.0');

    const out = run(repo, '2.0.0 - feat(x): generational');
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^DISCIPLINE FAIL major versions are the owner's alone/);
  });

  it('major with allowlist entry passes', () => {
    const repo = makeRepo();
    repo.commit('1.9.3', 'parent');
    stage(repo, '2.0.0');
    const allowlist = join(repo.dir, 'major-allowlist.json');
    writeFileSync(allowlist, '[{ "version": "2.0.0", "reason": "test ruling" }]');

    const out = run(repo, '2.0.0 - feat(x): generational', ['--allowlist', allowlist]);
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.9.3 -> 2.0.0 (major, feat)\n');
  });

  it('merge in flight is skipped', () => {
    const repo = makeRepo();
    repo.branch('other');
    writeFileSync(join(repo.dir, 'other.txt'), 'the other side of a merge');
    git(repo.dir, 'add', '-A');
    git(repo.dir, 'commit', '-q', '-m', '1.0.0 - other side');
    const other = git(repo.dir, 'rev-parse', 'other').trim();
    git(repo.dir, 'checkout', '-q', 'main');
    // Git does not export MERGE_HEAD to hooks: the ref file itself must gate.
    writeFileSync(join(repo.dir, '.git', 'MERGE_HEAD'), `${other}\n`);

    const out = run(repo, '1.0.0 - fix(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE SKIP merge in flight\n');
    rmSync(join(repo.dir, '.git', 'MERGE_HEAD'));
  });

  it('the first minor over the 10xx line', () => {
    const repo = makeRepo();
    repo.commit('2.0.1053', 'parent');
    stage(repo, '2.1.0');

    const out = run(repo, '2.1.0 - feat(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 2.0.1053 -> 2.1.0 (minor, feat)\n');
  });

  it('featur is not feat', () => {
    const repo = makeRepo();
    stage(repo, '1.0.1');

    const out = run(repo, '1.0.1 - featur(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.0.0 -> 1.0.1 (patch, untyped)\n');
  });

  it('subject without the version prefix still parses', () => {
    const repo = makeRepo();
    stage(repo, '1.1.0');

    const out = run(repo, 'feat(x): y');
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('DISCIPLINE OK 1.0.0 -> 1.1.0 (minor, feat)\n');
  });
});

describe('check-version-discipline merge check', () => {
  const runMergeCheck = (repo: Repo) =>
    spawnSync('node', [SCRIPT, '--merge-check'], {
      cwd: repo.dir,
      encoding: 'utf8',
      env: cleanEnv(),
    });

  it('increasing incoming version passes', () => {
    const repo = makeRepo();
    repo.commit('2.0.1050', 'parent');
    stage(repo, '2.1.0');

    const out = runMergeCheck(repo);
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('MERGE VERSION OK 2.0.1050 -> 2.1.0\n');
  });

  it('equal incoming version fails', () => {
    const repo = makeRepo();
    repo.commit('2.0.1050', 'parent');
    stage(repo, '2.0.1050');

    const out = runMergeCheck(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^MERGE VERSION FAIL/);
  });

  it('lower incoming version fails', () => {
    const repo = makeRepo();
    repo.commit('2.1.0', 'parent');
    stage(repo, '2.0.1053');

    const out = runMergeCheck(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('MERGE VERSION FAIL 2.1.0 -> 2.0.1053 (rebase and renumber onto the higher line)\n');
  });

  it('missing staged app.json fails', () => {
    const repo = makeRepo();
    repo.commit('2.0.1050', 'parent');
    git(repo.dir, 'rm', '--cached', 'app.json');

    const out = runMergeCheck(repo);
    expect(out.status).toBe(1);
    expect(out.stdout).toMatch(/^MERGE VERSION FAIL no staged app.json/);
  });
});
