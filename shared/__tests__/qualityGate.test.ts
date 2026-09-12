/**
 * Guards the one quality gate this repo has
 *
 * There is no CI. The pre-commit hook is the only thing standing between a
 * broken change and a release build, and it used to be excluded from version
 * control: `.gitignore` ignored all of `.husky`, and `package.json` declared no
 * `prepare` script, so a fresh clone installed no hook at all. Clone, install,
 * commit — no typecheck, no lint, no tests. The gate existed on exactly one
 * machine.
 *
 * These tests pin the three halves of that gate so it cannot silently go
 * missing again: the hook is tracked, `prepare` reinstalls husky's plumbing on
 * every install, and `validate` fails on warnings rather than printing them.
 * The last one matters because `biome.json` sets `useExhaustiveDependencies` to
 * `warn`, and a missing dependency in a countdown or prayer-sequence hook is a
 * stale closure holding a prayer time that never refreshes.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const HOOK = join('.husky', 'pre-commit');

const gitignoreLines = (): string[] =>
  readFileSync(join(ROOT, '.gitignore'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

const scripts = (): Record<string, string> =>
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts ?? {};

/** Paths git has in the index, which is what a fresh clone actually receives */
const trackedUnder = (path: string): string[] =>
  execFileSync('git', ['ls-files', '--', path], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((line) => line !== '');

// =============================================================================
// THE HOOK REACHES A FRESH CLONE
// =============================================================================

describe('the pre-commit hook is version controlled', () => {
  it('is tracked by git', () => {
    expect(trackedUnder('.husky')).toContain('.husky/pre-commit');
  });

  it('is not ignored: .gitignore excludes only husky generated plumbing', () => {
    const lines = gitignoreLines();

    expect(lines).toContain('.husky/_');
    expect(lines).not.toContain('.husky');
    expect(lines).not.toContain('.husky/');
  });

  it('is executable, or git will not run it', () => {
    expect(statSync(join(ROOT, HOOK)).mode & 0o100).toBe(0o100);
  });

  it('runs lint-staged and the full validate gate', () => {
    const hook = readFileSync(join(ROOT, HOOK), 'utf8');

    expect(hook).toContain('lint-staged');
    expect(hook).toContain('yarn validate');
  });
});

// =============================================================================
// INSTALLING THE PROJECT INSTALLS THE HOOK
// =============================================================================

describe('husky is wired into install', () => {
  it('declares a prepare script, so yarn install arms the hook', () => {
    expect(scripts().prepare).toContain('husky install');
  });

  it('does not let clean delete the tracked hook', () => {
    const clean = scripts().clean ?? '';

    // `rm -rf .husky` would delete a tracked file; only the generated `_` may go
    expect(clean).not.toMatch(/\s\.husky(\s|$)/);
  });

  it('never rewrites the tracked hook: husky add appends on every run', () => {
    expect(scripts().husky ?? '').not.toContain('husky add');
  });
});

// =============================================================================
// THE GATE ACTUALLY FAILS
// =============================================================================

describe('validate fails on warnings', () => {
  it('passes --error-on-warnings to biome', () => {
    const validate = scripts().validate ?? '';

    expect(validate).toContain('biome check');
    expect(validate).toContain('--error-on-warnings');
  });

  it('still runs the typecheck and the suite', () => {
    const validate = scripts().validate ?? '';

    expect(validate).toContain('tsc --noEmit');
    expect(validate).toContain('jest');
  });
});
