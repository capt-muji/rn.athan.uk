/**
 * The stage-one string guard (R5.1): the AST scanner runs on every commit and refuses a
 * display literal in any module the migration has already emptied. The allowlist is the
 * set of not-yet-migrated modules and shrinks to zero at step 14.
 *
 * The data modules (help, whatsNew) never hold JSX, so rule 1/2 cannot see them; the
 * second rule below reads their source instead: they must import from '@/shared/i18n'
 * and resolve their entries through t(), never through a free-standing helper.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '../..');
const ALLOWLIST = path.join(ROOT, 'scripts/string-census-allowlist.json');

const DATA_MODULES = ['shared/help.ts', 'shared/whatsNew.ts'] as const;

describe('the string census guard', () => {
  it('holds no display literals outside the allowlist', () => {
    let offenders = '';
    try {
      // The scanner takes argv[2] as an optional root; '' keeps its default roots while
      // the --guard flag travels behind it
      execFileSync('node', ['scripts/scan-strings.mjs', '', '--guard', 'scripts/string-census-allowlist.json'], {
        cwd: ROOT,
        stdio: 'pipe',
      });
    } catch (error) {
      offenders = String((error as { stderr?: Buffer }).stderr ?? '');
    }

    expect(offenders).toBe('');
  });

  it('keeps the allowlist sorted and free of the migrated modules', () => {
    const allowlist: string[] = JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8'));
    expect([...allowlist].sort()).toEqual(allowlist);
    for (const migrated of ['components/sheets/screens/Settings.tsx']) {
      expect(allowlist).not.toContain(migrated);
    }
  });

  it('resolves the data modules through the catalog, never a helper', () => {
    for (const module of DATA_MODULES) {
      const source = fs.readFileSync(path.join(ROOT, module), 'utf8');
      expect(source).toContain("from '@/shared/i18n'");
      expect(source).not.toMatch(/const get\w*String|function get\w*String/);
      expect(source).toContain('t(');
    }
  });
});
