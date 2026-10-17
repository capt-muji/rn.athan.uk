/**
 * Proves the audit gate: an audit that dispatched reviewers cannot close
 * without recorded ranges and findings files that exist at check time.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(__dirname, '..', 'check-audit.sh');

const run = (folder: string) => spawnSync('bash', [SCRIPT, folder], { encoding: 'utf8' });

const makeDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'audit-'));
  fixtureDirs.push(dir);
  return dir;
};

const fixtureDirs: string[] = [];

afterEach(() => {
  for (const dir of fixtureDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-audit', () => {
  it('fails without AUDIT.md', () => {
    const dir = makeDir();
    const out = run(dir);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('AUDIT CHECK FAILED');
  });

  it('fails when a pass has no Range line', () => {
    const dir = makeDir();
    const findings = join(dir, 'f1.md');
    writeFileSync(findings, '## FINDINGS\nNone.\n');
    writeFileSync(
      join(dir, 'AUDIT.md'),
      `## Pass 1 - blind\n\nFindings: ${findings}\n\n## Pass 2 - plan\n\nRange: a..b\n\nFindings: ${findings}`
    );
    const out = run(dir);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('no Range');
  });

  it('fails when a findings file is missing or empty', () => {
    const dir = makeDir();
    const empty = join(dir, 'empty.md');
    writeFileSync(empty, '');
    writeFileSync(
      join(dir, 'AUDIT.md'),
      `## Pass 1 - blind\n\nRange: 1111111..2222222\n\nFindings: ${empty}\n\n## Pass 2 - plan\n\nRange: origin/uat..uat\n\nFindings: ${join(dir, 'gone.md')}`
    );
    const out = run(dir);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('empty');
    expect(out.stdout).toContain('gone.md');
  });

  it('passes a well-formed two-pass audit', () => {
    const dir = makeDir();
    const f1 = join(dir, 'f1.md');
    const f2 = join(dir, 'f2.md');
    writeFileSync(f1, '## FINDINGS\nNone.\n');
    writeFileSync(f2, '## FINDINGS\n1. [nice] x - y - z\n');
    writeFileSync(
      join(dir, 'AUDIT.md'),
      `## Pass 1 - blind\n\nRange: 1111111..2222222\n\nFindings: ${f1}\n\n## Pass 2 - plan-conformance\n\nRange: origin/uat..uat\n\nFindings: ${f2}`
    );
    const out = run(dir);
    expect(out.status).toBe(0);
    expect(out.stdout.trim()).toBe('AUDIT OK');
  });
});
