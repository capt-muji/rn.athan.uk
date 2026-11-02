/**
 * The T-575 verification generator: renders each locale's catalog as a two-engine
 * round-trip comparison the owner reads at a glance (owner orders two and three,
 * 2026-11-02).
 *
 *   node scripts/i18n-verify.js --locales ar,so [--out DIR] [--resume]
 *                               --waves | --all | --fill ar,so
 *
 * Every row carries TWO independent round-trips - Google's gtx endpoint first,
 * MyMemory second - both shown side by side, and a verdict color: green when both
 * engines carry the English string's meaning, red when neither does, amber when a
 * slot is missing, the engines diverge, or the judge doubted the row. A row both
 * engines refuses carries the judge LLM's rendering in one cell marked engine:llm,
 * never a site's rendering, and reads amber. Pages carry the language name beside
 * the code everywhere (the full 74 + English, parsed out of shared/languageNames.ts),
 * modern CSS, and both spot-check links: Google's human page and the exact MyMemory
 * API request (MyMemory's human pages silently redirect rare languages to wrong
 * ones, so the honest link is the request itself). English generates as the
 * reference page: keys and English strings, no engines.
 *
 * --resume reuses a slot's rendering only while the stored row's catalog text
 * matches the live catalog, refetches every missing slot, and recomputes verdicts -
 * the 31k-request wave rides repeated resume passes as keyless quotas reset. --fill
 * merges <locale>.llm-fill.json into both-miss rows (an optional doubt note rides
 * the row as amber) and refuses both directions of mismatch; the generator itself
 * never invents a rendering. The process exits non-zero listing any shortfall from
 * the English key count and any engine slot still missing without a judge fill.
 *
 * CommonJS (the check-*.js precedent) so jest's unit transform loads it directly.
 * Catalogs parse with @babel/parser: the exported object literal whose declarator
 * is not PRAYER_LABELS, the name-independent rule the loader itself uses.
 */
const { mkdirSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { homedir } = require('node:os');
const { parse } = require('@babel/parser');

/** The pilot wave the owner reads personally (the owner's protocol, T-575) */
const PILOT_WAVE = ['ar', 'so', 'id', 'ms', 'min', 'mad', 'bug', 'ceb', 'ilo'];

/** The two comparison engines, Google first (owner order three, 2026-11-02) */
const SITE_ENGINES = ['gtx', 'mymemory'];

/** Engine language codes where they differ from the repo's locale ids */
const LOCALE_ALIASES = { 'zh-Hans': 'zh-CN' };

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

/** Parses shared/languageNames.ts: the exported LANGUAGE_NAMES array of {id, name, english} */
const parseLanguageNames = (source, file) => {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
  for (const node of ast.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of node.declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || declarator.id.name !== 'LANGUAGE_NAMES') continue;
      if (declarator.init?.type !== 'ArrayExpression') break;
      const names = declarator.init.elements.map((element) => {
        const fields = {};
        for (const property of element?.properties ?? []) {
          if (
            property.type !== 'ObjectProperty' ||
            property.key.type !== 'Identifier' ||
            property.value.type !== 'StringLiteral'
          ) {
            throw new Error(`i18n verify: ${file} holds a non-literal language name`);
          }
          fields[property.key.name] = property.value.value;
        }
        if (!fields.id || !fields.name || !fields.english) {
          throw new Error(`i18n verify: ${file} holds an incomplete language name`);
        }
        return fields;
      });
      return names;
    }
  }
  throw new Error(`i18n verify: could not find the LANGUAGE_NAMES array in ${file}`);
};

const loadLanguageNames = (deps = {}) =>
  parseLanguageNames(
    deps.readNamesSource
      ? deps.readNamesSource()
      : readFileSync(join(__dirname, '..', 'shared', 'languageNames.ts'), 'utf8'),
    'languageNames.ts'
  );

/** The owner's label format: the code beside the name, parenthetical glosses stripped (min - Minangkabau) */
const displayName = (english) => english.replace(/ \([^)]*\)$/, '');

const languageLabel = (id, names) => {
  const entry = names.find((candidate) => candidate.id === id);
  return entry ? `${id} - ${displayName(entry.english)}` : id;
};

// --------------------------------------------------------------------------------------
// The meaning heuristic (the lead's tuning, owner order two): stopword-filtered token
// overlap over the shorter set at 0.5, plus a cognate rule (equal 4-char prefixes or
// edit distance <= 2 on tokens >= 5 chars) and a small synonym map for the UI vocabulary.
// --------------------------------------------------------------------------------------

/** English function words plus the transliteration articles round-trips carry */
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'to',
  'in',
  'at',
  'for',
  'and',
  'or',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'will',
  'would',
  'can',
  'could',
  'should',
  'may',
  'might',
  'must',
  'as',
  'by',
  'from',
  'with',
  'into',
  'per',
  'than',
  'then',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'their',
  'his',
  'her',
  'our',
  'your',
  'you',
  'we',
  'they',
  'he',
  'she',
  'them',
  'us',
  'i',
  'me',
  'my',
  'what',
  'which',
  'who',
  'whom',
  'when',
  'where',
  'not',
  'no',
  'nor',
  'so',
  'too',
  'very',
  'just',
  'also',
  's',
  't',
  'n',
  'al',
  'el',
  'dont',
  'doesnt',
  'cant',
  'wont',
  'isnt',
  'arent',
  'up',
  'youre',
]);

