/**
 * The language rows' face-coverage gate (T-538): the per-locale style sweep proves the row
 * styles' values, not what glass does with them. A row whose resolved fontFamily lacks the
 * endonym's codepoints sends those glyphs to the OS fallback face, and on Android the
 * fallback run's line spacing rides on top of any pinned lineHeight (TextLayoutManager
 * setUseLineSpacingFromFallbacks, RN 0.86), so the row grows past its neighbours while every
 * style test stays green - the exact miss that shipped the pin the owner read tall on the
 * 3T. This gate renders the sheet, reads each row's RESOLVED fontFamily, parses the named
 * bundled TTF's own cmap, and fails naming any endonym codepoint the face lacks, so a row
 * that would fall back on glass cannot pass here.
 *
 * Cut state C3 (T-538 step 4): the zh-Hans and ja pairs are dropped from the bundle, so
 * their rows CANNOT resolve a bundled face - by design they ride the system default and
 * their Han glyphs fall to the OS chain, the founding record's own tall-row cost the
 * sheet regression reads on glass. The dropped rows are pinned to that state below
 * (nothing bundled may creep back for them); every other row keeps the coverage law.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { LocaleId } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';

// The probes require the testing library inside isolateModules, mid-test, where its
// import-time cleanup-hook registration is a jest-circus error (as in typographySweep)
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

const FONTS_DIR = join(__dirname, '..', '..', '..', 'assets', 'fonts');

/** The face's own cmap as a codepoint-membership oracle, read straight from the shipped TTF */
const cmapCoverOf = (family: string): ((cp: number) => boolean) => {
  const raw = readFileSync(join(FONTS_DIR, `${family}.ttf`));
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);

  const numTables = view.getUint16(4);
  let cmapAt = -1;
  for (let i = 0; i < numTables; i++) {
    const at = 12 + i * 16;
    if (view.getUint32(at) === 0x636d6170) cmapAt = view.getUint32(at + 8);
  }
  if (cmapAt < 0) throw new Error(`${family} carries no cmap table`);

  let chosen = -1;
  let bestRank = -1;
  const numSubtables = view.getUint16(cmapAt + 2);
  for (let i = 0; i < numSubtables; i++) {
    const at = cmapAt + 4 + i * 8;
    const platform = view.getUint16(at);
    const encoding = view.getUint16(at + 2);
    const sub = cmapAt + view.getUint32(at + 4);
    const format = view.getUint16(sub);
    if (format !== 4 && format !== 12) continue;
    // The fuller the Unicode encoding, the better the oracle
    const rank = platform === 3 && encoding === 10 ? 4 : platform === 3 && encoding === 1 ? 3 : platform === 0 ? 2 : 1;
    if (rank > bestRank) {
      bestRank = rank;
      chosen = sub;
    }
  }
  if (chosen < 0) throw new Error(`${family} carries no cmap format 4 or 12 subtable`);

  if (view.getUint16(chosen) === 12) {
    const groups = view.getUint32(chosen + 12);
    return (cp: number) => {
      for (let g = 0; g < groups; g++) {
        const at = chosen + 16 + g * 12;
        if (cp >= view.getUint32(at) && cp <= view.getUint32(at + 4)) return true;
      }
      return false;
    };
  }

  const segCount = view.getUint16(chosen + 6) / 2;
  const endCodes = chosen + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;
  return (cp: number) => {
    for (let s = 0; s < segCount; s++) {
      const end = view.getUint16(endCodes + s * 2);
      if (cp > end) continue;
      const start = view.getUint16(startCodes + s * 2);
      if (cp < start) return false;
      const rangeOffset = view.getUint16(idRangeOffsets + s * 2);
      if (rangeOffset === 0) return ((view.getUint16(idDeltas + s * 2) + cp) & 0xffff) !== 0;
      const glyph = view.getUint16(idRangeOffsets + s * 2 + rangeOffset + (cp - start) * 2);
      return glyph !== 0;
    }
    return false;
  };
};

