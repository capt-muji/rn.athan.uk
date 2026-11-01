/**
 * The CJK glyph lock (plan T-419 decision 8, grown by T-452, narrowed by T-537 to
 * the zh-Hans, ja and ko pairs when the Traditional catalog retired): the bundled
 * CJK subsets are cut over a
 * closed string set - every character of each CJK catalog, its native-strings row,
 * its widget-statics row, its endonym, and the What's New keys that resolve through
 * the catalog - and this gate recomputes that set from the committed files and diffs
 * it against the lock generated from the subsets' own cmaps. A catalog byte the
 * subsets miss fails here naming the character, and a byte the strings dropped
 * leaves a stale lock character named the same way, so the subsets and the strings
 * cannot drift apart silently. Regenerate with the command in the lock's _comment.
 *
 * Cut state C3 (T-538 step 4): the zh-Hans and ja pairs are dropped - their locales
 * ride the OS fallback and the sheet regression is the pick rule's own gate on that
 * cost - so this lock carries the ko pair alone and the files binding names exactly
 * the KR pair. Nothing bundled carries either dropped endonym: the rows below prove
 * the drop is real, not a lock that merely stopped looking.
 */

import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import lock from '@/shared/i18n/cjk-glyph-lock.json';
import { ko } from '@/shared/i18n/ko';
import { nativeLanguageName } from '@/shared/languageNames';

const NATIVE = JSON.parse(readFileSync(join(__dirname, '..', 'i18n', 'native-strings.json'), 'utf8')) as Record<
  string,
  {
    NSLocationWhenInUseUsageDescription: string;
    NSUserNotificationsUsageDescription: string;
    gallery: Record<string, string>;
  }
>;
const STATICS = JSON.parse(readFileSync(join(__dirname, '..', 'i18n', 'widget-statics.json'), 'utf8')) as Record<
  string,
  Record<string, string>
>;

const CATALOGS = { ko } as const;
type CjkLocale = keyof typeof CATALOGS;

/**
 * The closed string set's every character, newline excepted (no cmap maps it): the
 * exact list decision 8 pins, so the gate and the generator read the same set
 */
const closedChars = (locale: CjkLocale): Set<string> => {
  const strings = [
    ...Object.values(CATALOGS[locale]),
    NATIVE[locale].NSLocationWhenInUseUsageDescription,
    NATIVE[locale].NSUserNotificationsUsageDescription,
    ...Object.values(NATIVE[locale].gallery),
    ...Object.values(STATICS[locale]),
    nativeLanguageName(locale),
  ];
  return new Set(
    strings
      .join('')
      .split('')
      .filter((ch) => ch !== '\n')
  );
};

const codepointOf = (ch: string): string => `U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;

// The pair-drop shape (C3): the ko pair stays whole while the zh-Hans and ja pairs
// leave the lock with their binaries - pure over the lock data so the probe row
// below can corrupt a copy and redden the same code the committed lock runs
const KR_FILES = ['NotoSansKR-Subset-Medium.ttf', 'NotoSansKR-Subset-Regular.ttf'];

const pairDropFailures = (lockData: Record<string, unknown>): string[] => {
  const rows: Array<string | null> = [];
  for (const locale of ['zh-Hans', 'ja']) {
    rows.push(rowWhen(locale in lockData, `${locale}: the lock still carries a dropped pair's character row`));
  }
  const files = Object.keys((lockData.files as Record<string, string>) ?? {}).sort();
  for (const name of files) {
    if (!KR_FILES.includes(name)) {
      rows.push(`files: the dropped pair's binary ${name} is still bound`);
    }
  }
  for (const name of KR_FILES) {
    if (!files.includes(name)) {
      rows.push(`files: the ko pair's ${name} lost its binding`);
    }
  }
  return rowsOf(rows);
};

