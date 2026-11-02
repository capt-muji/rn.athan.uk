/**
 * The T-575 verification generator: renders each locale's catalog as a round-trip
 * comparison the owner reads at a glance. Owner order six (2026-11-02) removed
 * MyMemory entirely - not the second site, not a fallback, not a fetch - so the
 * engine chain is Google's gtx endpoint alone and the generator never requests
 * MyMemory again; any MyMemory renderings in existing artifacts are historical and
 * a resume pass drops them (a resumed slot is adopted only when its engine still
 * owns that slot). The two-slot row model stands: slot one is Google's round-trip,
 * slot two sits empty - engine "pending" - until phase two adds the second site.
 *
 *   node scripts/i18n-verify.js --locales ar,so [--out DIR] [--resume]
 *                               [--pace ms] --waves | --all | --fill ar,so
 *
 * The verdict color reads at a glance; rows the engine refuses carry the judge
 * LLM's rendering in one cell marked engine:llm, never a site's rendering. Pages
 * carry the language name beside the code everywhere (the full 74 + English,
 * parsed out of shared/languageNames.ts), modern CSS, and Google's spot-check
 * link. English generates as the reference page: keys and English strings, no
 * engines.
 *
 * --resume reuses a slot's rendering only while the stored row's catalog text
 * matches the live catalog, refetches every missing slot, and recomputes verdicts.
 * --fill merges <locale>.llm-fill.json into unrendered rows (an optional doubt
 * note rides the row as amber), refuses duplicates and unknown keys, skips entries
 * the engine has since superseded, and lists still-unfilled rows as gaps; the
 * generator itself never invents a rendering. The process exits non-zero listing
 * any shortfall from the English key count and any engine slot still missing
 * without a judge fill.
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

/** The engine chain: Google's gtx alone (owner order six, 2026-11-02: MyMemory is out) */
const SITE_ENGINES = ['gtx'];

/** The two-slot row model: slot one Google's, slot two pending phase two's second site */
const ROW_SLOTS = ['gtx', 'pending'];

/** Engine language codes where they differ from the repo's locale ids */
const LOCALE_ALIASES = { 'zh-Hans': 'zh-CN', jv: 'jw' };

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

/** Parses shared/i18n/locale.ts: the exported RTL_IDS set, the one source of direction truth */
const parseRtlIds = (source, file) => {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
  for (const node of ast.program.body) {
    const declaration = node.type === 'VariableDeclaration' ? node : node.declaration;
    if (node.type !== 'VariableDeclaration' && node.type !== 'ExportNamedDeclaration') continue;
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || declarator.id.name !== 'RTL_IDS') continue;
      const call = declarator.init;
      if (call?.type !== 'NewExpression' || call.callee?.type !== 'Identifier' || call.callee.name !== 'Set') break;
      const ids = call.arguments[0]?.elements ?? [];
      return new Set(
        ids.map((element) => {
          if (element?.type !== 'StringLiteral') {
            throw new Error(`i18n verify: ${file} holds a non-literal RTL id`);
          }
          return element.value;
        })
      );
    }
  }
  throw new Error(`i18n verify: could not find the RTL_IDS set in ${file}`);
};

const loadRtlIds = (deps = {}) =>
  parseRtlIds(
    deps.readLocaleSource
      ? deps.readLocaleSource()
      : readFileSync(join(__dirname, '..', 'shared', 'i18n', 'locale.ts'), 'utf8'),
    'locale.ts'
  );

