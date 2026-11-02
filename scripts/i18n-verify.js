/**
 * The T-575 verification generator: renders each locale's catalog as a round-trip
 * comparison the owner (pilot wave) or the judge LLM (long tail) reads.
 *
 *   node scripts/i18n-verify.js --locales ar,so [--out DIR] [--waves]
 *
 * --waves runs the pilot wave (ar so id ms min mad bug ceb ilo). The default out
 * dir is $HOME/athan-i18n-verify. Per locale it writes <locale>.html (one row per
 * key: our English, our language string, the machine's round-trip English, the
 * engine that rendered it, the owner-protocol spot-check URL), <locale>.json (the
 * same rows as data plus the locale's engine mix), and index.html across locales.
 *
 * Two keyless engines sit behind a per-locale pre-flight: Google's gtx endpoint and
 * MyMemory. One round-trip request per engine decides the locale's primary; the
 * other is held as second opinion (gtx answered 429 from this machine on
 * 2026-11-02, so MyMemory-first is the expected order - the pre-flight re-decides
 * every run). A row fails over on HTTP error, empty body, or an engine echoing the
 * untranslated input; a row whose catalog string equals its English source is a
 * loanword, and an unchanged echo there is a valid round-trip. A row both engines
 * fail is written engine:"none" with a null round-trip - the LLM round-trip is a
 * later judge pass, never fabricated here - and the process exits non-zero listing
 * those rows and any locale whose row count falls short of 207.
 *
 * CommonJS (the check-*.js precedent) so jest's unit transform loads it directly.
 * The catalogs are parsed with @babel/parser: the exported object literal whose
 * declarator is not PRAYER_LABELS, the name-independent rule the loader itself
 * uses (zh-Hans exports zhHans, pa-Arab exports paArab).
 */
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { basename, join } = require('node:path');
const { homedir } = require('node:os');
const { parse } = require('@babel/parser');

/** The pilot wave the owner reads personally (the owner's protocol, T-575) */
const PILOT_WAVE = ['ar', 'so', 'id', 'ms', 'min', 'mad', 'bug', 'ceb', 'ilo'];

/** The eleven prayer.* keys, the owner's first priority */
const PRAYER_KEYS = [
  'prayer.fajr',
  'prayer.sunrise',
  'prayer.dhuhr',
  'prayer.asr',
  'prayer.magrib',
  'prayer.isha',
  'prayer.midnight',
  'prayer.last third',
  'prayer.suhoor',
  'prayer.duha',
  'prayer.istijaba',
];

/** The five extras.explanation.* keys, the owner's second priority */
const EXPLANATION_KEYS = [
  'extras.explanation.midnight',
  'extras.explanation.last third',
  'extras.explanation.suhoor',
  'extras.explanation.duha',
  'extras.explanation.istijaba',
];

/** Section 3's rank table: the owner's category order over key prefixes */
const SECTION3_RANKS = [
  'settings',
  'settingsButton',
  'language',
  'sheet',
  'modal',
  'dialog',
  'alert',
  'prayerAlert',
  'overlay',
  'colorPicker',
  'stepper',
  'sound',
  'soundItem',
  'volume',
  'help',
  'calendar',
  'qibla',
  'widget',
];

/** The Arabic-script locales render right to left (catalogGates' own list) */
const RTL_LOCALES = new Set(['ar', 'ur', 'fa', 'ps', 'skr', 'bal', 'kas']);

const dirFor = (locale) => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr');

const sectionOf = (key) => {
  if (key.startsWith('prayer.')) return 1;
  if (key.startsWith('extras.explanation.')) return 2;
  return 3;
};

/**
 * Orders the catalog's keys into the owner's reading order: the eleven prayer
 * names, the five extras explanations, then the remaining keys by the section-3
 * prefix rank table with unranked prefixes following in catalog order.
 */
