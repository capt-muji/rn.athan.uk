// Cuts the CJK subset font pairs and regenerates the glyph lock (plan T-419
// decision 8; ja and ko ride the same pipeline, plan T-452 decision 3).
//
// The full Noto Sans SC, TC, JP and KR statics run near 10MB a weight, so the app bundles
// subsets cut over a CLOSED string set - every character of each CJK catalog, its
// native-strings.json row, its widget-statics.json row, its endonym, and the What's
// New keys that resolve through the catalog - and shared/__tests__/cjkSubset.test.ts
// recomputes that set from the committed files and diffs it against the lock this
// script writes from the subsets' own cmaps, so any catalog byte the subsets miss
// fails the suite naming the character.
//
// The full pairs never enter the repository (decision 8): fetch them outside first -
//   curl -sSL -o <dir>/NotoSansSC-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
//   curl -sSL -o <dir>/NotoSansTC-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf
//   curl -sSL -o <dir>/NotoSansJP-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf
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
if (!FONTS_DIR) throw new Error('usage: node scripts/cjk-subset.mjs <dir holding the full statics>');

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
const LOCALES = ['zh-Hans', 'zh-Hant', 'ja', 'ko'];
const EXPORT_NAMES = { 'zh-Hans': 'zhHans', 'zh-Hant': 'zhHant', ja: 'ja', ko: 'ko' };
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

// The fontTools half: instantiate each weight, subset over the closed set, save,
// and answer the cmaps and vertical metrics the lock and the records' comments pin
const PYTHON = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

job = json.load(open(sys.argv[1]))
answer = {}
for pair, spec in job.items():
    cmaps = []
    answer[pair] = {"weights": {}}
    for name, weight in (("Regular", 400), ("Medium", 500)):
        font = TTFont(spec["source"])
        instantiateVariableFont(font, {"wght": weight}, inplace=True, updateFontNames=True)
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        options.layout_features = ["*"]
        options.notdef_outline = True
        options.recalc_bounds = False
        options.recalc_timestamp = False
        sub = subset.Subsetter(options=options)
        sub.populate(text=spec["text"])
        sub.subset(font)
        out = spec["out"].replace("{weight}", name)
        font.save(out)
        cmap = font.getBestCmap()
        cmaps.append(set(cmap))
        upm = font["head"].unitsPerEm
        hhea, os2 = font["hhea"], font["OS/2"]
        answer[pair]["weights"][name] = {
            "file": out,
            "glyphs": font["maxp"].numGlyphs,
            "upm": upm,
            "hhea": [hhea.ascent, hhea.descent, hhea.lineGap],
            "typo": [os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap],
            "win": [os2.usWinAscent, os2.usWinDescent],
        }
    answer[pair]["cmap"] = sorted(chr(cp) for cp in set.intersection(*cmaps))
print(json.dumps(answer))
`;

const job = {
  SC: {
    source: join(FONTS_DIR, 'NotoSansSC-VF.ttf'),
    text: closedText['zh-Hans'],
    out: join(ROOT, 'assets/fonts/NotoSansSC-Subset-{weight}.ttf'),
  },
  TC: {
    source: join(FONTS_DIR, 'NotoSansTC-VF.ttf'),
    text: closedText['zh-Hant'],
    out: join(ROOT, 'assets/fonts/NotoSansTC-Subset-{weight}.ttf'),
  },
  JP: {
    source: join(FONTS_DIR, 'NotoSansJP-VF.ttf'),
    text: closedText.ja,
    out: join(ROOT, 'assets/fonts/NotoSansJP-Subset-{weight}.ttf'),
  },
  KR: {
    source: join(FONTS_DIR, 'NotoSansKR-VF.ttf'),
    text: closedText.ko,
    out: join(ROOT, 'assets/fonts/NotoSansKR-Subset-{weight}.ttf'),
  },
};
const jobFile = join(FONTS_DIR, 'cjk-subset-job.json');
writeFileSync(jobFile, JSON.stringify(job));
const measured = JSON.parse(execFileSync('python3', ['-c', PYTHON, jobFile], { encoding: 'utf8' }));

const lock = {
  _comment:
    "The character set the four CJK subset pairs carry (plan T-419 decision 8, ja and ko added by plan T-452 decision 3): each subset is cut with fontTools over the closed string set - every character of its CJK catalog, its native-strings.json row, its widget-statics.json row, its endonym, and the What's New keys that resolve through the catalog - and this lock is generated from the subsets' own cmaps, so shared/__tests__/cjkSubset.test.ts names any byte the subsets miss or the strings drop. files binds the committed binaries by sha256 so a re-cut shipping stale TTFs cannot pass the gate. Regenerate from the repo root with the full statics fetched OUTSIDE the repository (decision 8): node scripts/cjk-subset.mjs <dir> (see the script header for the four curl lines).",
  'zh-Hans': measured.SC.cmap.join(''),
  'zh-Hant': measured.TC.cmap.join(''),
  ja: measured.JP.cmap.join(''),
  ko: measured.KR.cmap.join(''),
  files: Object.fromEntries(
    Object.values(job)
      .flatMap((spec) =>
        Object.keys(measured.SC.weights).map((weight) => spec.out.replace('{weight}', weight).split('/').pop())
      )
      .map((name) => [
        name,
        createHash('sha256')
          .update(readFileSync(join(ROOT, 'assets/fonts', name)))
          .digest('hex'),
      ])
  ),
};
writeFileSync(join(ROOT, 'shared/i18n/cjk-glyph-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);

const PAIR_OF = { 'zh-Hans': 'SC', 'zh-Hant': 'TC', ja: 'JP', ko: 'KR' };
for (const locale of LOCALES) {
  const pair = PAIR_OF[locale];
  const carried = measured[pair].cmap.join('');
  const missing = closedText[locale].split('').filter((ch) => !carried.includes(ch));
  if (missing.length > 0) {
    throw new Error(`${locale}: the subset pairs lack ${missing.join(' ')}`);
  }
  process.stdout.write(
    `${locale}: ${closedText[locale].length} closed chars, ${carried.length} carried; ` +
      Object.entries(measured[pair].weights)
        .map(
          ([name, m]) =>
            `${name} ${m.glyphs} glyphs, hhea ${m.hhea[0]}/-${-m.hhea[1]} gap ${m.hhea[2]}, win ${m.win[0]}/-${-m.win[1]}, UPM ${m.upm}`
        )
        .join('; ') +
      '\n'
  );
}