const dirFor = (locale, rtl) => (rtl.has(locale) ? 'rtl' : 'ltr');

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
  // sabah and aksham are the Bosnian traditional names, each its own morning/evening sense
  ['fajr', 'dawn', 'morning', 'sabah'],
  // zahr is the Arabic midday word; lunch is its own meal sense (the isha/dinner precedent)
  ['dhuhr', 'noon', 'midday', 'zuhr', 'zohr', 'lunch', 'zohar'],
  // Sunrise is whole-sense only (owner order eleven): a fragment like 'rise' or 'sun'
  // never verifies it; the Shuruk family carries for the languages that transliterate
  ['sunrise', 'sunup', 'shuruq', 'shuruk', 'syuruq'],
  ['asr', 'afternoon', 'ashar', 'asher', 'era', 'asar'],
  // Morocco is al-Maghrib in Arabic, but the owner's order ten rules the country's name
  // never verifies the prayer: the word's plain evening sense is the only engine reading
  // beyond the name itself that carries
  ['magrib', 'maghrib', 'sunset', 'evening', 'aksham'],
  // al-isha is the Arabic word for the evening meal; the prayer name derives from it.
  // Isak is the engine's romanization of Malay Isyak - it names the prayer itself (the Ashar/Asher class)
  ['isha', 'nightfall', 'dinner', 'supper', 'isak'],
  ['suhoor', 'sahur', 'suhur', 'sehri', 'sahri', 'sahar'],
  ['duha', 'forenoon', 'midmorning', 'morn', 'morning'],
  ['istijaba', 'istijabah', 'response', 'answer'],
  // Owner order twelve: athan is transliterated in every language; Azaan is the Somali
  // spelling of the same word (as Isak is of Isyak)
  ['athan', 'adhan', 'azan', 'azaan', 'call'],
  ['prayer', 'salah', 'salat', 'supplication', 'worship', 'dasal', 'namaz'],
  ['moment', 'second', 'seconds', 'instant'],
  ['notification', 'alert', 'notice', 'reminder', 'memory', 'warning', 'note', 'information'],
  ['sound', 'audio', 'tone', 'voice'],
  ['silent', 'silence', 'mute', 'muted', 'dumb'],
  // tampilan, the Malay family's display word, renders as layout - its own appearance sense.
  // Azerbaijani ekran is the display word and renders as screen, its own sense
  ['show', 'display', 'view', 'visible', 'appearance', 'layout', 'screen', 'reveal'],
  ['on', 'enable', 'enabled', 'activate', 'activated'],
  // mati is Indonesian's standard device-off word; the engine renders its literal sense.
  // Minangkabau shares the word, and die is that literal sense's own verb.
  // Cebuano gipatay (killed) is the same device-off class
  [
    'off',
    'disable',
    'disabled',
    'deactivate',
    'deactivated',
    'dead',
    'die',
    'killed',
    'gone',
    'closed',
    'close',
    'passive',
    // German aus renders as out of - its own off sense
    'out',
  ],
  ['turn', 'switch'],
  ['open', 'launch'],
  ['stop', 'halt', 'cease', 'cancel', 'close', 'shut', 'delete'],
  ['allow', 'permit'],
  ['phone', 'device', 'mobile'],
  ['check', 'verify', 'checking'],
  ['update', 'updates', 'upgrade', 'refresh', 'improve'],
  ['select', 'choose', 'pick'],
  ['find', 'locate', 'search', 'finder'],
  ['direction', 'heading', 'bearing'],
  ['calendar', 'schedule', 'schedules', 'timetable'],
  ['why', 'reason'],
  ['disturb', 'bother', 'interrupt'],
  ['focus', 'concentrate'],
  ['name', 'title'],
  ['help', 'assist', 'assistance', 'guide', 'guidance', 'aid'],
  ['last', 'final', 'end', 'ending'],
  ['add', 'added'],
  ['minute', 'minutes', 'min', 'mins'],
  ['hour', 'hours', 'hrs'],
  // can't loses its apostrophe in normalisation, so the member is the bare form
  ['na', 'unavailable', 'none', 'cant', 'nothing'],
  ['extra', 'overtime', 'additional'],
  ['preferences', 'selections', 'choices', 'options'],
  ['save', 'store'],
  ['reset', 'restore', 'return', 'reverts', 'returned'],
  // Safar month shares its spelling with the Arabic word for zero and for travel:
  // an engine naming either reads the word itself
  ['safar', 'zero', 'travel', 'journey', 'trip', 'tour'],
  // Muharram is the Arabic word for the sacred month - the engine names the word's own sense
  ['muharram', 'sacred', 'forbidden'],
  ['wrong', 'error', 'mistake', 'problem'],
  // agpabaro, the Philippine family's refresh word, renders as renew and renewal
  ['refresh', 'reload', 'load', 'renew', 'renewal'],
  ['setting', 'settings', 'arrangement', 'arrangements', 'adjustments'],
  ['hold', 'keep', 'retain'],
  ['turn', 'move', 'rotate'],
  ['done', 'completed', 'complete', 'finished', 'ready'],
  ['default', 'original', 'initial'],
  // later~then~afterwards: the postponing adverb's own senses, the update button's word
  ['later', 'then', 'afterwards'],
  // Bambara ɲɛfɛ renders as ahead - before's own directional sense
  ['before', 'ahead'],
  // Owner order twelve: Qibla is transliterated in every language; the local spellings
  // name the same Arabic word the way even English does
  ['qibla', 'kibla', 'kiblat', 'kible', 'qible', 'qiblah', 'kıble'],
];