/** Synonym groups for this app's UI vocabulary; members match each other pairwise */
const SYNONYM_GROUPS = [
  ['fajr', 'dawn', 'morning'],
  ['dhuhr', 'noon', 'midday', 'zuhr'],
  ['asr', 'afternoon'],
  ['magrib', 'maghrib', 'sunset'],
  ['suhoor', 'sahur', 'suhur', 'sehri'],
  ['duha', 'forenoon', 'midmorning', 'morn', 'morning'],
  ['istijaba', 'istijabah', 'response'],
  ['athan', 'adhan', 'azan', 'call'],
  ['prayer', 'salah', 'salat', 'supplication', 'worship'],
  ['moment', 'second', 'seconds', 'instant'],
  ['notification', 'alert', 'notice', 'reminder', 'memory'],
  ['sound', 'audio', 'tone', 'voice'],
  ['silent', 'silence', 'mute', 'muted'],
  ['show', 'display', 'view', 'visible', 'appearance'],
  ['on', 'enable', 'enabled', 'activate', 'activated'],
  ['off', 'disable', 'disabled', 'deactivate', 'deactivated'],
  ['turn', 'switch'],
  ['open', 'launch'],
  ['stop', 'halt', 'cease', 'cancel', 'close', 'shut'],
  ['allow', 'permit'],
  ['phone', 'device', 'mobile'],
  ['check', 'verify', 'checking'],
  ['update', 'updates', 'upgrade', 'refresh'],
  ['select', 'choose', 'pick'],
  ['find', 'locate', 'search', 'finder'],
  ['direction', 'heading', 'bearing'],
  ['calendar', 'schedule', 'schedules', 'timetable'],
  ['why', 'reason'],
  ['disturb', 'bother', 'interrupt'],
  ['focus', 'concentrate'],
  ['name', 'title'],
  ['help', 'assist', 'assistance', 'guide', 'guidance'],
  ['last', 'final', 'end', 'ending'],
  ['add', 'added'],
  ['minute', 'minutes', 'min', 'mins'],
  ['hour', 'hours', 'hrs'],
  ['na', 'unavailable', 'none'],
  ['extra', 'overtime', 'additional'],
  ['preferences', 'selections', 'choices', 'options'],
  ['save', 'store'],
  ['reset', 'restore', 'return'],
  ['default', 'original'],
];

/** Phrase-level pairs the token matcher cannot see, compared on stopword-filtered text */
const PHRASE_SYNONYMS = [
  ['up to date', 'latest version', 'no new updates'],
  ['oh no', 'excuse me', 'unfortunately'],
];

const SYNONYM_INDEX = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    if (!SYNONYM_INDEX.has(word)) SYNONYM_INDEX.set(word, new Set());
    for (const other of group) {
      if (other !== word) SYNONYM_INDEX.get(word).add(other);
    }
  }
}

const levenshtein = (a, b) => {
  const previous = new Array(b.length + 1);
  const current = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) previous[j] = j;
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    for (let j = 0; j <= b.length; j++) previous[j] = current[j];
  }
  return previous[b.length];
};

/** The singular lookup, so plurals reach their group (reminders and alerts both land in the notification group) */
const singularOf = (word) =>
  SYNONYM_INDEX.has(word) || !word.endsWith('s') || word.length < 4 ? word : word.slice(0, -1);

const synonymMatch = (a, b) => {
  const left = singularOf(a);
  const right = singularOf(b);
  return SYNONYM_INDEX.get(left)?.has(right) === true || SYNONYM_INDEX.get(a)?.has(right) === true;
};

/** Two tokens of at least 5 characters whose prefixes or spellings are near enough */
const cognateMatch = (a, b) => {
  if (a.length < 5 || b.length < 5) return false;
  return a.slice(0, 4) === b.slice(0, 4) || levenshtein(a, b) <= 2;
};

/** A non-stopword token that prefixes a longer one: app/application, or a short pair like Mon/M and Jun/June */
const prefixMatch = (shorter, longer) => {
  if (shorter.length >= longer.length || STOPWORDS.has(shorter)) return false;
  if (!longer.startsWith(shorter)) return false;
  return shorter.length >= 3 || longer.length <= 4;
};

const tokenMatch = (a, b) => {
  if (a === b || cognateMatch(a, b) || prefixMatch(a, b) || prefixMatch(b, a)) return true;
  return synonymMatch(a, b);
};

const normalizeTokens = (text) =>
  String(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\bn\/a\b/g, 'na')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const filterStopwords = (tokens) => tokens.filter((token) => !STOPWORDS.has(token));

