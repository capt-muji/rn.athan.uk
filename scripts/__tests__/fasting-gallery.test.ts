/**
 * The T-623 gallery generator's gates, driven end-to-end as a CLI (the stringGuard
 * execFileSync house pattern) over fixture directories under os.tmpdir(), never a
 * repository path: the happy path renders one card per catalog row with every
 * interpolated string HTML-escaped and every image copied and re-verified on disk,
 * a missing screenshot fails before anything is written with every gap named on
 * stderr, and the page holds exactly the rows the catalog gave it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'fasting-layouts-gallery.mjs');

interface CatalogRow {
  index: number;
  id: string;
  name: string;
  archetype: string;
  hidesExplanations: boolean;
}

let catalogDir = '';
let shotsDir = '';
let outDir = '';

const shotName = (row: CatalogRow) => `variant-${String(row.index).padStart(2, '0')}-${row.id}.png`;

const writeCatalog = (rows: CatalogRow[]) => {
  const file = join(catalogDir, 'catalog.json');
  writeFileSync(file, `${JSON.stringify(rows, null, 1)}\n`);
  return file;
};

const writeShot = (row: CatalogRow, bytes: number[]) => {
  writeFileSync(join(shotsDir, shotName(row)), Buffer.from(bytes));
};

const runScript = (catalogPath: string) =>
  execFileSync('node', [SCRIPT, catalogPath, shotsDir, outDir], { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });

const runFailing = (catalogPath: string): { status: number; stderr: string } => {
  try {
    runScript(catalogPath);
  } catch (error) {
    const err = error as { status?: number; stderr?: Buffer | string };
    return { status: err.status ?? -1, stderr: String(err.stderr ?? '') };
  }
  return { status: 0, stderr: '' };
};

beforeEach(() => {
  catalogDir = mkdtempSync(join(tmpdir(), 'fasting-gallery-cat-'));
  shotsDir = mkdtempSync(join(tmpdir(), 'fasting-gallery-shots-'));
  outDir = mkdtempSync(join(tmpdir(), 'fasting-gallery-out-'));
});

afterEach(() => {
  for (const dir of [catalogDir, shotsDir, outDir]) rmSync(dir, { recursive: true, force: true });
});

describe('the fasting-layouts gallery generator', () => {
  it('renders one card per row: names, archetypes, relative img srcs, the hints-hidden chip on the hiding rows, and the images on disk', () => {
    const rows: CatalogRow[] = [
      { index: 1, id: 'alpha-rows', name: 'Alpha & Beta Rows', archetype: 'Radio Rows', hidesExplanations: false },
      { index: 2, id: 'beta-cards', name: 'Beta Cards', archetype: 'Fill Cards', hidesExplanations: true },
      { index: 3, id: 'gamma-drum', name: 'Gamma Drum', archetype: 'Wheel', hidesExplanations: true },
    ];
    const catalogPath = writeCatalog(rows);
    rows.forEach((row, i) => {
      writeShot(row, [0x89, 0x50, 0x4e, 0x47 + i]);
    });

    runScript(catalogPath);

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    // Every interpolated string escaped: the ampersand in the first name never leaks raw
    expect(html).toContain('#1 Alpha &amp; Beta Rows');
    expect(html).toContain('#2 Beta Cards');
    expect(html).toContain('#3 Gamma Drum');
    expect(html).toContain('Radio Rows');
    expect(html).toContain('Fill Cards');
    expect(html).toContain('Wheel');
    expect(html).toContain('src="images/variant-01-alpha-rows.png"');
    expect(html).toContain('src="images/variant-02-beta-cards.png"');
    expect(html).toContain('src="images/variant-03-gamma-drum.png"');
    expect(html).not.toContain('Alpha & B');
    // The chip rides exactly the two hints-hiding rows
    expect((html.match(/hints hidden/g) ?? []).length).toBe(2);
    // Every image copied whole into outDir/images
    for (const [i, row] of rows.entries()) {
      expect(existsSync(join(outDir, 'images', shotName(row)))).toBe(true);
      expect(readFileSync(join(outDir, 'images', shotName(row)))).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47 + i]));
    }
  });

  it('fails before writing anything when screenshots are missing, naming every gap on stderr', () => {
    const rows: CatalogRow[] = [
      { index: 1, id: 'present-rows', name: 'Present Rows', archetype: 'Radio Rows', hidesExplanations: false },
      { index: 2, id: 'absent-cards', name: 'Absent Cards', archetype: 'Fill Cards', hidesExplanations: true },
      { index: 3, id: 'absent-drum', name: 'Absent Drum', archetype: 'Wheel', hidesExplanations: true },
    ];
    const catalogPath = writeCatalog(rows);
    writeShot(rows[0], [0x89, 0x50]);

    const { status, stderr } = runFailing(catalogPath);

    expect(status).not.toBe(0);
    expect(stderr).toContain('variant-02-absent-cards.png');
    expect(stderr).toContain('variant-03-absent-drum.png');
    expect(existsSync(join(outDir, 'index.html'))).toBe(false);
    expect(existsSync(join(outDir, 'images'))).toBe(false);
  });

  it('references exactly the rows the catalog gives: a two-row fixture yields exactly two cards', () => {
    const rows: CatalogRow[] = [
      { index: 7, id: 'two-a', name: 'Two A', archetype: 'Stepper', hidesExplanations: false },
      { index: 8, id: 'two-b', name: 'Two B', archetype: 'Dropdown', hidesExplanations: true },
    ];
    const catalogPath = writeCatalog(rows);
    for (const row of rows) writeShot(row, [0x01]);

    runScript(catalogPath);

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect((html.match(/class="card"/g) ?? []).length).toBe(2);
    expect((html.match(/<img /g) ?? []).length).toBe(2);
    expect(html).toContain('#7 Two A');
    expect(html).toContain('#8 Two B');
    for (const row of rows) expect(existsSync(join(outDir, 'images', shotName(row)))).toBe(true);
  });
});