/** Phrase-level pairs the token matcher cannot see, compared on stopword-filtered text */
const PHRASE_SYNONYMS = [
  ['up to date', 'latest version', 'most recent version', 'no new updates', 'no new update'],
  // every member is the dismay exclamation in its own register, Alamak's class
  ['oh no', 'excuse me', 'unfortunately', 'sorry', 'ouch', 'damn', 'wow', 'hey'],
  // old alone carries the stale sense on an out-of-date row; the up-to-date group never crosses
  ['out of date', 'outdated', 'not updated', 'no updates', 'expired', 'old', 'obsolete'],
  ['rabiʻ ii', 'spring of the other'],
  // the hijri month's established local spellings name the month itself (the engine renders Zulhijjah)
  ['dhuʻl hijjah', 'zulhijjah', 'zilhijja', 'zulhajjah', 'zilhaj'],
  // whole-sense event phrases: the rising of the sun IS sunrise, the night's middle IS midnight
  ['sunrise', 'rising of the sun'],
  ['midnight', 'middle of the night'],
  // and Qiʻdah's own local spellings (the engine renders Zulkida)
  ['dhuʻl qiʻdah', 'zulkida', 'zulqida', 'zul qaeda', 'zilkad'],
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

/** A non-stopword token that prefixes a longer one: app/application, or a short pair like Mon/M and Jun/June.
 * Owner order eleven: sun never abbreviates sunrise - it names the star and the day,
 * so that one prefix pair is a fragment and fails */
const NO_PREFIX_PAIRS = new Set(['sun>sunrise']);
const prefixMatch = (shorter, longer) => {
  if (shorter.length >= longer.length || STOPWORDS.has(shorter)) return false;
  if (!longer.startsWith(shorter)) return false;
  if (NO_PREFIX_PAIRS.has(`${shorter}>${longer}`)) return false;
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

/** The phrase group a token run lands in, tolerating one stray edge word */
const phraseGroupOf = (tokens) => {
  const direct = PHRASE_INDEX.get(tokens.join(' '));
  if (direct !== undefined) return direct;
  const withoutFirst = PHRASE_INDEX.get(tokens.slice(1).join(' '));
  if (withoutFirst !== undefined) return withoutFirst;
  return PHRASE_INDEX.get(tokens.slice(0, -1).join(' '));
};

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
  const phraseA = phraseGroupOf(tokensA);
  const phraseB = phraseGroupOf(tokensB);
  if (phraseA !== undefined && phraseA === phraseB) return true;
  const [shorter, longer] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const matched = shorter.filter((token) => longer.some((other) => tokenMatch(token, other))).length;
  return matched / shorter.length >= 0.5;
};

/**
 * The row verdict (owner order eight): phase ONE is Google alone - green when gtx's
 * round-trip carries the meaning, red when it does not, amber where gtx did not
 * render (a judge fill or a doubt is always amber: no independent machine vouched
 * for the row). Phase TWO is the both-engines semantics - green when both slots
 * rendered and both carry the meaning, red when both rendered and neither carries
 * it, amber on a missing slot or divergence. Phase two's second site is not chosen
 * yet; its slot stays pending.
 */
const verdictOf = (en, sites, llm = null, doubt = null, phase = 'one') => {
  if (doubt) return 'amber';
  if (llm) return 'amber';
  if (phase === 'two') {
    const present = sites.filter((site) => site.roundtrip !== null && site.roundtrip !== '');
    if (present.length < sites.length) return 'amber';
    const carried = present.filter((site) => carriesMeaning(en, site.roundtrip));
    if (carried.length === present.length) return 'green';
    if (carried.length === 0) return 'red';
    return 'amber';
  }
  const google = sites[0];
  if (google === undefined || google.roundtrip === null || google.roundtrip === '') return 'amber';
  return carriesMeaning(en, google.roundtrip) ? 'green' : 'red';
};

// --------------------------------------------------------------------------------------
// The engines
// --------------------------------------------------------------------------------------

const engineLocale = (locale) => LOCALE_ALIASES[locale] ?? locale;

const gtxUrl = (locale, text) =>
  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${engineLocale(locale)}&tl=en&dt=t&q=${encodeURIComponent(text)}`;

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

const ENGINES = {
  gtx: { url: gtxUrl, extract: extractGtx },
};

/** The Google human page - the owner's spot-check link */
const spotCheckUrl = (locale, text) =>
  `https://translate.google.com/?sl=${engineLocale(locale)}&tl=en&text=${encodeURIComponent(text)}&op=translate`;

/** One engine call with retry and backoff: the extracted text, or null when the budget is spent.
 * Under a pace, every attempt - retries included - waits its gap first (owner order: a
 * closed quota must never be hammered with quick retries; one request per gap). */
const fetchWithRetry = async (engineName, locale, text, deps, attempts = 3) => {
  const engine = ENGINES[engineName];
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (deps.pace) await deps.sleep(deps.pace);
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
  sites: ROW_SLOTS.map((engineName) => ({ engine: engineName, roundtrip: null })),
  url: spotCheckUrl(locale, catalog[key]),
  verdict: 'amber',
});