const PHRASE_INDEX = new Map();
for (const group of PHRASE_SYNONYMS) {
  for (const phrase of group) {
    PHRASE_INDEX.set(filterStopwords(normalizeTokens(phrase)).join(' '), group);
  }
}

/**
 * The verdict's meaning test: does the round-trip carry the English string's meaning?
 * Stopword-filtered token overlap over the shorter set at threshold 0.5, with cognate
 * and synonym matches counting toward the intersection. Sides emptied by stopword
 * filtering fall back to their raw tokens.
 */
const carriesMeaning = (en, roundtrip) => {
  const rawA = [...new Set(normalizeTokens(en))];
  const rawB = [...new Set(normalizeTokens(roundtrip))];
  if (rawA.length === 0 || rawB.length === 0) return false;
  let tokensA = filterStopwords(rawA);
  let tokensB = filterStopwords(rawB);
  if (tokensA.length === 0 || tokensB.length === 0) {
    tokensA = rawA;
    tokensB = rawB;
  }
  const phraseA = PHRASE_INDEX.get(tokensA.join(' '));
  const phraseB = PHRASE_INDEX.get(tokensB.join(' '));
  if (phraseA !== undefined && phraseA === phraseB) return true;
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const matched = shorter.filter((token) => longer.some((other) => tokenMatch(token, other))).length;
  return matched / shorter.length >= 0.5;
};

/**
 * The row verdict (owner order three: a pass rests on two engines agreeing): green
 * when both engine slots rendered and both carry the meaning, red when both rendered
 * and neither carries it, amber when a slot is missing, the judge filled (no
 * independent machine vouched for the row), or the judge doubted the rendering.
 */
const verdictOf = (en, sites, llm = null, doubt = null) => {
  if (doubt) return 'amber';
  const present = sites.filter((site) => site.roundtrip !== null && site.roundtrip !== '');
  if (present.length < sites.length) return 'amber';
  if (llm) return 'amber';
  const carried = present.filter((site) => carriesMeaning(en, site.roundtrip));
  if (carried.length === present.length) return 'green';
  if (carried.length === 0) return 'red';
  return 'amber';
};

// --------------------------------------------------------------------------------------
// The engines
// --------------------------------------------------------------------------------------

const engineLocale = (locale) => LOCALE_ALIASES[locale] ?? locale;

const gtxUrl = (locale, text) =>
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${engineLocale(locale)}&tl=en&dt=t&q=${encodeURIComponent(text)}`;

const myMemoryUrl = (locale, text) =>
  `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${engineLocale(locale)}|en`)}`;

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

/** The Google human page - the owner's first spot-check link */
const spotCheckUrl = (locale, text) =>
  `https://translate.google.com/?sl=${engineLocale(locale)}&tl=en&text=${encodeURIComponent(text)}&op=translate`;

/**
 * The MyMemory spot-check: the exact API request the generator made. MyMemory's human
 * pages silently redirect languages it lacks onto wrong ones (measured 2026-11-02:
 * Ilocano to Cebuano, Madurese to Maltese), so the honest second link is the request.
 */
const myMemoryCheckUrl = (locale, text) => myMemoryUrl(locale, text);

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
 * One probe per engine: the engines that answer. A locale's dead engines are not
 * hammered per row - their slots read miss until a later resume pass revives them.
 */
const preFlight = async (engineNames, locale, probeText, deps) => {
  const live = [];
  for (const engineName of engineNames) {
    const out = await fetchWithRetry(engineName, locale, probeText, deps, 1);
    if (out !== null) live.push(engineName);
  }
  return live;
};

/**
 * A slot accepts its engine's round-trip when it is non-empty and either translates
 * (differs from the catalog string) or the row is a loanword whose catalog string
 * equals its English source - an unchanged echo there is the correct rendering.
 */
const slotAccepts = (catalogValue, englishValue, roundtrip) => {
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
  sites: SITE_ENGINES.map((engineName) => ({ engine: engineName, roundtrip: null })),
  url: spotCheckUrl(locale, catalog[key]),
  url2: myMemoryCheckUrl(locale, catalog[key]),
  verdict: 'amber',
});

/** A resumed row's text for one slot, migrating the old single-round-trip shape */
const slotTextOf = (prior, slotIndex) => {
  if (!prior) return null;
  if (Array.isArray(prior.sites)) {
    return prior.sites[slotIndex]?.roundtrip ?? null;
  }
  const engineName = SITE_ENGINES[slotIndex];
  return prior.engine === engineName && prior.roundtrip ? prior.roundtrip : null;
};

const resumedLlmOf = (prior) => {
  if (!prior) return null;
  if (prior.llm) return prior.llm;
  if (prior.engine === 'llm' && prior.roundtrip) return { roundtrip: prior.roundtrip };
  return null;
};