describe('the CJK glyph lock', () => {
  it.each(['ko'] as const)('%s locks every character its closed string set carries', (locale) => {
    const locked = new Set(lock[locale].split(''));
    const failures: string[] = [];
    for (const ch of closedChars(locale)) {
      if (!locked.has(ch)) {
        failures.push(`${locale}: the lock lacks ${ch} ${codepointOf(ch)} - regenerate the subsets (lock _comment)`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(['ko'] as const)('%s keeps no character the strings have dropped', (locale) => {
    const closed = closedChars(locale);
    const failures: string[] = [];
    for (const ch of lock[locale].split('')) {
      if (!closed.has(ch)) {
        failures.push(
          `${locale}: the lock still carries ${ch} ${codepointOf(ch)} the strings dropped - regenerate the subsets (lock _comment)`
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it('carries the regenerating command in its header, the machine-read JSON pattern', () => {
    expect(lock._comment).toContain('node scripts/cjk-subset.mjs');
  });

  it('binds the committed subset binaries to the lock by sha256', () => {
    // The cmap rows above tie the lock to the strings, not to the files: a
    // re-cut shipping stale binaries would pass every glyph row while zh
    // renders tofu. The hashes close that hole - regenerate covers them.
    const files = (lock as { files?: Record<string, string> }).files ?? {};
    const names = Object.keys(files);
    expect(names).not.toEqual([]);
    for (const name of names) {
      const digest = createHash('sha256')
        .update(readFileSync(join(__dirname, '..', '..', 'assets', 'fonts', name)))
        .digest('hex');
      expect(`${name}: ${digest}`).toBe(`${name}: ${files[name]}`);
    }
  });

  it('carries no lock row or file binding for the dropped zh-Hans and ja pairs', () => {
    expect(pairDropFailures(lock as Record<string, unknown>)).toEqual([]);
  });
});

/**
 * The subsets' byte-level parity and integrity gate (T-538 step 1): the lock above ties
 * the subsets to the strings, but nothing tied the binaries' metrics, coverage or
 * checksums - the exact properties the 3T line-box hunt measured with fontTools, pinned
 * here hand-parsed the LanguageRowFaces DataView way because jest carries no font
 * library. The two fixture rows at the end prove the gate reddens (stringGuard's probe
 * pattern): the collectors are pure over the bytes, so the demos run the same code the
 * shipped faces run and assert the failure rows themselves.
 */

const FONTS_DIR = join(__dirname, '..', '..', 'assets', 'fonts');

type Script = 'SC' | 'JP' | 'KR';

const SUBSET_FACES: ReadonlyArray<{ name: string; script: Script }> = [
  { name: 'NotoSansKR-Subset-Regular.ttf', script: 'KR' },
  { name: 'NotoSansKR-Subset-Medium.ttf', script: 'KR' },
];

const FACE_ROWS = SUBSET_FACES.map((face) => [face.name, face.script] as const);

const ENDONYM: Record<Script, readonly number[]> = {
  SC: [0x7b80, 0x4f53, 0x4e2d, 0x6587],
  JP: [0x65e5, 0x672c, 0x8a9e],
  KR: [0xd55c, 0xad6d, 0xc5b4],
};

// The dropped pairs' endonyms: every bundled face must lack them, or the OS
// fallback the C3 state promises is not what renders the sheet's rows
const DROPPED_ENDONYMS = { SC: ENDONYM.SC, JP: ENDONYM.JP } as const;

const DIGITS_AND_PERIOD: readonly number[] = [...'0123456789.'].map((ch) => ch.charCodeAt(0));

interface MetricPin {
  property: string;
  table: string;
  field: number;
  pinned: number;
  signed: boolean;
  hex: boolean;
}

const PARITY_PINS: ReadonlyArray<MetricPin> = [
  { property: 'hhea ascender', table: 'hhea', field: 4, pinned: 1160, signed: true, hex: false },
  { property: 'hhea descender', table: 'hhea', field: 6, pinned: -288, signed: true, hex: false },
  { property: 'hhea lineGap', table: 'hhea', field: 8, pinned: 0, signed: true, hex: false },
  { property: 'OS/2 sTypoAscender', table: 'OS/2', field: 68, pinned: 880, signed: true, hex: false },
  { property: 'OS/2 sTypoDescender', table: 'OS/2', field: 70, pinned: -120, signed: true, hex: false },
  { property: 'OS/2 sTypoLineGap', table: 'OS/2', field: 72, pinned: 0, signed: true, hex: false },
  { property: 'OS/2 usWinAscent', table: 'OS/2', field: 74, pinned: 1160, signed: false, hex: false },
  { property: 'OS/2 usWinDescent', table: 'OS/2', field: 76, pinned: 288, signed: false, hex: false },
  { property: 'OS/2 fsSelection', table: 'OS/2', field: 62, pinned: 0x0040, signed: false, hex: true },
  { property: 'head unitsPerEm', table: 'head', field: 18, pinned: 1000, signed: false, hex: false },
];

const CHECKSUMMED_TABLES = ['hhea', 'head', 'OS/2', 'cmap'] as const;
const NAME_IDS = [1, 4, 6] as const;
const ADVANCE_FLOOR = 100;
const ADVANCE_CEILING = 2000;

interface TableRecord {
  checkSum: number;
  offset: number;
  length: number;
}

interface CmapSubtable {
  platform: number;
  encoding: number;
  format: number;
  at: number;
}

const rowWhen = (broken: boolean, row: string): string | null => (broken ? row : null);

const shown = (value: number, hex: boolean): string =>
  hex ? `0x${value.toString(16).padStart(4, '0')}` : String(value);

const rowsOf = (rows: ReadonlyArray<string | null>): string[] => rows.filter((row): row is string => row !== null);

const hex4 = (cp: number): string => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

const readFace = (name: string, dir: string = FONTS_DIR): { view: DataView; tables: Map<string, TableRecord> } => {
  const raw = readFileSync(join(dir, name));
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const tables = new Map<string, TableRecord>();
  for (let i = 0; i < view.getUint16(4); i++) {
    const at = 12 + i * 16;
    const tag = String.fromCharCode(
      view.getUint8(at),
      view.getUint8(at + 1),
      view.getUint8(at + 2),
      view.getUint8(at + 3)
    );
    tables.set(tag, {
      checkSum: view.getUint32(at + 4),
      offset: view.getUint32(at + 8),
      length: view.getUint32(at + 12),
    });
  }
  return { view, tables };
};

const tableAt = (tables: Map<string, TableRecord>, tag: string): TableRecord => tables.get(tag) as TableRecord;

const checksumOf = (view: DataView, start: number, length: number, zeroAdjustment: boolean): number => {
  const saved = zeroAdjustment ? view.getUint32(start + 8) : 0;
  if (zeroAdjustment) view.setUint32(start + 8, 0);
  let sum = 0;
  for (let at = start; at < start + length; at += 4) {
    sum = (sum + (at + 4 <= start + length ? view.getUint32(at) : view.getUint16(at) * 0x10000)) % 0x100000000;
  }
  if (zeroAdjustment) view.setUint32(start + 8, saved);
  return sum >>> 0;
};

const parityFailures = (name: string, view: DataView, tables: Map<string, TableRecord>): string[] => {
  const rows: Array<string | null> = [];
  for (const pin of PARITY_PINS) {
    const table = tableAt(tables, pin.table);
    const reads = pin.signed ? view.getInt16(table.offset + pin.field) : view.getUint16(table.offset + pin.field);
    rows.push(
      rowWhen(
        reads !== pin.pinned,
        `${name}: ${pin.property} reads ${shown(reads, pin.hex)}, pinned ${shown(pin.pinned, pin.hex)}`
      )
    );
  }
  return rowsOf(rows);
};

const checksumFailures = (name: string, view: DataView, tables: Map<string, TableRecord>): string[] => {
  const rows: Array<string | null> = [];
  for (const tag of CHECKSUMMED_TABLES) {
    const table = tableAt(tables, tag);
    const recalc = checksumOf(view, table.offset, table.length, tag === 'head');
    rows.push(
      rowWhen(
        recalc !== table.checkSum,
        `${name}: ${tag} table checksum reads ${shown(recalc, true)}, directory pinned ${shown(table.checkSum, true)}`
      )
    );
  }
  return rowsOf(rows);
};

const cmapSubtables = (view: DataView, tables: Map<string, TableRecord>): CmapSubtable[] => {
  const cmap = tableAt(tables, 'cmap');
  const subtables: CmapSubtable[] = [];
  for (let i = 0; i < view.getUint16(cmap.offset + 2); i++) {
    const at = cmap.offset + 4 + i * 8;
    const sub = cmap.offset + view.getUint32(at + 4);
    subtables.push({
      platform: view.getUint16(at),
      encoding: view.getUint16(at + 2),
      format: view.getUint16(sub),
      at: sub,
    });
  }
  return subtables;
};

const windowsSubtable = (subtables: ReadonlyArray<CmapSubtable>): CmapSubtable =>
  subtables.find((entry) => entry.platform === 3 && entry.encoding === 1) as CmapSubtable;

const glyphReader = (view: DataView, subtables: ReadonlyArray<CmapSubtable>): ((cp: number) => number) => {
  // Android resolves through the (3,1) subtable, whose every segment encodes
  // idDelta (idRangeOffset 0 throughout): a re-cut that changes the encoding shape
  // resolves garbage, and the glyph-bounds row below fails that loudly.
  const sub = windowsSubtable(subtables).at;
  const segCount = view.getUint16(sub + 6) / 2;
  const endCodes = sub + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  return (cp: number): number => {
    for (let seg = 0; seg < segCount; seg++) {
      if (cp > view.getUint16(endCodes + seg * 2)) continue;
      const start = view.getUint16(startCodes + seg * 2);
      if (cp < start) return 0;
      return (view.getUint16(idDeltas + seg * 2) + cp) & 0xffff;
    }
    return 0;
  };
};

const integrityFailures = (
  name: string,
  view: DataView,
  tables: Map<string, TableRecord>,
  script: Script
): string[] => {
  const rows: Array<string | null> = [];
  const subtables = cmapSubtables(view, tables);

  rows.push(
    rowWhen(
      view.getUint16(tableAt(tables, 'cmap').offset + 2) !== 2,
      `${name}: cmap carries subtables beyond the pinned pair 0/3 + 3/1`
    )
  );
  const encodings = subtables.map((entry) => `${entry.platform}/${entry.encoding}`);
  rows.push(rowWhen(encodings[0] !== '0/3', `${name}: cmap subtable 0 encodes ${encodings[0]}, pinned 0/3`));
  rows.push(rowWhen(encodings[1] !== '3/1', `${name}: cmap subtable 1 encodes ${encodings[1]}, pinned 3/1`));
  rows.push(rowWhen(subtables[0].format !== 4, `${name}: cmap subtable 0 is format ${subtables[0].format}, pinned 4`));
  rows.push(rowWhen(subtables[1].format !== 4, `${name}: cmap subtable 1 is format ${subtables[1].format}, pinned 4`));

  const nameTable = tableAt(tables, 'name');
  const presentIds = new Set<number>();
  for (let i = 0; i < view.getUint16(nameTable.offset + 2); i++) {
    presentIds.add(view.getUint16(nameTable.offset + 6 + i * 12 + 6));
  }
  for (const id of NAME_IDS) {
    rows.push(rowWhen(!presentIds.has(id), `${name}: name table carries no ID ${id}`));
  }

  const head = tableAt(tables, 'head');
  const locaLong = view.getInt16(head.offset + 50) === 1;
  const numGlyphs = view.getUint16(tableAt(tables, 'maxp').offset + 4);
  const locaOf = (glyph: number): number =>
    locaLong
      ? view.getUint32(tableAt(tables, 'loca').offset + glyph * 4)
      : view.getUint16(tableAt(tables, 'loca').offset + glyph * 2) * 2;
  const numHMetrics = view.getUint16(tableAt(tables, 'hhea').offset + 34);
  const glyphOf = glyphReader(view, subtables);

  for (const cp of [...ENDONYM[script], ...DIGITS_AND_PERIOD]) {
    const glyph = glyphOf(cp);
    const kind = ENDONYM[script].includes(cp) ? 'endonym' : 'digit';
    rows.push(rowWhen(glyph === 0, `${name}: cmap lacks ${hex4(cp)} (${kind})`));
    if (glyph === 0) continue;
    rows.push(
      rowWhen(
        glyph >= numGlyphs,
        `${name}: ${hex4(cp)} resolves to glyph ${glyph}, past the ${numGlyphs}-glyph loca table`
      )
    );
    const contours = view.getInt16(tableAt(tables, 'glyf').offset + locaOf(glyph));
    rows.push(rowWhen(contours === 0, `${name}: ${hex4(cp)} resolves to an empty outline (numberOfContours 0)`));
    const advance = view.getUint16(tableAt(tables, 'hmtx').offset + Math.min(glyph, numHMetrics - 1) * 4);
    rows.push(
      rowWhen(
        (advance - ADVANCE_FLOOR) * (advance - ADVANCE_CEILING) > 0,
        `${name}: ${hex4(cp)} advance ${advance} sits outside ${ADVANCE_FLOOR}..${ADVANCE_CEILING}`
      )
    );
  }
  return rowsOf(rows);
};

describe('the CJK subsets pinned byte by byte', () => {
  it('spells each pinned endonym exactly as its language row renders it', () => {
    expect(String.fromCodePoint(...ENDONYM.KR)).toBe(nativeLanguageName('ko'));
  });

  it('no bundled face carries the dropped pairs endonyms', () => {
    const rows: string[] = [];
    for (const name of readdirSync(FONTS_DIR).filter((file) => file.endsWith('.ttf'))) {
      const { view, tables } = readFace(name);
      const resolve = glyphReader(view, cmapSubtables(view, tables));
      for (const script of ['SC', 'JP'] as const) {
        for (const cp of DROPPED_ENDONYMS[script]) {
          if (resolve(cp) !== 0) rows.push(`${name}: still maps ${hex4(cp)} (${script} endonym)`);
        }
      }
    }
    expect(rows).toEqual([]);
  });

  it.each(FACE_ROWS)('%s carries the pinned three-way metrics', (name) => {
    const { view, tables } = readFace(name);
    expect(parityFailures(name, view, tables)).toEqual([]);
  });

  it.each(FACE_ROWS)('%s keeps its endonym and digits whole through its own cmap', (name, script) => {
    const { view, tables } = readFace(name);
    expect(integrityFailures(name, view, tables, script)).toEqual([]);
  });

  it.each(FACE_ROWS)('%s recalc-matches its hhea, head, OS/2 and cmap checksums', (name) => {
    const { view, tables } = readFace(name);
    expect(checksumFailures(name, view, tables)).toEqual([]);
  });

  it('reads no glyph for a codepoint no closed set carries', () => {
    for (const { name } of SUBSET_FACES) {
      const { view, tables } = readFace(name);
      expect(`${name}: ${glyphReader(view, cmapSubtables(view, tables))(0x2603)}`).toBe(`${name}: 0`);
    }
  });

  it('reddens on a shifted hhea ascent byte, naming the file and the property', () => {
    const probeDir = mkdtempSync(join(tmpdir(), 'cjk-subset-gate-'));
    try {
      const probeName = 'NotoSansKR-Subset-Regular.ttf';
      writeFileSync(join(probeDir, probeName), readFileSync(join(FONTS_DIR, probeName)));
      const { view, tables } = readFace(probeName, probeDir);
      const ascent = PARITY_PINS[0];
      expect(ascent.property).toBe('hhea ascender');
      view.setInt16(tableAt(tables, 'hhea').offset + ascent.field, ascent.pinned + 1);
      expect(parityFailures(probeName, view, tables)).toEqual([
        `${probeName}: ${ascent.property} reads ${ascent.pinned + 1}, pinned ${ascent.pinned}`,
      ]);
      expect(checksumFailures(probeName, view, tables)).toEqual([
        expect.stringContaining(`${probeName}: hhea table checksum`),
      ]);
    } finally {
      rmSync(probeDir, { recursive: true, force: true });
    }
  });

  it('reddens on a dropped endonym cmap mapping, naming the file and the codepoint', () => {
    const probeDir = mkdtempSync(join(tmpdir(), 'cjk-subset-gate-'));
    try {
      const probeName = 'NotoSansKR-Subset-Medium.ttf';
      writeFileSync(join(probeDir, probeName), readFileSync(join(FONTS_DIR, probeName)));
      const { view, tables } = readFace(probeName, probeDir);
      const dropped = 0xd55c;
      const sub = windowsSubtable(cmapSubtables(view, tables)).at;
      const segCount = view.getUint16(sub + 6) / 2;
      const endCodes = sub + 14;
      const startCodes = endCodes + segCount * 2 + 2;
      let seg = -1;
      for (let s = 0; s < segCount; s++) {
        if (view.getUint16(startCodes + s * 2) === dropped && view.getUint16(endCodes + s * 2) === dropped) {
          seg = s;
          break;
        }
      }
      expect(seg).toBeGreaterThanOrEqual(0);
      view.setUint16(startCodes + seg * 2, dropped + 1);
      view.setUint16(endCodes + seg * 2, dropped + 1);
      expect(integrityFailures(probeName, view, tables, 'KR')).toEqual([`${probeName}: cmap lacks U+D55C (endonym)`]);
    } finally {
      rmSync(probeDir, { recursive: true, force: true });
    }
  });

  it('reddens on a dropped pair creeping back into the lock, naming the row and the binary', () => {
    const corrupted = {
      ...(lock as Record<string, unknown>),
      'zh-Hans': '一',
      files: {
        ...((lock as { files: Record<string, string> }).files ?? {}),
        'NotoSansSC-Subset-Regular.ttf': 'deadbeef',
      },
    };
    expect(pairDropFailures(corrupted)).toEqual([
      "zh-Hans: the lock still carries a dropped pair's character row",
      "files: the dropped pair's binary NotoSansSC-Subset-Regular.ttf is still bound",
    ]);
  });
});