/**
 * A resumed row's text for one slot, migrating the old single-round-trip shape.
 * A slot adopts prior text only when the prior row's engine still owns the slot -
 * historical MyMemory data never seeds the pending phase-two slot.
 */
const slotTextOf = (prior, slotIndex) => {
  if (!prior) return null;
  const engineName = ROW_SLOTS[slotIndex];
  if (Array.isArray(prior.sites)) {
    const site = prior.sites[slotIndex];
    return site?.engine === engineName ? (site.roundtrip ?? null) : null;
  }
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
  const deps = { fetch, sleep, pace: opts.pace };
  // Rows come from the English key set; a locale missing a key yields fewer rows,
  // and the shortfall fails the run against the English count
  const keys = orderedKeys(en).filter((key) => catalog[key] !== undefined);
  const probeText = catalog[PRAYER_KEYS[0]] ?? en[PRAYER_KEYS[0]];
  const live = opts.liveEngines ?? (await preFlight(SITE_ENGINES, locale, probeText, deps));

  // A paced run is serial by definition: the pool narrows to one worker so the
  // per-attempt gap in fetchWithRetry is the only request rhythm
  const rows = await mapPool(keys, opts.pace ? 1 : (opts.concurrency ?? 4), async (key) => {
    const prior = resumeRows?.get(key);
    // A resumed row is reusable only while its catalog string still matches
    const priorFresh = prior && prior.catalog === catalog[key] ? prior : null;
    const row = buildRow(locale, key, en, catalog);
    for (let slotIndex = 0; slotIndex < ROW_SLOTS.length; slotIndex++) {
      const resumedText = slotTextOf(priorFresh, slotIndex);
      if (resumedText !== null && resumedText !== '') {
        row.sites[slotIndex].roundtrip = resumedText;
        continue;
      }
      const engineName = ROW_SLOTS[slotIndex];
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
    row.verdict = verdictOf(row.en, row.sites, row.llm ?? null, row.llm?.doubt ?? null, opts.phase ?? 'one');
    // A standing judge ruling survives the resume while the engine still reads the row red;
    // an engine rendering that now carries the meaning stands on its own and drops the ruling
    if (priorFresh?.ruling && row.verdict === 'red') {
      row.ruling = priorFresh.ruling;
      row.verdict = 'green';
    }
    return row;
  });

  const counts = { green: 0, red: 0, amber: 0 };
  const engineMix = { gtx: 0, miss: 0, pending: 0 };
  const misses = [];
  for (const row of rows) {
    counts[row.verdict] += 1;
    for (const site of row.sites) {
      if (site.roundtrip !== null) engineMix[site.engine] += 1;
      // The pending phase-two slot is structural, not a failure
      else if (site.engine === 'pending') engineMix.pending += 1;
      else engineMix.miss += 1;
    }
    if (row.llm) engineMix.llm = (engineMix.llm ?? 0) + 1;
    const missing = row.sites
      .filter((site) => site.roundtrip === null && site.engine !== 'pending')
      .map((site) => site.engine);
    if (missing.length > 0 && !row.llm) misses.push({ locale, key: row.key, missing });
  }

  const label = opts.label ?? locale;
  const phase = opts.phase ?? 'one';
  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, `${locale}.html`);
  const jsonPath = join(outDir, `${locale}.json`);
  writeFileSync(htmlPath, renderLocaleHtml(locale, label, rows, phase, opts.rtl ?? loadRtlIds()));
  writeFileSync(
    jsonPath,
    `${JSON.stringify(buildLocaleJson(locale, label, rows, now().toISOString(), phase), null, 2)}\n`
  );

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

const renderRow = (locale, row, rtl) => {
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
              ? site.engine === 'pending'
                ? '        <td class="pending"></td>'
                : '        <td><span class="pill miss">miss</span></td>'
              : `        <td dir="ltr" lang="en">${escapeHtml(site.roundtrip)}</td>`
          )
          .join('\n');
  return [
    `      <tr class="${verdictClass[row.verdict]}">`,
    `        <td class="key">${escapeHtml(row.key)}</td>`,
    `        <td dir="ltr" lang="en">${escapeHtml(row.en)}</td>`,
    `        <td dir="${dirFor(locale, rtl)}" lang="${escapeHtml(locale)}">${escapeHtml(row.catalog)}</td>`,
    roundtripCells,
    `        <td><span class="v">${escapeHtml(row.verdict)}</span>${row.ruling ? `<br><span class="chip j" title="${escapeHtml(row.ruling)}">judge: ${escapeHtml(row.ruling)}</span>` : ''}</td>`,
    `        <td><a href="${escapeHtml(row.url)}">Google</a></td>`,
    '      </tr>',
  ].join('\n');
};

