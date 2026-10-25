/**
 * The privacy gate: the manifest's terms, the tree scan the pre-push suite runs, and the
 * identity check the pre-commit hook runs.
 *
 * Every sensitive string below is assembled from parts at run time or read from the encoded
 * manifest: a literal would be refused by the gate this suite tests, on the commit carrying it.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'check-identifiers.js');
const MANIFEST = join(ROOT, 'scripts', 'privacy-manifest.json');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
  terms: Array<{ rule: string; kind: 'term' | 'pattern'; source: string }>;
};

/** A term as the scanner compares it: the manifest stores the source base64-encoded */
const decoded = (source: string) => Buffer.from(source, 'base64').toString('utf8');

const terms = manifest.terms.map((entry) => ({ ...entry, decoded: decoded(entry.source) }));

const run = (args: string[], env: Record<string, string> = {}) => {
  try {
    execFileSync('node', [SCRIPT, ...args], { cwd: ROOT, env: { ...process.env, ...env }, stdio: 'pipe' });
    return 0;
  } catch (error) {
    return (error as { status?: number }).status ?? -1;
  }
};

const withFile = (text: string, body: (path: string) => void) => {
  const dir = mkdtempSync(join(tmpdir(), 'privacy-gate-'));
  const file = join(dir, 'record.md');
  writeFileSync(file, text);

  try {
    body(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe('the encoded manifest', () => {
  it('carries at least one term and no plain-text term', () => {
    expect(terms.length).toBeGreaterThan(0);

    for (const entry of terms) {
      expect(entry.decoded.length).toBeGreaterThan(0);
      expect(entry.source).not.toBe(entry.decoded);
    }
  });

  it('is not itself a hit', () => {
    expect(run(['--file', MANIFEST])).toBe(0);
  });
});

describe('the scanner over a file', () => {
  it.each(terms.map((entry) => entry.rule))('refuses a fixture carrying the %s term', (rule) => {
    const entry = terms.find((candidate) => candidate.rule === rule)!;
    const fixture = entry.kind === 'term' ? entry.decoded : `${entry.decoded.replace(/\(\?<!.*?\)/g, '')}`;

    withFile(`an ordinary line naming ${fixture} in passing\n`, (file) => {
      expect(run(['--file', file])).toBe(1);
    });
  });

  it('accepts the same line with the term replaced by its placeholder', () => {
    withFile('an ordinary line naming OWNER_NAME in passing\n', (file) => {
      expect(run(['--file', file])).toBe(0);
    });
  });
});

describe('the repository tree', () => {
  it('carries no manifest term and no identifier shape', () => {
    expect(run(['--all'])).toBe(0);
  });
});

describe('the commit identity', () => {
  const pseudonym = { GIT_AUTHOR_NAME: 'Athan', GIT_AUTHOR_EMAIL: 'athan@athan.uk' };

  it('accepts an identity carrying no manifest term', () => {
    expect(run(['--identity'], pseudonym)).toBe(0);
  });

  it('refuses an identity carrying an owner name', () => {
    const first = terms.find((entry) => entry.kind === 'term')!;
    const email = `${first.decoded}@example.com`;

    expect(run(['--identity'], { ...pseudonym, GIT_AUTHOR_EMAIL: email })).toBe(1);
  });
});
