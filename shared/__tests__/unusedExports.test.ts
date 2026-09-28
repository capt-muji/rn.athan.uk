/**
 * No exported symbol is unreachable from production code
 *
 * Biome's noUnusedImports only sees imports, never an export nobody imports, so a symbol can sit
 * at 100% coverage from its own tests while nothing on screen reaches it. This closes that gap at
 * the commit that opens it.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Symbols that report unreachable and are correct to keep, each with the mechanism that reaches
 * them. Anything not listed here is dead code: delete the symbol and its tests together.
 */
const REACHED_WITHOUT_AN_IMPORT: Record<string, string> = {
  ErrorBoundary: 'Expo Router renders it by file convention, so no file imports it',
  KAABA: 'adhan keeps its own copy private, so this states it for the test that pins the two together',
  MAX_WHATS_NEW_ITEMS: 'A limit on the copy in shared/whatsNew.ts, enforced only at test time',
  MAX_WHATS_NEW_ARCHIVE: 'A limit on the copy in shared/whatsNew.ts, enforced only at test time',
  MAX_WHATS_NEW_TITLE_LENGTH: 'A limit on the copy in shared/whatsNew.ts, enforced only at test time',
  MAX_WHATS_NEW_BODY_LENGTH: 'A limit on the copy in shared/whatsNew.ts, enforced only at test time',
};

const ROOT = join(__dirname, '..', '..');

/** Every `<file>: <symbol>` the sweep reports, as the script prints them */
const sweepUnreachable = (): string[] => {
  const output = execFileSync('python3', [join(ROOT, 'scripts', 'find-unused-exports.py')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .filter((line) => line.startsWith('  ') && line.includes(': '))
    .map((line) => line.trim());
};

describe('exported symbols reachable from production code', () => {
  it('reports only the symbols a framework or a test-time rule reaches', () => {
    const unexpected = sweepUnreachable().filter((entry) => {
      const symbol = entry.slice(entry.lastIndexOf(': ') + 2);
      return !(symbol in REACHED_WITHOUT_AN_IMPORT);
    });

    expect(unexpected).toEqual([]);
  });

  it('keeps every allow-list entry earning its place, so a stale reason cannot hide a live symbol', () => {
    const reported = sweepUnreachable().map((entry) => entry.slice(entry.lastIndexOf(': ') + 2));

    expect(reported.sort()).toEqual(Object.keys(REACHED_WITHOUT_AN_IMPORT).sort());
  });
});