/** One locale's artifacts: both engines' round-trips, the verdicts, and the gaps */
const runLocale = async (locale, opts) => {
  const { en, catalog, outDir, fetch, sleep, now, resumeRows } = opts;
  const deps = { fetch, sleep };
  // Rows come from the English key set; a locale missing a key yields fewer rows,
  // and the shortfall fails the run against the English count
  const keys = orderedKeys(en).filter((key) => catalog[key] !== undefined);
  const probeText = catalog[PRAYER_KEYS[0]] ?? en[PRAYER_KEYS[0]];
  const live = opts.liveEngines ?? (await preFlight(SITE_ENGINES, locale, probeText, deps));

  const rows = await mapPool(keys, opts.concurrency ?? 4, async (key) => {
    const prior = resumeRows?.get(key);
    // A resumed row is reusable only while its catalog string still matches
    const priorFresh = prior && prior.catalog === catalog[key] ? prior : null;
    const row = buildRow(locale, key, en, catalog);
    for (let slotIndex = 0; slotIndex < SITE_ENGINES.length; slotIndex++) {
      const resumedText = slotTextOf(priorFresh, slotIndex);
      if (resumedText !== null && resumedText !== '') {
        row.sites[slotIndex].roundtrip = resumedText;
        continue;
      }
      const engineName = SITE_ENGINES[slotIndex];
      if (!live.includes(engineName)) continue;
      const roundtrip = await fetchWithRetry(engineName, locale, catalog[key], deps);
      if (slotAccepts(catalog[key], en[key], roundtrip)) {
        row.sites[slotIndex].roundtrip = roundtrip;
      }
    }
    const bothMiss = row.sites.every((site) => site.roundtrip === null);
    if (bothMiss) {
      const resumedLlm = resumedLlmOf(priorFresh);
      if (resumedLlm) row.llm = resumedLlm;
    }
    row.verdict = verdictOf(row.en, row.sites, row.llm ?? null, row.llm?.doubt ?? null);
    return row;
  });

  const counts = { green: 0, red: 0, amber: 0 };
  const engineMix = { gtx: 0, mymemory: 0, miss: 0 };
  const misses = [];
  for (const row of rows) {
    counts[row.verdict] += 1;
    for (const site of row.sites) {
      engineMix[site.roundtrip !== null ? site.engine : 'miss'] += 1;
    }
    if (row.llm) engineMix.llm = (engineMix.llm ?? 0) + 1;
    const missing = row.sites.filter((site) => site.roundtrip === null).map((site) => site.engine);
    if (missing.length > 0 && !row.llm) misses.push({ locale, key: row.key, missing });
  }

  const label = opts.label ?? locale;
  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, `${locale}.html`);
  const jsonPath = join(outDir, `${locale}.json`);
  writeFileSync(htmlPath, renderLocaleHtml(locale, label, rows));
  writeFileSync(jsonPath, `${JSON.stringify(buildLocaleJson(locale, label, rows, now().toISOString()), null, 2)}\n`);

  return { locale, count: rows.length, rows, counts, engineMix, misses, files: [htmlPath, jsonPath] };
};

/** The English reference page's rows: the key and the English string, nothing else */
const referenceRowsOf = (en) => orderedKeys(en).map((key) => ({ key, en: en[key] }));

// --------------------------------------------------------------------------------------
// The pages (owner order two: modern, simple, human-friendly, colored)
// --------------------------------------------------------------------------------------

const PAGE_STYLE = `
    :root { --bg:#f4f5f7; --card:#ffffff; --ink:#1b1f24; --muted:#667085; --line:#e4e7ec; --accent:#175cd3;
      --green:#067647; --green-bg:#e9f6ef; --red:#b42318; --red-bg:#fdebe9; --amber:#b54708; --amber-bg:#fef3e2; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg); color: var(--ink); margin: 0; padding: 1.75rem 1rem 3rem; line-height: 1.5; }
    .wrap { max-width: 1220px; margin: 0 auto; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px;
      padding: 1.1rem 1.4rem; margin-bottom: 1.25rem; box-shadow: 0 1px 2px rgba(16,24,40,0.05); }
    h1 { font-size: 1.45rem; margin: 0 0 0.2rem; letter-spacing: -0.01em; }
    h2 { font-size: 1.08rem; margin: 0 0 0.7rem; }
    .muted { color: var(--muted); font-size: 0.9rem; margin: 0; }
    .chips { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-top: 0.6rem; align-items: center; }
    .chip { border-radius: 999px; padding: 0.12rem 0.68rem; font-size: 0.82rem; font-weight: 600; }
    .chip.g { background: var(--green-bg); color: var(--green); }
    .chip.r { background: var(--red-bg); color: var(--red); }
    .chip.a { background: var(--amber-bg); color: var(--amber); }
    .chip.n { background: #eef1f5; color: var(--muted); }
    table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
    th { position: sticky; top: 0; background: #f8fafb; text-align: start; font-size: 0.72rem;
      text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
    td, th { padding: 0.42rem 0.6rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    tr.g td { background: var(--green-bg); }
    tr.r td { background: var(--red-bg); }
    tr.a td { background: var(--amber-bg); }
    tr.g td:first-child, tr.r td:first-child, tr.a td:first-child { box-shadow: inset 3px 0 0 currentColor; }
    tr.g td:first-child { color: var(--green); }
    tr.r td:first-child { color: var(--red); }
    tr.a td:first-child { color: var(--amber); }
    .key { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.78rem; color: var(--muted); }
    td[dir="rtl"] { text-align: right; }
    .pill { display: inline-block; border-radius: 6px; padding: 0 0.45rem; font-size: 0.7rem;
      font-weight: 600; vertical-align: 1px; }
    .pill.llm { background: #eef0ff; color: #42389d; }
    .pill.miss { background: #eef1f5; color: #98a2b3; }
    .v { font-weight: 600; font-size: 0.8rem; }
    tr.g .v { color: var(--green); }
    tr.r .v { color: var(--red); }
    tr.a .v { color: var(--amber); }
    .doubt { color: var(--muted); font-size: 0.8rem; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-bottom: 0.75rem; font-size: 0.9rem; }
`;