const coverCache = new Map<string, (cp: number) => boolean>();

const coverOf = (family: string): ((cp: number) => boolean) => {
  const cached = coverCache.get(family);
  if (cached) return cached;
  const covers = cmapCoverOf(family);
  coverCache.set(family, covers);
  return covers;
};

const codepointOf = (ch: string): string => `U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;

// The C3 pair-drop's two locales: their rows ride the system default (no bundled
// pair exists to name), and the fallback cost is the pick rule's own screen read
const DROPPED_ROWS: Record<string, string> = {
  'zh-Hans': 'Roboto-Regular',
  ja: 'Roboto-Regular',
};

interface ResolvedRowStyle {
  fontFamily?: unknown;
  lineHeight?: unknown;
}

/** Every row's resolved label style under one active locale, read off the rendered sheet */
const rowLabelStylesUnder = async (locale: LocaleId): Promise<Record<string, ResolvedRowStyle>> => {
  let styles: Record<string, ResolvedRowStyle> = {};
  jest.resetModules();
  await jest.isolateModulesAsync(async () => {
    const { StyleSheet } = require('react-native');
    const { showLondonDay } = require('@/__tests__/harness');
    showLondonDay('2026-09-11', '14:00');
    const { setActiveLocale } = require('@/shared/i18n/locale');
    setActiveLocale(locale);
    const rntl = require('@testing-library/react-native');
    const BottomSheetLanguage = require('../screens/Language').default;
    await rntl.render(<BottomSheetLanguage />);
    styles = Object.fromEntries(
      LANGUAGE_NAMES.map((entry) => [
        entry.id,
        StyleSheet.flatten(rntl.screen.getByText(entry.name).props.style) as ResolvedRowStyle,
      ])
    );
  });
  return styles;
};

describe("the language rows' face coverage", () => {
  it('resolves every carried row to a bundled face that carries its whole endonym, and the dropped rows to the system default', async () => {
    const styles = await rowLabelStylesUnder('en');

    const failures: string[] = [];
    for (const entry of LANGUAGE_NAMES) {
      const family = styles[entry.id]?.fontFamily;
      if (typeof family !== 'string') {
        failures.push(`${entry.id}: the row resolves no fontFamily`);
        continue;
      }
      const dropped = DROPPED_ROWS[entry.id];
      if (dropped !== undefined) {
        if (family !== dropped) {
          failures.push(`${entry.id}: the dropped pair's row resolves ${family}, pinned the system default ${dropped}`);
        }
        continue;
      }
      const covers = coverOf(family);
      for (const ch of entry.name) {
        if (!covers(ch.codePointAt(0) ?? 0)) {
          failures.push(
            `${entry.id} (${entry.name}): ${family} lacks ${ch} ${codepointOf(ch)} - the row falls back on glass`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('resolves the same face and box for every row under the my active face, where the active face once owned the sheet', async () => {
    const [en, my] = [await rowLabelStylesUnder('en'), await rowLabelStylesUnder('my')];

    for (const entry of LANGUAGE_NAMES) {
      expect(`${entry.id}: ${my[entry.id]?.fontFamily}`).toBe(`${entry.id}: ${en[entry.id]?.fontFamily}`);
      expect(`${entry.id}: ${my[entry.id]?.lineHeight}`).toBe(`${entry.id}: ${en[entry.id]?.lineHeight}`);
    }
  });

  it("keeps every row's box inside the row's 24px content budget, so every row measures the 48px minimum", async () => {
    const styles = await rowLabelStylesUnder('en');

    // minHeight 48 with paddingVertical 12 leaves 24: a box past it grows its row on glass
    const failures: string[] = [];
    for (const entry of LANGUAGE_NAMES) {
      const box = styles[entry.id]?.lineHeight;
      if (typeof box !== 'number' || box > 24) {
        failures.push(`${entry.id}: box ${String(box)} crosses the 24px content budget`);
      }
    }
    expect(failures).toEqual([]);
  });
});