const renderSection = (locale, rows, section, title, rtl) => {
  const sectionRows = rows.filter((row) => sectionOf(row.key) === section);
  const counts = { green: 0, red: 0, amber: 0 };
  for (const row of sectionRows) counts[row.verdict] += 1;
  return [
    `    <section class="card" id="section-${section}">`,
    `      <h2>${escapeHtml(title)} - ${sectionRows.length} rows</h2>`,
    `      <div class="chips"><span class="chip g">${counts.green} green</span><span class="chip r">${counts.red} red</span><span class="chip a">${counts.amber} amber</span></div>`,
    '      <table>',
    '        <thead>',
    '          <tr><th>key</th><th>our English</th><th>our language string</th><th>Google round-trip</th><th>round-trip 2 (phase two)</th><th>verdict</th><th>check</th></tr>',
    '        </thead>',
    '        <tbody>',
    ...sectionRows.map((row) => renderRow(locale, row, rtl)),
    '        </tbody>',
    '      </table>',
    '    </section>',
  ].join('\n');
};

/** The locale's comparison page: a language string never appears without its English and its round-trips */
const renderLocaleHtml = (locale, label, rows, phase = 'one', rtl = loadRtlIds()) => {
  const counts = { green: 0, red: 0, amber: 0 };
  const mix = {};
  let filled = 0;
  for (const row of rows) {
    counts[row.verdict] += 1;
    if (row.llm) filled += 1;
    for (const site of row.sites) {
      const bucket = site.roundtrip !== null ? site.engine : site.engine === 'pending' ? 'pending' : 'miss';
      mix[bucket] = (mix[bucket] ?? 0) + 1;
    }
  }
  const mixLine = Object.entries(mix)
    .map(([engine, count]) => `${engine}: ${count}`)
    .join(', ');
  const phaseLine =
    phase === 'two'
      ? "Google's round-trip and the second site's side by side - green only when both carry the meaning."
      : "Google's round-trip per row in phase one; the second site's column joins in phase two.";
  return [
    PAGE_SHELL_OPEN(`Athan translation verification - ${label}`),
    '  <a class="back" href="index.html">&larr; all languages</a>',
    '  <header class="card">',
    `    <h1>${escapeHtml(label)}</h1>`,
    `    <p class="muted">${rows.length} rows - ${phaseLine} Green: the meaning survives. Red: it does not - follow the red. Amber: the engine did not render, or the judge doubted the row${filled > 0 ? ` (${filled} rows carry the judge's llm rendering)` : ''}.</p>`,
    `    <div class="chips"><span class="chip g">${counts.green} green</span><span class="chip r">${counts.red} red</span><span class="chip a">${counts.amber} amber</span><span class="chip n">${escapeHtml(mixLine)}</span></div>`,
    '  </header>',
    renderSection(locale, rows, 1, 'Section 1 - the eleven prayer.* names', rtl),
    renderSection(locale, rows, 2, 'Section 2 - the five extras.explanation.* strings', rtl),
    renderSection(locale, rows, 3, 'Section 3 - the remaining keys in the owner category order', rtl),
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

const buildLocaleJson = (locale, label, rows, generatedAt, phase = 'one') => ({
  locale,
  languageName: label,
  phase,
  generatedAt,
  rowCount: rows.length,
  counts: rows.reduce(
    (counts, row) => {
      counts[row.verdict] += 1;
      return counts;
    },
    { green: 0, red: 0, amber: 0 }
  ),
  judgeRuled: rows.filter((row) => row.ruling !== undefined).length,
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
    '    <p class="muted">Every catalog against the English source, one independent round-trip per row in phase one: Google alone. Open a language and follow the red; amber rows wait on a re-run or the judge. The second site joins in phase two.</p>',
    '    <div class="legend">',
    '      <span><span class="dot" style="background:var(--green)"></span>green - the round-trip carries the meaning</span>',
    '      <span><span class="dot" style="background:var(--red)"></span>red - the round-trip loses it, check the string</span>',
    '      <span><span class="dot" style="background:var(--amber)"></span>amber - not rendered, or a doubted row</span>',
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
    `i18n verify: ${message}; usage: node scripts/i18n-verify.js --locales ar,so [--out DIR] [--resume] [--phase one|two] [--pace ms] | --waves | --all | --fill ar,so [--out DIR]`
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

/** The index always reads every artifact on disk, so a one-locale run erases nobody's card.
 * A json file that is not a locale artifact (research side data, anything stray) is
 * skipped by shape, not by name - the out dir is the owner's to read from. */
const writeIndexFromDisk = (outDir, names) => {
  const summaries = [];
  for (const file of readdirSync(outDir)) {
    if (!file.endsWith('.json') || file.endsWith('.llm-fill.json') || file.endsWith('.judge-rulings.json')) continue;
    const data = JSON.parse(readFileSync(join(outDir, file), 'utf8'));
    if (!Array.isArray(data.rows) || typeof data.locale !== 'string') continue;
    summaries.push(summaryOfArtifact(data, names));
  }
  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, renderIndexHtml(summaries));
  return indexPath;
};

/**
 * The judge fill: the LLM pass renders round-trips for rows both engines refused and
 * writes <locale>.llm-fill.json; this merge carries them into llm-marked rows (never a
 * site's rendering), keeps an optional doubt note as amber, and refreshes the
 * artifacts. The generator itself never invents a round-trip.
 */
const fillLocales = async (locales, { outDir, log, now, names, rtl = loadRtlIds() }) => {
  const written = [];
  const fillErrors = [];
  const remainingGaps = [];

  for (const locale of locales) {
    const artifact = JSON.parse(readFileSync(join(outDir, `${locale}.json`), 'utf8'));
    const fills = JSON.parse(readFileSync(join(outDir, `${locale}.llm-fill.json`), 'utf8'));
    const rows = artifact.rows;
    const rowByKey = new Map(rows.map((row) => [row.key, row]));
    const fillByKey = new Map();
    for (const fill of fills) {
      if (fillByKey.has(fill.key)) fillErrors.push(`${locale}/${fill.key} is filled twice`);
      if (!rowByKey.has(fill.key)) fillErrors.push(`${locale}/${fill.key} is not a row in the artifact`);
      fillByKey.set(fill.key, fill);
    }
    if (fillErrors.some((message) => message.startsWith(`${locale}/`))) {
      log(
        `${locale}: fill refused, artifacts untouched (${fillErrors.filter((m) => m.startsWith(`${locale}/`)).length} errors)`
      );
      continue;
    }

    let filled = 0;
    let superseded = 0;
    let doubted = 0;
    const phase = artifact.phase ?? 'one';
    for (const row of rows) {
      const bothMiss = (row.sites ?? []).every((site) => site.roundtrip === null);
      const engineRendered = (row.sites ?? []).some((site) => site.roundtrip !== null);
      if (engineRendered && row.llm !== undefined) {
        // The engine recovered this row after an earlier judge fill - its rendering supersedes
        delete row.llm;
        row.verdict = verdictOf(row.en, row.sites ?? [], undefined, null, phase);
      }
      const fill = fillByKey.get(row.key);
      if (fill !== undefined && !bothMiss) {
        // The engine rendered this row - its rendering supersedes any fill
        superseded += 1;
        continue;
      }
      if (fill === undefined) {
        if (bothMiss && row.llm === undefined) remainingGaps.push({ locale, key: row.key });
        continue;
      }
      filled += 1;
      if (fill.doubt) doubted += 1;
      row.llm = { roundtrip: fill.roundtrip, ...(fill.doubt ? { doubt: fill.doubt } : {}) };
      row.verdict = verdictOf(row.en, row.sites ?? [], row.llm, row.llm.doubt ?? null, phase);
    }
    const label = artifact.languageName ?? languageLabel(locale, names);
    writeFileSync(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(buildLocaleJson(locale, label, rows, now().toISOString(), phase), null, 2)}\n`
    );
    writeFileSync(join(outDir, `${locale}.html`), renderLocaleHtml(locale, label, rows, phase, rtl));
    written.push(join(outDir, `${locale}.json`), join(outDir, `${locale}.html`));
    log(`${locale}: filled ${filled} rows as engine:llm (${doubted} doubted, ${superseded} superseded by an engine)`);
  }

  const indexPath = writeIndexFromDisk(outDir, names);
  written.push(indexPath);

  if (remainingGaps.length > 0) {
    const head = remainingGaps
      .slice(0, 40)
      .map((gap) => `${gap.locale}/${gap.key}`)
      .join(', ');
    log(
      `engine slot gaps still dark without a judge fill: ${remainingGaps.length} rows - ${head}${remainingGaps.length > 40 ? ' ...' : ''}`
    );
  }

  return {
    ok: fillErrors.length === 0 && remainingGaps.length === 0,
    locales,
    written,
    shortfalls: [],
    misses: remainingGaps,
    remainingGaps,
    fillErrors,
  };
};

/**
 * The judge ruling: phase one's fluent judge reads a red row whose catalog string is
 * verified correct despite the engine's rendering (the country sense of المغرب, a
 * homograph the engine misread) and rules the row green with a mandatory note. The
 * ruling is always visible - chip, note and count - and never applies to a row the
 * engine did not read red: those are the fill's business.
 */
const ruleLocales = async (locales, { outDir, log, now, names, rtl = loadRtlIds() }) => {
  const written = [];
  const rulingErrors = [];

  for (const locale of locales) {
    const artifact = JSON.parse(readFileSync(join(outDir, `${locale}.json`), 'utf8'));
    const rulings = JSON.parse(readFileSync(join(outDir, `${locale}.judge-rulings.json`), 'utf8'));
    const rows = artifact.rows;
    const rowByKey = new Map(rows.map((row) => [row.key, row]));
    const rulingByKey = new Map();
    for (const ruling of rulings) {
      if (rulingByKey.has(ruling.key)) rulingErrors.push(`${locale}/${ruling.key} is ruled twice`);
      if (!rowByKey.has(ruling.key)) rulingErrors.push(`${locale}/${ruling.key} is not a row in the artifact`);
      if (typeof ruling.note !== 'string' || ruling.note.trim() === '') {
        rulingErrors.push(`${locale}/${ruling.key} carries no note`);
      }
      if (
        rowByKey.has(ruling.key) &&
        rowByKey.get(ruling.key).verdict !== 'red' &&
        rowByKey.get(ruling.key).ruling !== ruling.note
      ) {
        rulingErrors.push(`${locale}/${ruling.key} is not a red row`);
      }
      rulingByKey.set(ruling.key, ruling);
    }
    if (rulingErrors.some((message) => message.startsWith(`${locale}/`))) {
      log(
        `${locale}: ruling refused, artifacts untouched (${rulingErrors.filter((m) => m.startsWith(`${locale}/`)).length} errors)`
      );
      continue;
    }

    let applied = 0;
    for (const row of rows) {
      const ruling = rulingByKey.get(row.key);
      if (ruling === undefined) continue;
      row.ruling = ruling.note;
      row.verdict = 'green';
      applied += 1;
    }
    if (applied === 0 && rulingByKey.size > 0) {
      log(`${locale}: ruling refused, no red row matched`);
      continue;
    }
    const label = artifact.languageName ?? languageLabel(locale, names);
    const phase = artifact.phase ?? 'one';
    writeFileSync(
      join(outDir, `${locale}.json`),
      `${JSON.stringify(buildLocaleJson(locale, label, rows, now().toISOString(), phase), null, 2)}\n`
    );
    writeFileSync(join(outDir, `${locale}.html`), renderLocaleHtml(locale, label, rows, phase, rtl));
    written.push(join(outDir, `${locale}.json`), join(outDir, `${locale}.html`));
    log(`${locale}: ${applied} ruling${applied === 1 ? '' : 's'} applied`);
  }

  const indexPath = writeIndexFromDisk(outDir, names);
  written.push(indexPath);

  return {
    ok: rulingErrors.length === 0,
    locales,
    written,
    shortfalls: [],
    misses: [],
    rulingErrors,
  };
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
  const ruleFlag = flag('--rule');
  const phaseFlag = flag('--phase');
  const paceFlag = flag('--pace');
  const waves = argv.includes('--waves');
  const all = argv.includes('--all');
  const resume = argv.includes('--resume');
  if (!waves && !all && localesFlag === undefined && fillFlag === undefined && ruleFlag === undefined) {
    throw usageError('no locales named');
  }
  if (phaseFlag !== undefined && phaseFlag !== 'one' && phaseFlag !== 'two') {
    throw usageError(`--phase must be one or two, got ${phaseFlag}`);
  }
  const pace = paceFlag === undefined ? 0 : Number(paceFlag);
  if (!Number.isInteger(pace) || pace < 0) {
    throw usageError(`--pace must be a whole number of milliseconds, got ${paceFlag}`);
  }
  const phase = phaseFlag ?? 'one';
  const names = loadLanguageNames(deps);
  const rtl = loadRtlIds(deps);
  const allLocales = ['en', ...names.map((entry) => entry.id).filter((id) => id !== 'en')];
  const locales =
    fillFlag || ruleFlag
      ? (fillFlag ?? ruleFlag)
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
    return fillLocales(locales, { outDir, log, now: deps.now ?? (() => new Date()), names, rtl });
  }
  if (ruleFlag !== undefined) {
    return ruleLocales(locales, { outDir, log, now: deps.now ?? (() => new Date()), names, rtl });
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
      phase,
      rtl,
      ...(pace > 0 ? { pace } : {}),
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

  const indexPath = writeIndexFromDisk(outDir, names);
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
  SECTION3_RANKS,
  parseCatalogSource,
  parseLanguageNames,
  loadLanguageNames,
  parseRtlIds,
  loadRtlIds,
  displayName,
  languageLabel,
  orderedKeys,
  escapeHtml,
  dirFor,
  spotCheckUrl,
  gtxUrl,
  extractGtx,
  fetchWithRetry,
  preFlight,
  levenshtein,
  carriesMeaning,
  verdictOf,
  slotAccepts,
  runLocale,
  renderLocaleHtml,
  renderReferenceHtml,
  buildLocaleJson,
  renderIndexHtml,
  fillLocales,
  ruleLocales,
  defaultOutDir,
  run,
};