const INDEX_STYLE = `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
    a.card { display: block; color: inherit; transition: border-color 0.15s ease; }
    a.card:hover { border-color: var(--accent); text-decoration: none; }
    .lang { font-weight: 650; margin-bottom: 0.35rem; }
    .legend { display: flex; gap: 1.2rem; flex-wrap: wrap; margin: 0.6rem 0 1.2rem; font-size: 0.88rem; }
    .dot { display: inline-block; width: 0.6rem; height: 0.6rem; border-radius: 999px; margin-right: 0.3rem; }
`;

const PAGE_SHELL_OPEN = (title, extra = '') =>
  [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    `  <title>${escapeHtml(title)}</title>`,
    '  <style>',
    PAGE_STYLE,
    extra,
    '  </style>',
    '</head>',
    '<body>',
    '  <div class="wrap">',
  ].join('\n');

const PAGE_SHELL_CLOSE = ['  </div>', '</body>', '</html>', ''].join('\n');

const verdictClass = { green: 'g', red: 'r', amber: 'a' };

const renderRow = (locale, row) => {
  const bothMiss = row.sites.every((site) => site.roundtrip === null);
  const roundtripCells =
    row.llm && bothMiss
      ? [
          `        <td class="llm" colspan="2"><span class="pill llm">llm</span> ${escapeHtml(row.llm.roundtrip)}${
            row.llm.doubt ? `<br><span class="doubt">doubted: ${escapeHtml(row.llm.doubt)}</span>` : ''
          }</td>`,
        ]
      : row.sites
          .map((site) =>
            site.roundtrip === null
              ? '        <td><span class="pill miss">miss</span></td>'
              : `        <td dir="ltr" lang="en">${escapeHtml(site.roundtrip)}</td>`
          )
          .join('\n');
  return [
    `      <tr class="${verdictClass[row.verdict]}">`,
    `        <td class="key">${escapeHtml(row.key)}</td>`,
    `        <td dir="ltr" lang="en">${escapeHtml(row.en)}</td>`,
    `        <td dir="${dirFor(locale)}" lang="${escapeHtml(locale)}">${escapeHtml(row.catalog)}</td>`,
    roundtripCells,
    `        <td><span class="v">${escapeHtml(row.verdict)}</span></td>`,
    `        <td><a href="${escapeHtml(row.url)}">Google</a> <a href="${escapeHtml(row.url2)}">MyMemory</a></td>`,
    '      </tr>',
  ].join('\n');
};

const renderSection = (locale, rows, section, title) => {
  const sectionRows = rows.filter((row) => sectionOf(row.key) === section);
  const counts = { green: 0, red: 0, amber: 0 };
  for (const row of sectionRows) counts[row.verdict] += 1;
  return [
    `    <section class="card" id="section-${section}">`,
    `      <h2>${escapeHtml(title)} - ${sectionRows.length} rows</h2>`,
    `      <div class="chips"><span class="chip g">${counts.green} green</span><span class="chip r">${counts.red} red</span><span class="chip a">${counts.amber} amber</span></div>`,
    '      <table>',
    '        <thead>',
    '          <tr><th>key</th><th>our English</th><th>our language string</th><th>Google round-trip</th><th>MyMemory round-trip</th><th>verdict</th><th>check</th></tr>',
    '        </thead>',
    '        <tbody>',
    ...sectionRows.map((row) => renderRow(locale, row)),
    '        </tbody>',
    '      </table>',
    '    </section>',
  ].join('\n');
};