const orderedKeys = (en) => {
  const catalogOrder = Object.keys(en);
  const inCatalog = new Set(catalogOrder);
  const rest = catalogOrder.filter((key) => sectionOf(key) === 3);
  const catalogRank = new Map(catalogOrder.map((key, i) => [key, i]));
  rest.sort((a, b) => {
    const rankA = SECTION3_RANKS.indexOf(a.split('.')[0]);
    const rankB = SECTION3_RANKS.indexOf(b.split('.')[0]);
    if (rankA >= 0 && rankB >= 0) return rankA - rankB;
    if (rankA >= 0) return -1;
    if (rankB >= 0) return 1;
    return catalogRank.get(a) - catalogRank.get(b);
  });
  return [...PRAYER_KEYS.filter((k) => inCatalog.has(k)), ...EXPLANATION_KEYS.filter((k) => inCatalog.has(k)), ...rest];
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const spotCheckUrl = (locale, text) =>
  `https://translate.google.com/?sl=${locale}&tl=en&text=${encodeURIComponent(text)}&op=translate`;

/** Parses a catalog module's source: the exported object literal that is not PRAYER_LABELS */
const parseCatalogSource = (source, file) => {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
  for (const node of ast.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of node.declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || declarator.id.name === 'PRAYER_LABELS') continue;
      let literal = declarator.init;
      while (literal && (literal.type === 'TSSatisfiesExpression' || literal.type === 'TSAsExpression')) {
        literal = literal.expression;
      }
      if (literal?.type !== 'ObjectExpression') continue;
      const catalog = {};
      for (const property of literal.properties) {
        if (
          property.type !== 'ObjectProperty' ||
          property.key.type !== 'StringLiteral' ||
          property.value.type !== 'StringLiteral'
        ) {
          throw new Error(`i18n verify: ${file} holds a non-literal member`);
        }
        catalog[property.key.value] = property.value.value;
      }
      return catalog;
    }
  }
  throw new Error(`i18n verify: could not find the catalog object literal in ${file}`);
};

const gtxUrl = (locale, text) =>
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${locale}&tl=en&dt=t&q=${encodeURIComponent(text)}`;

const myMemoryUrl = (locale, text) =>
  `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${locale}|en`)}`;

const extractGtx = (body) => {
  try {
    const data = JSON.parse(body);
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const text = data[0]
      .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
      .join('');
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
};

const extractMyMemory = (body) => {
  try {
    const text = JSON.parse(body)?.responseData?.translatedText;
    return typeof text === 'string' && text.length > 0 ? text : null;
  } catch {
    return null;
  }
};

const ENGINES = {
  gtx: { url: gtxUrl, extract: extractGtx },
  mymemory: { url: myMemoryUrl, extract: extractMyMemory },
};

/** MyMemory-first is the expected configuration: gtx answered 429 from this machine */
const DEFAULT_ENGINE_ORDER = ['mymemory', 'gtx'];

/** One engine call with retry and backoff: the extracted text, or null when the budget is spent */
const fetchWithRetry = async (engineName, locale, text, deps, attempts = 3) => {
  const engine = ENGINES[engineName];
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await deps.fetch(engine.url(locale, text));
      if (!response.ok) throw new Error(`http ${response.status}`);
      const extracted = engine.extract(await response.text());
      if (extracted === null) throw new Error('empty body');
      return extracted;
    } catch {
      if (attempt === attempts - 1) return null;
      await deps.sleep(400 * 2 ** attempt);
    }
  }
  return null;
};

/**
 * One round-trip request per engine: the engines that answer, in the order they
 * were tried, with the non-answering ones held after them as failover targets.
 * A locale no engine serves answers []: its rows carry engine none for the judge
 * pass rather than two dead endpoints retried per row.
 */
const preFlight = async (engineNames, locale, probeText, deps) => {
  const answered = [];
  const dead = [];
  for (const engineName of engineNames) {
    const out = await fetchWithRetry(engineName, locale, probeText, deps, 1);
    (out === null ? dead : answered).push(engineName);
  }
  return answered.length === 0 ? [] : [...answered, ...dead];
};

/**
 * A round-trip is accepted when it is non-empty and either translates (differs from
 * the catalog string) or the row is a loanword whose catalog string equals its
 * English source - an unchanged echo there is the correct English rendering.
 */
const rowAccepts = (catalogValue, englishValue, roundtrip) => {
  if (roundtrip === null || roundtrip === '') return false;
  if (catalogValue === englishValue) return true;
  return roundtrip !== catalogValue;
};

/** Runs worker over items with a fixed pool, keeping each result at its item's index */
const mapPool = async (items, workerCount, worker) => {
  const results = new Array(items.length);
  let next = 0;
  const runner = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workerCount, items.length) }, runner));
  return results;
};

const buildRow = (locale, key, en, catalog) => ({
  key,
  en: en[key],
  catalog: catalog[key],
  roundtrip: null,
  engine: 'none',
  url: spotCheckUrl(locale, catalog[key]),
});

