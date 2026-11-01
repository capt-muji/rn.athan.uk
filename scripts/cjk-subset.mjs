// Regenerates the ko glyph lock beside the shipped KR subset binaries (plan
// T-419 decision 8; ja and ko rode the same pipeline, plan T-452 decision 3;
// the Traditional pair left with its catalog in the T-537 language wave; the
// zh-Hans and ja pairs were dropped for the OS system-font fallback by plan
// T-538's owner-ruled C3, 2026-11-01).
//
// The full Noto Sans KR statics run near 10MB a weight, so the app bundles a
// subset cut over a CLOSED string set - every character of the ko catalog, its
// native-strings.json row, its widget-statics.json row, its endonym, and the
// What's New keys that resolve through the catalog - and
// shared/__tests__/cjkSubset.test.ts recomputes that set from the committed
// files and diffs it against the lock this script writes from the subset's own
// cmap, so any catalog byte the subset misses fails the suite naming the
// character.
//
// The full pair never enters the repository (decision 8): fetch it outside first -
//   curl -sSL -o <dir>/NotoSansKR-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf
// - then, from the repo root:
//   node scripts/cjk-subset.mjs <dir>
//
// The closed set is read through @babel/parser (the catalog-lock.mjs precedent)
// because the catalog and name modules use ESM export syntax Node cannot load.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';

const ROOT = new URL('..', import.meta.url).pathname;
const FONTS_DIR = process.argv[2];
if (!FONTS_DIR || process.argv.length > 3) {
  throw new Error('usage: node scripts/cjk-subset.mjs <dir holding the full statics>');
}