/** The locale's comparison page: a language string never appears without its English and both round-trips */
const renderLocaleHtml = (locale, label, rows) => {
  const counts = { green: 0, red: 0, amber: 0 };
  const mix = {};
  let filled = 0;
  for (const row of rows) {
    counts[row.verdict] += 1;
    if (row.llm) filled += 1;
    for (const site of row.sites) {
      const bucket = site.roundtrip !== null ? site.engine : 'miss';
      mix[bucket] = (mix[bucket] ?? 0) + 1;
    }
  }
  const mixLine = Object.entries(mix)
    .map(([engine, count]) => `${engine}: ${count}`)
    .join(', ');
  return [
    PAGE_SHELL_OPEN(`Athan translation verification - ${label}`),
    '  <a class="back" href="index.html">&larr; all languages</a>',
    '  <header class="card">',
    `    <h1>${escapeHtml(label)}</h1>`,
    `    <p class="muted">${rows.length} rows - Google and MyMemory round-trips side by side. Green: both engines carry the meaning. Red: neither does - follow the red. Amber: a slot is missing, the engines diverge, or the judge doubted the row${filled > 0 ? ` (${filled} rows carry the judge's llm rendering)` : ''}.</p>`,
    `    <div class="chips"><span class="chip g">${counts.green} green</span><span class="chip r">${counts.red} red</span><span class="chip a">${counts.amber} amber</span><span class="chip n">${escapeHtml(mixLine)}</span></div>`,
    '  </header>',
    renderSection(locale, rows, 1, 'Section 1 - the eleven prayer.* names'),
    renderSection(locale, rows, 2, 'Section 2 - the five extras.explanation.* strings'),
    renderSection(locale, rows, 3, 'Section 3 - the remaining keys in the owner category order'),
    PAGE_SHELL_CLOSE,
  ].join('\n');
};

/** The English reference page: what every language is judged against */
const renderReferenceHtml = (label, rows) =>
  [
    PAGE_SHELL_OPEN(`Athan translation verification - ${label} (reference)`),
    '  <a class="back" href="index.html">&larr; all languages</a>',
    '  <header class="card">',
    `    <h1>${escapeHtml(label)}</h1>`,
    `    <p class="muted">The reference page: the ${rows.length} English source strings every language is judged against, in the owner's priority order. The engine columns and the colors live on each language's own page.</p>`,
    '  </header>',
    ...[1, 2, 3].map((section) => {
      const sectionRows = rows.filter((row) => sectionOf(row.key) === section);
      const titles = {
        1: 'Section 1 - the eleven prayer.* names',
        2: 'Section 2 - the five extras.explanation.* strings',
        3: 'Section 3 - the remaining keys in the owner category order',
      };
      return [
        `    <section class="card" id="section-${section}">`,
        `      <h2>${escapeHtml(titles[section])} - ${sectionRows.length} rows</h2>`,
        '      <table>',
        '        <thead>',
        '          <tr><th>key</th><th>our English</th></tr>',
        '        </thead>',
        '        <tbody>',
        ...sectionRows.map(
          (row) =>
            `        <tr><td class="key">${escapeHtml(row.key)}</td><td dir="ltr" lang="en">${escapeHtml(row.en)}</td></tr>`
        ),
        '        </tbody>',
        '      </table>',
        '    </section>',
      ].join('\n');
    }),
    PAGE_SHELL_CLOSE,
  ].join('\n');

const buildLocaleJson = (locale, label, rows, generatedAt) => ({
  locale,
  languageName: label,
  generatedAt,
  rowCount: rows.length,
  counts: rows.reduce(
    (counts, row) => {
      counts[row.verdict] += 1;
      return counts;
    },
    { green: 0, red: 0, amber: 0 }
  ),
  rows: rows.map((row) => ({ ...row })),
});

/** The index: one card per language with its counts, reds first, the reference pinned on top */
const renderIndexHtml = (summaries) => {
  const reference = summaries.filter((summary) => summary.reference);
  const rest = [...summaries.filter((summary) => !summary.reference)].sort((a, b) => {
    const red = (b.counts?.red ?? 0) - (a.counts?.red ?? 0);
    if (red !== 0) return red;
    const amber = (b.counts?.amber ?? 0) - (a.counts?.amber ?? 0);
    if (amber !== 0) return amber;
    return a.label.localeCompare(b.label);
  });
  const card = (summary) => {
    const counts = summary.counts
      ? `<div class="chips"><span class="chip g">${summary.counts.green} green</span><span class="chip r">${summary.counts.red} red</span><span class="chip a">${summary.counts.amber} amber</span></div>`
      : '';
    const mix = summary.engineMix
      ? `<p class="muted">${Object.entries(summary.engineMix)
          .map(([engine, count]) => `${engine}: ${count}`)
          .join(', ')}</p>`
      : '';
    const tag = summary.reference ? ' <span class="chip n">reference</span>' : '';
    return `      <a class="card" href="${escapeHtml(summary.file)}"><div class="lang">${escapeHtml(summary.label)}${tag}</div>${counts}<p class="muted">${summary.count} rows</p>${mix}</a>`;
  };
  return [
    PAGE_SHELL_OPEN('Athan translation verification', INDEX_STYLE),
    '  <header class="card">',
    '    <h1>Athan translation verification</h1>',
    '    <p class="muted">Every catalog against the English source, two independent round-trips per row: Google first, MyMemory second. Open a language and follow the red; amber rows wait on a re-run or the judge.</p>',
    '    <div class="legend">',
    '      <span><span class="dot" style="background:var(--green)"></span>green - both engines carry the meaning</span>',
    '      <span><span class="dot" style="background:var(--red)"></span>red - neither engine carries it, check the string</span>',
    '      <span><span class="dot" style="background:var(--amber)"></span>amber - missing data, diverging engines, or a doubted row</span>',
    '    </div>',
    '  </header>',
    '  <div class="grid">',
    ...[...reference, ...rest].map(card),
    '  </div>',
    PAGE_SHELL_CLOSE,
  ].join('\n');
};

// --------------------------------------------------------------------------------------
// The judge fill and the command line flow
// --------------------------------------------------------------------------------------

const usageError = (message) =>
  new Error(
    `i18n verify: ${message}; usage: node scripts/i18n-verify.js --locales ar,so [--out DIR] [--resume] | --waves | --all | --fill ar,so [--out DIR]`
  );

const defaultOutDir = (deps) => join(deps.home ?? (deps.homedir ?? homedir)(), 'athan-i18n-verify');

const summaryOfArtifact = (data, names) => ({
  locale: data.locale,
  label: data.languageName ?? languageLabel(data.locale, names),
  count: data.rowCount,
  counts: data.counts,
  engineMix: data.engineMix ?? data.counts,
  file: `${data.locale}.html`,
  reference: data.reference === true,
});

/**
 * The judge fill: the LLM pass renders round-trips for rows both engines refused and
 * writes <locale>.llm-fill.json; this merge carries them into llm-marked rows (never a
 * site's rendering), keeps an optional doubt note as amber, and refreshes the
 * artifacts. The generator itself never invents a round-trip.
 */
const fillLocales = async (locales, { outDir, log, now, names }) => {
  const written = [];
  const fillErrors = [];

  for (const locale of locales) {
    const artifact = JSON.parse(readFileSync(join(outDir, `${locale}.json`), 'utf8'));
    const fills = JSON.parse(readFileSync(join(outDir, `${locale}.llm-fill.json`), 'utf8'));
    const fillByKey = new Map();
    for (const fill of fills) {
      if (fillByKey.has(fill.key)) fillErrors.push(`${locale}/${fill.key} is filled twice`);
      fillByKey.set(fill.key, fill);
    }
    const rows = artifact.rows;
    for (const fill of fills) {
      const row = rows.find((candidate) => candidate.key === fill.key);
      const bothMiss = row !== undefined && (row.sites ?? []).every((site) => site.roundtrip === null);
      if (!bothMiss) fillErrors.push(`${locale}/${fill.key} is not a both-miss row`);
    }
    for (const row of rows) {
      const bothMiss = (row.sites ?? []).every((site) => site.roundtrip === null);
      if (bothMiss && row.llm === undefined && !fillByKey.has(row.key)) {
        fillErrors.push(`${locale}/${row.key} has no judge round-trip`);
      }
    }
    if (fillErrors.some((message) => message.startsWith(`${locale}/`))) {
      log(
        `${locale}: fill refused, artifacts untouched (${fillErrors.filter((m) => m.startsWith(`${locale}/`)).length} errors)`
      );
      continue;
    }

    let filled = 0;
    let doubted = 0;
    for (const row of rows) {
      const fill = fillByKey.get(row.key);
      if (fill === undefined) continue;
      filled += 1;
      if (fill.doubt) doubted += 1;
      row.llm = { roundtrip: fill.roundtrip, ...(fill.doubt ? { doubt: fill.doubt } : {}) };
      row.verdict = verdictOf(row.en, row.sites ?? [], row.llm, row.llm.doubt ?? null);
    }
    const label = artifact.languageName ?? languageLabel(locale, names);
    writeFileSync(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(buildLocaleJson(locale, label, rows, now().toISOString()), null, 2)}\n`
    );
    writeFileSync(join(outDir, `${locale}.html`), renderLocaleHtml(locale, label, rows));
    written.push(join(outDir, `${locale}.json`), join(outDir, `${locale}.html`));
    log(`${locale}: filled ${filled} rows as engine:llm (${doubted} doubted)`);
  }

  const indexSummaries = [];
  for (const file of readdirSync(outDir)) {
    if (!file.endsWith('.json') || file.endsWith('.llm-fill.json')) continue;
    const data = JSON.parse(readFileSync(join(outDir, file), 'utf8'));
    indexSummaries.push(summaryOfArtifact(data, names));
  }
  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, renderIndexHtml(indexSummaries));
  written.push(indexPath);

  return { ok: fillErrors.length === 0, locales, written, shortfalls: [], misses: [], fillErrors };
};

/** The command line flow. Every effect (network, clock, stdout, files) rides on deps */
const run = async (argv, deps = {}) => {
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const outFlag = flag('--out');
  const localesFlag = flag('--locales');
  const fillFlag = flag('--fill');
  const waves = argv.includes('--waves');
  const all = argv.includes('--all');
  const resume = argv.includes('--resume');
  if (!waves && !all && localesFlag === undefined && fillFlag === undefined) {
    throw usageError('no locales named');
  }
  const names = loadLanguageNames(deps);
  const allLocales = ['en', ...names.map((entry) => entry.id).filter((id) => id !== 'en')];
  const locales = fillFlag
    ? fillFlag
        .split(',')
        .map((loc) => loc.trim())
        .filter(Boolean)
    : all
      ? allLocales
      : waves
        ? [...PILOT_WAVE]
        : localesFlag
            .split(',')
            .map((loc) => loc.trim())
            .filter(Boolean);

  if (locales.length === 0) {
    throw usageError('no locales named');
  }
  const unknown = locales.filter((locale) => !allLocales.includes(locale));
  if (unknown.length > 0) {
    throw usageError(`unknown locale ${unknown.join(', ')} (not in shared/languageNames.ts)`);
  }

  const log = deps.log ?? ((line) => process.stdout.write(`${line}\n`));
  const outDir = outFlag ?? defaultOutDir(deps);

  if (fillFlag !== undefined) {
    return fillLocales(locales, { outDir, log, now: deps.now ?? (() => new Date()), names });
  }

  const readCatalogFile =
    deps.readCatalogFile ??
    (async (locale) => {
      const file = join(__dirname, '..', 'shared', 'i18n', `${locale}.ts`);
      return parseCatalogSource(readFileSync(file, 'utf8'), `${locale}.ts`);
    });

  const en = await readCatalogFile('en');
  const expectedCount = Object.keys(en).length;
  const written = [];
  const summaries = [];
  const shortfalls = [];
  const misses = [];

  if (locales.includes('en')) {
    const label = languageLabel('en', names);
    const rows = referenceRowsOf(en);
    mkdirSync(outDir, { recursive: true });
    const htmlPath = join(outDir, 'en.html');
    const jsonPath = join(outDir, 'en.json');
    writeFileSync(htmlPath, renderReferenceHtml(label, rows));
    writeFileSync(
      jsonPath,
      `${JSON.stringify({ locale: 'en', languageName: label, reference: true, generatedAt: (deps.now ?? (() => new Date()))().toISOString(), rowCount: rows.length, rows }, null, 2)}\n`
    );
    written.push(htmlPath, jsonPath);
    summaries.push({ locale: 'en', label, count: rows.length, file: 'en.html', reference: true });
    log(`en: ${rows.length} rows (the reference page)`);
  }

  for (const locale of locales.filter((candidate) => candidate !== 'en')) {
    const catalog = await readCatalogFile(locale);
    let resumeRows;
    if (resume) {
      const priorPath = join(outDir, `${locale}.json`);
      try {
        const prior = JSON.parse(readFileSync(priorPath, 'utf8'));
        if (prior.rows) resumeRows = new Map(prior.rows.map((row) => [row.key, row]));
      } catch {
        resumeRows = undefined;
      }
    }
    const result = await runLocale(locale, {
      en,
      catalog,
      outDir,
      fetch: deps.fetch ?? globalThis.fetch,
      sleep: deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
      now: deps.now ?? (() => new Date()),
      resumeRows,
      label: languageLabel(locale, names),
    });
    written.push(...result.files);
    const mix = Object.entries(result.engineMix)
      .map(([engine, count]) => `${engine}: ${count}`)
      .join(', ');
    log(
      `${locale}: ${result.count} rows (${result.counts.green} green, ${result.counts.red} red, ${result.counts.amber} amber; ${mix})`
    );
    if (result.count < expectedCount) shortfalls.push({ locale, count: result.count });
    misses.push(...result.misses);
    summaries.push({
      locale,
      label: languageLabel(locale, names),
      count: result.count,
      counts: result.counts,
      engineMix: result.engineMix,
      file: `${locale}.html`,
    });
  }

  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, renderIndexHtml(summaries));
  written.push(indexPath);

  if (shortfalls.length > 0) {
    log(`row shortfalls: ${shortfalls.map((s) => `${s.locale} at ${s.count} of ${expectedCount}`).join('; ')}`);
  }
  if (misses.length > 0) {
    const head = misses
      .slice(0, 40)
      .map((m) => `${m.locale}/${m.key} (${m.missing.join('+')})`)
      .join(', ');
    log(
      `engine slot gaps awaiting a resume pass or the judge fill: ${misses.length} rows - ${head}${misses.length > 40 ? ' ...' : ''}`
    );
  }

  return {
    ok: shortfalls.length === 0 && misses.length === 0,
    locales,
    written,
    shortfalls,
    misses,
    fillErrors: [],
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
  SITE_ENGINES,
  LOCALE_ALIASES,
  PRAYER_KEYS,
  EXPLANATION_KEYS,
  SECTION3_RANKS,
  RTL_LOCALES,
  parseCatalogSource,
  parseLanguageNames,
  loadLanguageNames,
  displayName,
  languageLabel,
  orderedKeys,
  sectionOf,
  escapeHtml,
  dirFor,
  spotCheckUrl,
  myMemoryCheckUrl,
  gtxUrl,
  myMemoryUrl,
  extractGtx,
  extractMyMemory,
  fetchWithRetry,
  preFlight,
  levenshtein,
  carriesMeaning,
  verdictOf,
  slotAccepts,
  runLocale,
  referenceRowsOf,
  renderLocaleHtml,
  renderReferenceHtml,
  buildLocaleJson,
  renderIndexHtml,
  fillLocales,
  defaultOutDir,
  run,
};