/** One locale's artifacts: every round-trip, the html and json pair, and its engine mix */
const runLocale = async (locale, opts) => {
  const { en, catalog, outDir, fetch, sleep, now } = opts;
  const deps = { fetch, sleep };
  const engineOrder = opts.engineOrder ?? DEFAULT_ENGINE_ORDER;
  // Rows come from the English key set; a locale missing a key yields fewer rows,
  // and the shortfall fails the run against the English count
  const keys = orderedKeys(en).filter((key) => catalog[key] !== undefined);
  const probeText = catalog[PRAYER_KEYS[0]] ?? en[PRAYER_KEYS[0]];
  const engines = await preFlight(engineOrder, locale, probeText, deps);

  const rows = await mapPool(keys, opts.concurrency ?? 4, async (key) => {
    const row = buildRow(locale, key, en, catalog);
    for (const engineName of engines) {
      const roundtrip = await fetchWithRetry(engineName, locale, catalog[key], deps);
      if (rowAccepts(catalog[key], en[key], roundtrip)) {
        row.roundtrip = roundtrip;
        row.engine = engineName;
        break;
      }
    }
    return row;
  });

  const engineMix = {};
  for (const row of rows) engineMix[row.engine] = (engineMix[row.engine] ?? 0) + 1;
  const misses = rows.filter((row) => row.engine === 'none');

  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, `${locale}.html`);
  const jsonPath = join(outDir, `${locale}.json`);
  writeFileSync(htmlPath, renderLocaleHtml(locale, rows));
  writeFileSync(
    jsonPath,
    `${JSON.stringify(buildLocaleJson(locale, rows, engineMix, now().toISOString()), null, 2)}\n`
  );

  return {
    locale,
    count: rows.length,
    rows,
    engineMix,
    misses,
    files: [htmlPath, jsonPath],
  };
};

const PROTOCOL_SENTENCES = [
  'A string passes when its meaning survives in the key&apos;s context; wording differences never fail a string.',
  'An uncertain or failed row is named by key and read against the second engine&apos;s round-trip; two engines agreeing on one meaning settle a yes.',
  'What still stands divergent is laid out plainly and the owner rules - the owner&apos;s word is always final.',
];

const renderRow = (locale, row) => {
  const roundtrip = row.roundtrip === null ? '' : row.roundtrip;
  return [
    '      <tr>',
    `        <td>${escapeHtml(row.key)}</td>`,
    `        <td dir="ltr" lang="en">${escapeHtml(row.en)}</td>`,
    `        <td dir="${dirFor(locale)}" lang="${escapeHtml(locale)}">${escapeHtml(row.catalog)}</td>`,
    `        <td dir="ltr" lang="en">${escapeHtml(roundtrip)}</td>`,
    `        <td>${escapeHtml(row.engine)}</td>`,
    `        <td><a href="${escapeHtml(row.url)}">translate</a></td>`,
    '      </tr>',
  ].join('\n');
};

const renderSection = (locale, rows, section, title) => {
  const sectionRows = rows.filter((row) => sectionOf(row.key) === section);
  return [
    `    <section id="section-${section}">`,
    `      <h2>${escapeHtml(title)} - ${sectionRows.length} rows</h2>`,
    '      <table>',
    '        <thead>',
    '          <tr><th>key</th><th>our English</th><th>our language string</th><th>round-trip English</th><th>engine</th><th>spot-check</th></tr>',
    '        </thead>',
    '        <tbody>',
    ...sectionRows.map((row) => renderRow(locale, row)),
    '        </tbody>',
    '      </table>',
    '    </section>',
  ].join('\n');
};

/** The locale's comparison page: a language string never appears without its English and its round-trip */
const renderLocaleHtml = (locale, rows) =>
  [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    `  <title>Athan translation verification - ${escapeHtml(locale)}</title>`,
    '  <style>',
    '    body { font-family: system-ui, sans-serif; margin: 2rem; color: #1c1c1e; background: #fff; }',
    '    table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; }',
    '    td, th { border: 1px solid #d2d2d7; padding: 0.4rem 0.6rem; text-align: start; vertical-align: top; }',
    '    th { background: #f5f5f7; position: sticky; top: 0; }',
    '    td[dir="rtl"] { text-align: right; }',
    '  </style>',
    '</head>',
    '<body>',
    `  <h1>${escapeHtml(locale)} - ${rows.length} rows</h1>`,
    `  <p>A string passes when its meaning survives in the key&apos;s context; wording differences never fail a string. Rows marked engine <code>none</code> carry no machine round-trip yet - the judge pass renders them later.</p>`,
    renderSection(locale, rows, 1, 'Section 1 - the eleven prayer.* names'),
    renderSection(locale, rows, 2, 'Section 2 - the five extras.explanation.* strings'),
    renderSection(locale, rows, 3, 'Section 3 - the remaining keys in the owner category order'),
    '</body>',
    '</html>',
    '',
  ].join('\n');

