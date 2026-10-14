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
    const migrated = [
      'app/Navigation.tsx',
      'app/_layout.tsx',
      'app/index.tsx',
      'components/sheets/screens/Settings.tsx',
      'components/countdown/Bar.tsx',
      'components/day/Day.tsx',
      'components/modals/Help.tsx',
      'components/modals/Modal.tsx',
      'components/modals/Update.tsx',
      'components/modals/WhatsNew.tsx',
      'components/overlay/Overlay.tsx',
      'components/overlay/OverlayInfoBox.tsx',
      'components/overlay/VeilBackdrop.tsx',
      'components/prayer/Alert.tsx',
      'components/prayer/Explanation.tsx',
      'components/sheets/parts/SegmentedControl.tsx',
      'components/sheets/parts/SoundItem.tsx',
      'components/sheets/parts/Stepper.tsx',
      'components/sheets/parts/Toggle.tsx',
      'components/sheets/screens/Alert.tsx',
      'components/sheets/screens/ColorPicker.tsx',
      'components/sheets/screens/Qibla.tsx',
      'components/sheets/screens/QiblaCompass.tsx',
      'components/sheets/screens/QiblaWave.tsx',
      'components/sheets/screens/ReminderCard.tsx',
      'components/sheets/screens/Sound.tsx',
      'components/ui/Error.tsx',
      'components/ui/Glow.tsx',
      'components/ui/RamadanDecorations.tsx',
      'components/ui/SettingsButton.tsx',
    ];
    for (const file of migrated) {
      expect(allowlist).not.toContain(file);
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

  it('holds zero display literals outside the catalog', () => {
    const allowlist: string[] = JSON.parse(fs.readFileSync(ALLOWLIST, 'utf8'));
    expect(allowlist).toEqual([]);
    // The exit-0 proof is the first test's empty-offenders assertion over the
    // empty list; this pins the emptiness itself, so a re-added entry fails
    // here even if its file were somehow clean
  });

  it('the data modules export keys only', () => {
    const census = execFileSync('node', ['scripts/scan-strings.mjs', ''], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    const dataModuleRows: Array<{ file: string; kind: string }> = JSON.parse(census).rows.filter(
      (row: { kind: string }) => row.kind === 'data-module'
    );
    expect(dataModuleRows).toEqual([]);
  });

  it('holds the native language names as names data, not copy', () => {
    const source = fs.readFileSync(path.join(ROOT, 'shared/languageNames.ts'), 'utf8');
    // A spaced name is exactly what the data-module rule would flag without the
    // name-field allowance
    expect(source).toContain("'Bahasa Melayu'");
    const census = execFileSync('node', ['scripts/scan-strings.mjs', ''], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    const namesRows: Array<{ file: string; kind: string }> = JSON.parse(census).rows.filter(
      (row: { file: string }) => row.file === 'shared/languageNames.ts'
    );
    expect(namesRows).toEqual([]);
  });

  it('holds the compass ring’s bearings as module data, not catalog copy', () => {
    const source = fs.readFileSync(path.join(ROOT, 'shared/qiblaCompass.ts'), 'utf8');
    // The owner's 2026-10-14 ruling made the ring the four Latin degree numbers,
    // identical in every language, so the module holds no qibla.cardinal key and
    // reads no catalog at all
    expect(source).toContain('CARDINAL_ANGLES');
    expect(source).not.toContain('qibla.cardinal');
    expect(source).not.toMatch(/letter: '/);
    const census = execFileSync('node', ['scripts/scan-strings.mjs', ''], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    // The path builders' 'M...A...' templates are review-kind rows, not copy
    const compassRows: Array<{ file: string; kind: string }> = JSON.parse(census).rows.filter(
      (row: { file: string; kind: string }) =>
        row.file === 'shared/qiblaCompass.ts' && (row.kind.startsWith('display') || row.kind === 'data-module')
    );
    expect(compassRows).toEqual([]);
  });
});
