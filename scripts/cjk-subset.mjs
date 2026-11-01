// Cuts the CJK subset font pairs and regenerates the glyph lock (plan T-419
// decision 8; ja and ko ride the same pipeline, plan T-452 decision 3; the
// Traditional pair left with its catalog in the T-537 language wave; the
// candidate states are plan T-538's owner-ruled font lever).
//
// The full Noto Sans SC, JP and KR statics run near 10MB a weight, so the app bundles
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
//   curl -sSL -o <dir>/NotoSansJP-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf
//   curl -sSL -o <dir>/NotoSansKR-VF.ttf \
//     https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf
// and, for candidate C2's alternate static sources (IBM Plex Sans, SIL OFL 1.1 with
// Reserved Font Name "Plex", so the cuts ship under this repo's own Athan names):
//   curl -sSL -o <dir>/IBMPlexSansSC-Regular.ttf \
//     https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans-sc/fonts/complete/ttf/unhinted/IBMPlexSansSC-Regular.ttf
//   curl -sSL -o <dir>/IBMPlexSansSC-Medium.ttf \
//     https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans-sc/fonts/complete/ttf/unhinted/IBMPlexSansSC-Medium.ttf
//   curl -sSL -o <dir>/IBMPlexSansJP-Regular.ttf \
//     https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans-jp/fonts/complete/ttf/unhinted/IBMPlexSansJP-Regular.ttf
//   curl -sSL -o <dir>/IBMPlexSansJP-Medium.ttf \
//     https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans-jp/fonts/complete/ttf/unhinted/IBMPlexSansJP-Medium.ttf
// - then, from the repo root:
//   node scripts/cjk-subset.mjs <dir> [c1|c2|c3]
//
// Candidate states (plan T-538, all behind the same cut pipeline and lock generation):
//   (no argument) the shipped cut: all three pairs instanced from the Noto VFs.
//   c1  the SC and JP pairs re-cut from the same VFs with their vertical metrics
//       rewritten to Roboto's 1.172em box (hhea and typo 928/-244/0, win 928/244,
//       fsSelection bit 6 kept and bit 7 clear, UPM 1000) and the non-ASCII
//       glyph-ink assertion [-244, 928] over each pair's own closed set - the
//       ASCII 'g' at -250 is exempt by Roboto's own precedent, and the cut fails
//       naming any glyph that breaches. The KR pair is never re-cut: its committed
//       binaries stay byte-identical and the lock keeps their hashes.
//   c2  the SC and JP pairs cut from the IBM Plex Sans statics (both weights, no VF
//       instancing) over the same closed sets, shipped as AthanSC-Subset and
//       AthanJP-Subset with the name-table family IDs rewritten away from the
//       Reserved Font Name at cut time. The KR pair is kept exactly as c1.
//   c3  pair-drop: the SC and JP pairs leave the job, the lock and the bundled
//       fonts; the lock keeps the ko set and the KR files binding, regenerated
//       from the shipped KR binaries' own cmaps.
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
if (!FONTS_DIR) throw new Error('usage: node scripts/cjk-subset.mjs <dir holding the full statics> [c1|c2|c3]');
const CANDIDATE = process.argv[3] ?? 'shipped';
if (!['shipped', 'c1', 'c2', 'c3'].includes(CANDIDATE)) {
  throw new Error(`unknown candidate ${CANDIDATE}: usage: node scripts/cjk-subset.mjs <dir> [c1|c2|c3]`);
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

// Roboto's own box (hhea 928/-244 against UPM 1000, its 'g' inking to -250 beneath
// it): the C1 rewrite carries it onto the SC and JP pairs' unchanged glyphs
const ROBOTO_PARITY = { hhea: [928, -244, 0], typo: [928, -244, 0], win: [928, 244] };

// The RFN-free identity the C2 cuts carry in their name tables, per pair and weight:
// the RIBBI shape the instanced Noto subsets use (family 'X Medium', subfamily
// 'Regular', the typographic IDs carrying the weight)
const ATHAN = (script, weight) => {
  const family = `Athan ${script} Subset`;
  return {
    family: weight === 'Medium' ? `${family} Medium` : family,
    subfamily: 'Regular',
    unique: `Athan;Athan${script}-Subset-${weight};1.000`,
    full: `${family} ${weight}`,
    postscript: `Athan${script}-Subset-${weight}`,
    typoFamily: family,
    typoSubfamily: weight,
  };
};

const vfPair = (script, text) => ({
  mode: 'vf',
  source: join(FONTS_DIR, `NotoSans${script}-VF.ttf`),
  text,
  out: join(ROOT, 'assets/fonts', `NotoSans${script}-Subset-` + '{weight}.ttf'),
});
const keptKr = { mode: 'keep', out: join(ROOT, 'assets/fonts/NotoSansKR-Subset-{weight}.ttf') };

const JOBS = {
  shipped: {
    SC: vfPair('SC', closedText['zh-Hans']),
    JP: vfPair('JP', closedText.ja),
    KR: vfPair('KR', closedText.ko),
  },
  c1: {
    SC: { ...vfPair('SC', closedText['zh-Hans']), override: ROBOTO_PARITY, ink: [-244, 928] },
    JP: { ...vfPair('JP', closedText.ja), override: ROBOTO_PARITY, ink: [-244, 928] },
    KR: keptKr,
  },
  c2: {
    SC: {
      mode: 'plex',
      sources: {
        Regular: join(FONTS_DIR, 'IBMPlexSansSC-Regular.ttf'),
        Medium: join(FONTS_DIR, 'IBMPlexSansSC-Medium.ttf'),
      },
      text: closedText['zh-Hans'],
      out: join(ROOT, 'assets/fonts/AthanSC-Subset-{weight}.ttf'),
      rename: { Regular: ATHAN('SC', 'Regular'), Medium: ATHAN('SC', 'Medium') },
    },
    JP: {
      mode: 'plex',
      sources: {
        Regular: join(FONTS_DIR, 'IBMPlexSansJP-Regular.ttf'),
        Medium: join(FONTS_DIR, 'IBMPlexSansJP-Medium.ttf'),
      },
      text: closedText.ja,
      out: join(ROOT, 'assets/fonts/AthanJP-Subset-{weight}.ttf'),
      rename: { Regular: ATHAN('JP', 'Regular'), Medium: ATHAN('JP', 'Medium') },
    },
    KR: keptKr,
  },
  c3: { KR: keptKr },
};
const job = JOBS[CANDIDATE];
const jobFile = join(FONTS_DIR, `cjk-subset-job-${CANDIDATE}.json`);
writeFileSync(jobFile, JSON.stringify(job));
const measured = JSON.parse(execFileSync('python3', ['-c', PYTHON, jobFile], { encoding: 'utf8' }));

const STATE_COMMENTS = {
  shipped: '',
  c1: ' Cut state C1 (plan T-538): the SC and JP pairs carry Roboto 1.172em-box metrics (hhea and typo 928/-244/0, win 928/244, fsSelection bit 6 kept bit 7 clear) over unchanged glyphs, cut with node scripts/cjk-subset.mjs <dir> c1; the KR pair is never re-cut, its binaries byte-identical to the shipped cut.',
  c2: ' Cut state C2 (plan T-538): the SC and JP pairs are IBM Plex Sans statics subset over the same closed sets and renamed AthanSC-Subset / AthanJP-Subset away from the Reserved Font Name, cut with node scripts/cjk-subset.mjs <dir> c2; the KR pair is never re-cut, its binaries byte-identical to the shipped cut.',
  c3: ' Cut state C3 (plan T-538): the zh-Hans and ja pairs are dropped and their locales ride the OS fallback; this lock carries the ko pair alone, regenerated with node scripts/cjk-subset.mjs <dir> c3.',
};
const PAIR_OF = { 'zh-Hans': 'SC', ja: 'JP', ko: 'KR' };
const lock = {
  _comment:
    "The character set the CJK subset pairs carry (plan T-419 decision 8, ja and ko added by plan T-452 decision 3, the Traditional pair retired with its catalog by plan T-537): each subset is cut with fontTools over the closed string set - every character of its CJK catalog, its native-strings.json row, its widget-statics.json row, its endonym, and the What's New keys that resolve through the catalog - and this lock is generated from the subsets' own cmaps, so shared/__tests__/cjkSubset.test.ts names any byte the subsets miss or the strings drop. files binds the committed binaries by sha256 so a re-cut shipping stale TTFs cannot pass the gate. Regenerate from the repo root with the full statics fetched OUTSIDE the repository (decision 8): node scripts/cjk-subset.mjs <dir> (see the script header for the curl lines)." +
    STATE_COMMENTS[CANDIDATE],
};
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