const buildLocaleJson = (locale, rows, engineMix, generatedAt) => ({
  locale,
  generatedAt,
  rowCount: rows.length,
  engineMix,
  rows: rows.map((row) => ({ ...row })),
});

/** The index: one line per locale with its row count and engine mix, and the verdict protocol */
const renderIndexHtml = (summaries) =>
  [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <title>Athan translation verification</title>',
    '</head>',
    '<body>',
    '  <h1>Athan translation verification</h1>',
    '  <ul>',
    ...summaries.map((summary) => {
      const mix = Object.entries(summary.engineMix)
        .map(([engine, count]) => `${engine}: ${count}`)
        .join(', ');
      return `    <li><a href="${escapeHtml(summary.file)}">${escapeHtml(summary.locale)}</a> - ${summary.count} rows - ${escapeHtml(mix)}</li>`;
    }),
    '  </ul>',
    '  <h2>The verdict protocol</h2>',
    ...PROTOCOL_SENTENCES.map((sentence) => `  <p>${sentence}</p>`),
    '</body>',
    '</html>',
    '',
  ].join('\n');

const usageError = (message) =>
  new Error(`i18n verify: ${message}; usage: node scripts/i18n-verify.js --locales ar,so [--out DIR] [--waves]`);

/** The command line flow. Every effect (network, clock, stdout, files) rides on deps */
const run = async (argv, deps = {}) => {
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const outFlag = flag('--out');
  const localesFlag = flag('--locales');
  const waves = argv.includes('--waves');
  if (!waves && (localesFlag === undefined || localesFlag.trim() === '')) {
    throw usageError('no locales named');
  }
  const locales = waves
    ? [...PILOT_WAVE]
    : localesFlag
        .split(',')
        .map((loc) => loc.trim())
        .filter(Boolean);

  const readCatalogFile =
    deps.readCatalogFile ??
    (async (locale) => {
      const file = join(__dirname, '..', 'shared', 'i18n', `${locale}.ts`);
      return parseCatalogSource(readFileSync(file, 'utf8'), `${locale}.ts`);
    });
  const log = deps.log ?? ((line) => process.stdout.write(`${line}\n`));
  const outDir = outFlag ?? join(deps.home ?? (deps.homedir ?? homedir)(), 'athan-i18n-verify');

  const en = await readCatalogFile('en');
  const expectedCount = Object.keys(en).length;
  const written = [];
  const summaries = [];
  const shortfalls = [];
  const misses = [];
  for (const locale of locales) {
    const catalog = await readCatalogFile(locale);
    const result = await runLocale(locale, {
      en,
      catalog,
      outDir,
      fetch: deps.fetch ?? globalThis.fetch,
      sleep: deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
      now: deps.now ?? (() => new Date()),
    });
    written.push(...result.files);
    const mix = Object.entries(result.engineMix)
      .map(([engine, count]) => `${engine}: ${count}`)
      .join(', ');
    log(`${locale}: ${result.count} rows (${mix})`);
    if (result.count < expectedCount) shortfalls.push({ locale, count: result.count });
    for (const miss of result.misses) misses.push({ locale, key: miss.key });
    summaries.push({ locale, count: result.count, engineMix: result.engineMix, file: `${locale}.html` });
  }

  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, renderIndexHtml(summaries));
  written.push(indexPath);

  if (shortfalls.length > 0) {
    log(`row shortfalls: ${shortfalls.map((s) => `${s.locale} at ${s.count} of ${expectedCount}`).join('; ')}`);
  }
  if (misses.length > 0) {
    log(
      `engine:none rows (both engines failed; the judge pass renders these): ${misses.map((m) => `${m.locale}/${m.key}`).join(', ')}`
    );
  }

  return {
    ok: shortfalls.length === 0 && misses.length === 0,
    locales,
    written,
    shortfalls,
    misses,
    summaryFiles: written.map((file) => basename(file)),
  };
};

if (require.main === module) {
  run(process.argv.slice(2)).then(
    (report) => {
      if (!report.ok) process.exitCode = 1;
    },
    (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
    }
  );
}

module.exports = {
  PILOT_WAVE,
  PRAYER_KEYS,
  EXPLANATION_KEYS,
  SECTION3_RANKS,
  parseCatalogSource,
  orderedKeys,
  sectionOf,
  escapeHtml,
  dirFor,
  spotCheckUrl,
  gtxUrl,
  myMemoryUrl,
  extractGtx,
  extractMyMemory,
  fetchWithRetry,
  preFlight,
  rowAccepts,
  runLocale,
  renderLocaleHtml,
  buildLocaleJson,
  renderIndexHtml,
  run,
};