/** The named export's object-literal values from a flat catalog module */
const catalogValues = (file, exportName) => {
  const ast = parse(readFileSync(join(ROOT, 'shared/i18n', file), 'utf8'), {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  const declaration = ast.program.body.find(
    (node) => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration'
  );
  const declarator = declaration.declaration.declarations.find(
    (node) => node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === exportName
  );
  let literal = declarator.init;
  while (literal && (literal.type === 'TSSatisfiesExpression' || literal.type === 'TSAsExpression')) {
    literal = literal.expression;
  }
  if (literal?.type !== 'ObjectExpression') throw new Error(`${file}: no ${exportName} object literal`);
  return literal.properties
    .filter((p) => p.type === 'ObjectProperty' && p.value.type === 'StringLiteral')
    .map((p) => p.value.value);
};

/** The picker endonyms, parsed from the languageNames data module */
const endonymOf = () => {
  const ast = parse(readFileSync(join(ROOT, 'shared/languageNames.ts'), 'utf8'), {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  const declaration = ast.program.body.find(
    (node) => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration'
  );
  const declarator = declaration.declaration.declarations.find(
    (node) => node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === 'LANGUAGE_NAMES'
  );
  const names = {};
  for (const element of declarator.init.elements) {
    const id = element.properties.find((p) => p.key.name === 'id');
    const name = element.properties.find((p) => p.key.name === 'name');
    names[id.value.value] = name.value.value;
  }
  return names;
};

const NATIVE = JSON.parse(readFileSync(join(ROOT, 'shared/i18n/native-strings.json'), 'utf8'));
const STATICS = JSON.parse(readFileSync(join(ROOT, 'shared/i18n/widget-statics.json'), 'utf8'));
const ENDONYMS = endonymOf();

// The closed string set per locale, newline excepted (no glyph maps it)
const LOCALES = ['zh-Hans', 'ja', 'ko'];
const EXPORT_NAMES = { 'zh-Hans': 'zhHans', ja: 'ja', ko: 'ko' };
const closedText = {};
for (const locale of LOCALES) {
  const strings = [
    ...catalogValues(`${locale}.ts`, EXPORT_NAMES[locale]),
    NATIVE[locale].NSLocationWhenInUseUsageDescription,
    NATIVE[locale].NSUserNotificationsUsageDescription,
    ...Object.values(NATIVE[locale].gallery),
    ...Object.values(STATICS[locale]),
    ENDONYMS[locale],
  ];
  closedText[locale] = [
    ...new Set(
      strings
        .join('')
        .split('')
        .filter((ch) => ch !== '\n')
    ),
  ]
    .sort()
    .join('');
}

// The fontTools half: instantiate each weight (or load the C2 statics), subset over
// the closed set, apply the candidate's own rewrites, save, and answer the cmaps and
// vertical metrics the lock and the records' comments pin. The keep mode reads the
// committed KR binaries and never writes them, so the control pair cannot drift.
const PYTHON = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from fontTools.pens.boundsPen import BoundsPen

job = json.load(open(sys.argv[1]))
answer = {}
IDENTIFYING_NAME_IDS = (1, 2, 3, 4, 6, 16, 17)


def subset_over(font, text):
    options = subset.Options()
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.layout_features = ["*"]
    options.notdef_outline = True
    options.recalc_bounds = False
    options.recalc_timestamp = False
    sub = subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)


def apply_override(font, override):
    os2 = font["OS/2"]
    if not os2.fsSelection & 0x40 or os2.fsSelection & 0x80:
        raise ValueError("the C1 rewrite requires fsSelection bit 6 set and bit 7 clear")
    font["hhea"].ascent, font["hhea"].descent, font["hhea"].lineGap = override["hhea"]
    os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = override["typo"]
    os2.usWinAscent, os2.usWinDescent = override["win"]


def ink_breaches(font, text, envelope):
    floor, ceiling = envelope
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    breaches = []
    for ch in sorted(set(text)):
        cp = ord(ch)
        if cp < 0x80:
            continue
        name = cmap.get(cp)
        if name is None:
            continue
        pen = BoundsPen(glyph_set)
        glyph_set[name].draw(pen)
        if pen.bounds is None:
            continue
        if pen.bounds[1] < floor or pen.bounds[3] > ceiling:
            breaches.append("U+%04X %s inks y %d..%d outside [%d, %d]" % (cp, ch, pen.bounds[1], pen.bounds[3], floor, ceiling))
    return breaches


def rename_away_from_rfn(font, names):
    for record in font["name"].names:
        if record.nameID == 1:
            record.string = names["family"]
        elif record.nameID == 2:
            record.string = names["subfamily"]
        elif record.nameID == 3:
            record.string = names["unique"]
        elif record.nameID == 4:
            record.string = names["full"]
        elif record.nameID == 6:
            record.string = names["postscript"]
        elif record.nameID == 16:
            record.string = names["typoFamily"]
        elif record.nameID == 17:
            record.string = names["typoSubfamily"]
    for record in font["name"].names:
        if record.nameID in IDENTIFYING_NAME_IDS and "plex" in record.string.lower():
            raise ValueError("name ID %d still carries the Reserved Font Name: %r" % (record.nameID, record.string))


for pair, spec in job.items():
    cmaps = []
    answer[pair] = {"weights": {}}
    for name, weight in (("Regular", 400), ("Medium", 500)):
        out = spec["out"].replace("{weight}", name)
        if spec["mode"] == "keep":
            font = TTFont(out)
        else:
            font = TTFont(spec["sources"][name] if "sources" in spec else spec["source"])
            if spec["mode"] == "vf":
                instantiateVariableFont(font, {"wght": weight}, inplace=True, updateFontNames=True)
            subset_over(font, spec["text"])
            if "override" in spec:
                apply_override(font, spec["override"])
            if "rename" in spec:
                rename_away_from_rfn(font, spec["rename"][name])
        if "ink" in spec:
            breaches = ink_breaches(font, spec["text"], spec["ink"])
            if breaches:
                raise SystemExit("%s: the rewritten box %s does not clear the closed set's ink: %s" % (out, spec["ink"], "; ".join(breaches)))
        if spec["mode"] != "keep":
            font.save(out)
        cmap = font.getBestCmap()
        cmaps.append(set(cmap))
        hhea, os2 = font["hhea"], font["OS/2"]
        answer[pair]["weights"][name] = {
            "file": out.split("/")[-1],
            "glyphs": font["maxp"].numGlyphs,
            "upm": font["head"].unitsPerEm,
            "hhea": [hhea.ascent, hhea.descent, hhea.lineGap],
            "typo": [os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap],
            "win": [os2.usWinAscent, os2.usWinDescent],
            "fsSelection": os2.fsSelection,
        }
    answer[pair]["cmap"] = sorted(chr(cp) for cp in set.intersection(*cmaps))
print(json.dumps(answer))
`;

const keptKr = { mode: 'keep', out: join(ROOT, 'assets/fonts/NotoSansKR-Subset-{weight}.ttf') };

// The shipped truth since the owner's C3 ruling: the ko pair alone binds
const job = { KR: keptKr };
const jobFile = join(FONTS_DIR, 'cjk-subset-job.json');
writeFileSync(jobFile, JSON.stringify(job));
const measured = JSON.parse(execFileSync('python3', ['-c', PYTHON, jobFile], { encoding: 'utf8' }));

const lock = {
  _comment:
    "The character set the ko subset pair carries (plan T-419 decision 8, the Traditional pair retired with its catalog by plan T-537, the zh-Hans and ja pairs dropped for the OS system-font fallback by plan T-538's owner-ruled C3): the subset is cut with fontTools over the closed string set - every character of the ko catalog, its native-strings.json row, its widget-statics.json row, its endonym, and the What's New keys that resolve through the catalog - and this lock is generated from the subset's own cmap, so shared/__tests__/cjkSubset.test.ts names any byte the subset misses or the strings drop. files binds the committed binaries by sha256 so a re-cut shipping stale TTFs cannot pass the gate. Regenerate from the repo root with the full statics fetched OUTSIDE the repository (decision 8): node scripts/cjk-subset.mjs <dir>.",
};
const PAIR_OF = { 'zh-Hans': 'SC', ja: 'JP', ko: 'KR' };
const boundFiles = [];
for (const locale of LOCALES) {
  const pair = PAIR_OF[locale];
  if (!(pair in job)) continue;
  const carried = measured[pair].cmap.join('');
  const missing = closedText[locale].split('').filter((ch) => !carried.includes(ch));
  if (missing.length > 0) {
    throw new Error(`${locale}: the subset pairs lack ${missing.join(' ')}`);
  }
  lock[locale] = carried;
  for (const spec of [job[pair]]) {
    for (const weight of Object.keys(measured[pair].weights)) {
      boundFiles.push(spec.out.replace('{weight}', weight).split('/').pop());
    }
  }
  process.stdout.write(
    `${locale}: ${closedText[locale].length} closed chars, ${carried.length} carried; ` +
      Object.entries(measured[pair].weights)
        .map(
          ([name, m]) =>
            `${name} ${m.glyphs} glyphs, hhea ${m.hhea[0]}/-${-m.hhea[1]} gap ${m.hhea[2]}, typo ${m.typo[0]}/-${-m.typo[1]} gap ${m.typo[2]}, win ${m.win[0]}/-${-m.win[1]}, fsSelection 0x${m.fsSelection
              .toString(16)
              .padStart(4, '0')}, UPM ${m.upm}`
        )
        .join('; ') +
      '\n'
  );
}
lock.files = Object.fromEntries(
  boundFiles.map((name) => [
    name,
    createHash('sha256')
      .update(readFileSync(join(ROOT, 'assets/fonts', name)))
      .digest('hex'),
  ])
);
writeFileSync(join(ROOT, 'shared/i18n/cjk-glyph-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
