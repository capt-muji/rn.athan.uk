// The T-575 verification generator's own gates: the catalog and language-name parse
// rules, the 11-5-191 row order with the category rank table, HTML escaping, the
// loanword slot rule, the single-engine pre-flight (MyMemory is out, owner order
// six), the meaning heuristic behind the verdict colors, the two-slot row shape
// with slot two pending phase two, resume and the judge fill. Every network call
// goes through an injected fetch returning fixtures: no test touches a real
// engine, and no test reads the real clock.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const verify = require('../i18n-verify.js') as {
  SITE_ENGINES: string[];
  PILOT_WAVE: string[];
  SECTION3_RANKS: string[];
  parseCatalogSource(source: string, file: string): Catalog;
  parseLanguageNames(source: string, file: string): LanguageName[];
  displayName(english: string): string;
  languageLabel(id: string, names: LanguageName[]): string;
  loadLanguageNames(deps?: { readNamesSource?: () => string }): LanguageName[];
  parseRtlIds(source: string, file: string): Set<string>;
  loadRtlIds(deps?: { readLocaleSource?: () => string }): Set<string>;
  orderedKeys(en: Catalog): string[];
  escapeHtml(value: string): string;
  dirFor(locale: string, rtl: Set<string>): string;
  spotCheckUrl(locale: string, text: string): string;
  gtxUrl(locale: string, text: string): string;
  extractGtx(body: string): string | null;
  fetchWithRetry(
    engine: string,
    locale: string,
    text: string,
    deps: { fetch: FetchFn; sleep: (ms: number) => Promise<void> },
    attempts?: number
  ): Promise<string | null>;
  preFlight(
    engines: string[],
    locale: string,
    probe: string,
    deps: { fetch: FetchFn; sleep: (ms: number) => Promise<void> }
  ): Promise<string[]>;
  levenshtein(a: string, b: string): number;
  carriesMeaning(en: string, roundtrip: string): boolean;
  verdictOf(
    en: string,
    sites: Site[],
    llm?: { roundtrip: string; doubt?: string } | null,
    doubt?: string | null,
    phase?: string
  ): string;
  slotAccepts(catalog: string, english: string, roundtrip: string | null): boolean;
  runLocale(locale: string, opts: LocaleOpts): Promise<LocaleResult>;
  renderLocaleHtml(locale: string, label: string, rows: Row[]): string;
  renderReferenceHtml(label: string, rows: Array<{ key: string; en: string }>): string;
  buildLocaleJson(locale: string, label: string, rows: Row[], generatedAt: string): object;
  renderIndexHtml(
    summaries: Array<{
      locale: string;
      label: string;
      count: number;
      counts?: CountBag;
      engineMix?: Record<string, number>;
      file: string;
      reference?: boolean;
    }>
  ): string;
  fillLocales(
    locales: string[],
    opts: { outDir: string; log: (line: string) => void; now: () => Date; names: LanguageName[] }
  ): Promise<RunReport>;
  defaultOutDir(deps: { home?: string; homedir?: () => string }): string;
  run(argv: string[], deps?: Partial<Deps>): Promise<RunReport>;
};

type Catalog = Record<string, string>;
interface LanguageName {
  id: string;
  name: string;
  english: string;
}
interface FetchResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}
type FetchFn = (url: string) => Promise<FetchResponse>;
interface Site {
  engine: string;
  roundtrip: string | null;
}
interface Row {
  key: string;
  en: string;
  catalog: string;
  sites: Site[];
  llm?: { roundtrip: string; doubt?: string } | null;
  url: string;
  url2?: string;
  verdict: string;
}
interface CountBag {
  green: number;
  red: number;
  amber: number;
}
interface LocaleOpts {
  en: Catalog;
  catalog: Catalog;
  outDir: string;
  fetch: FetchFn;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  concurrency?: number;
  resumeRows?: Map<string, Row>;
  liveEngines?: string[];
  label?: string;
  rtl?: Set<string>;
  phase?: string;
  pace?: number;
}
interface LocaleResult {
  locale: string;
  count: number;
  rows: Row[];
  counts: CountBag;
  engineMix: Record<string, number>;
  misses: Array<{ locale: string; key: string; missing: string[] }>;
  files: string[];
}
interface RunReport {
  ok: boolean;
  locales: string[];
  written: string[];
  shortfalls: Array<{ locale: string; count: number }>;
  misses: Array<{ locale: string; key: string; missing: string[] }>;
  fillErrors: string[];
  rulingErrors?: string[];
}
interface Deps {
  fetch: FetchFn;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  log?: (line: string) => void;
  home?: string;
  homedir?: () => string;
  readCatalogFile?: (locale: string) => Promise<Catalog>;
  readNamesSource?: () => string;
}

const SCRATCH = mkdtempSync(join(tmpdir(), 'i18n-verify-test-'));
const CATALOG_PATH = join(__dirname, '..', '..', 'shared', 'i18n', 'en.ts');
const NAMES_PATH = join(__dirname, '..', '..', 'shared', 'languageNames.ts');

const res = (body: string, ok = true, status = 200): FetchResponse => ({ ok, status, text: async () => body });
const noSleep = async () => {};
const fixedNow = () => new Date('2026-11-02T12:00:00.000Z');

const realEn: Catalog = verify.parseCatalogSource(readFileSync(CATALOG_PATH, 'utf8'), 'en.ts');
const realNames: LanguageName[] = verify.parseLanguageNames(readFileSync(NAMES_PATH, 'utf8'), 'languageNames.ts');

afterAll(() => {
  rmSync(SCRATCH, { recursive: true, force: true });
});

describe('the not-PRAYER_LABELS catalog parse rule', () => {
  it('reads a locale module from a fixture file and skips the PRAYER_LABELS declarator', () => {
    const file = join(SCRATCH, 'zz.ts');
    writeFileSync(
      file,
      [
        "import type { Catalog } from './en';",
        'export const zz = {',
        "  'prayer.fajr': 'Namaz',",
        "  'settings.title': 'Sazlamalar',",
        '} as const satisfies Catalog;',
        'export const PRAYER_LABELS: Record<string, string> = { fajr: zz["prayer.fajr"] };',
        '',
      ].join('\n')
    );
    expect(verify.parseCatalogSource(readFileSync(file, 'utf8'), 'zz.ts')).toEqual({
      'prayer.fajr': 'Namaz',
      'settings.title': 'Sazlamalar',
    });
  });

  it('reads a zhHans-style declarator name - the rule is name-independent', () => {
    const source = "export const zhHans = { 'prayer.fajr': '晨礼' } as const satisfies Catalog;";
    expect(verify.parseCatalogSource(source, 'zh-Hans.ts')).toEqual({ 'prayer.fajr': '晨礼' });
  });

  it('refuses a module whose only object export is PRAYER_LABELS', () => {
    const source = "export const PRAYER_LABELS: Record<string, string> = { fajr: 'Fajr' };";
    expect(() => verify.parseCatalogSource(source, 'empty.ts')).toThrow('empty.ts');
  });
});

describe('the language-name table (order three: names beside codes everywhere)', () => {
  it('parses the real shared/languageNames.ts into the full 75: 74 locales plus English', () => {
    expect(realNames).toHaveLength(75);
    const ids = realNames.map((entry) => entry.id);
    expect(ids).toContain('en');
    expect(ids).toContain('so');
    expect(ids).toContain('zh-Hans');
    // Every named locale has its catalog file on disk
    for (const entry of realNames) {
      expect(existsSync(join(__dirname, '..', '..', 'shared', 'i18n', `${entry.id}.ts`))).toBe(true);
    }
  });

  it('builds the owner-ruled labels: so - Somali, min - Minangkabau, en - English', () => {
    expect(verify.languageLabel('so', realNames)).toBe('so - Somali');
    expect(verify.languageLabel('min', realNames)).toBe('min - Minangkabau');
    expect(verify.languageLabel('en', realNames)).toBe('en - English');
    expect(verify.languageLabel('zh-Hans', realNames)).toBe('zh-Hans - Chinese');
    expect(verify.languageLabel('ckb', realNames)).toBe('ckb - Kurdish');
  });

  it('strips the parenthetical gloss the way the owner wrote the labels', () => {
    expect(verify.displayName('Minangkabau (Minang)')).toBe('Minangkabau');
    expect(verify.displayName('Somali')).toBe('Somali');
    expect(verify.displayName('Chinese (Simplified)')).toBe('Chinese');
  });

  it('refuses a module without the LANGUAGE_NAMES array', () => {
    expect(() => verify.parseLanguageNames('export const other = 1;', 'x.ts')).toThrow('x.ts');
  });
});

describe('the 11-5-191 row order', () => {
  const keys = verify.orderedKeys(realEn);

  it('splits the real English catalog into the three sections with the exact counts', () => {
    expect(Object.keys(realEn)).toHaveLength(207);
    expect(keys).toHaveLength(207);
    expect(keys.slice(0, 11).every((k) => k.startsWith('prayer.'))).toBe(true);
    expect(keys.slice(11, 16).every((k) => k.startsWith('extras.explanation.'))).toBe(true);
    expect(keys.slice(16)).toHaveLength(191);
  });

  it('orders section 3 by the prefix rank table with unranked prefixes after in catalog order', () => {
    const prefixes: string[] = [];
    for (const key of keys.slice(16)) {
      const prefix = key.split('.')[0];
      if (!prefixes.includes(prefix)) prefixes.push(prefix);
    }
    expect(prefixes.slice(0, 18)).toEqual(verify.SECTION3_RANKS);
  });
});

describe('HTML escaping, direction and the spot-check link', () => {
  it('escapes script tags and quotes, and leaves RTL punctuation untouched', () => {
    expect(verify.escapeHtml(`<script>alert("x")</script> '؟ «hi»'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &apos;؟ «hi»&apos;'
    );
  });

  it('answers rtl for the Arabic-script locales and ltr elsewhere, off the parsed locale.ts set', () => {
    const rtl = verify.loadRtlIds();
    expect(verify.dirFor('ar', rtl)).toBe('rtl');
    expect(verify.dirFor('skr', rtl)).toBe('rtl');
    expect(verify.dirFor('so', rtl)).toBe('ltr');
  });

  it('builds the Google spot-check link - the only site link (owner order six: MyMemory is out)', () => {
    expect(verify.spotCheckUrl('ms', 'saat lama')).toBe(
      'https://translate.google.com/?sl=ms&tl=en&text=saat%20lama&op=translate'
    );
  });
});

describe('the loanword slot rule', () => {
  it('accepts an unchanged echo only where the catalog string equals the English source', () => {
    expect(verify.slotAccepts('Fajr', 'Fajr', 'Fajr')).toBe(true);
    expect(verify.slotAccepts('الفجر', 'Fajr', 'الفجر')).toBe(false);
    expect(verify.slotAccepts('الفجر', 'Fajr', 'The dawn')).toBe(true);
    expect(verify.slotAccepts('الفجر', 'Fajr', '')).toBe(false);
    expect(verify.slotAccepts('الفجر', 'Fajr', null)).toBe(false);
  });
});

describe('the engine behind an injected fetch (Google alone, owner order six)', () => {
  it('builds the engine request URL with the locale and the encoded text, aliasing zh-Hans and Javanese', () => {
    expect(verify.gtxUrl('ar', 'hello world')).toBe(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=hello%20world'
    );
    expect(verify.gtxUrl('zh-Hans', '你好')).toBe(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=%E4%BD%A0%E5%A5%BD'
    );
    // Google serves Javanese under its old code jw
    expect(verify.gtxUrl('jv', 'subuh')).toContain('sl=jw&');
  });

  it('extracts the engine body shape', () => {
    expect(verify.extractGtx(JSON.stringify([[['The dawn', 'الفجر', null, null]], null, 'ar']))).toBe('The dawn');
    expect(verify.extractGtx('[]')).toBeNull();
    expect(verify.extractGtx('not json')).toBeNull();
  });

  it('pre-flights exactly one request - the single engine in the chain', async () => {
    const calls: string[] = [];
    const fetchFn = async (url: string) => {
      calls.push(url);
      return res(JSON.stringify([[[`en: ${url.length}`, 'x', null, null]]]));
    };
    const live = await verify.preFlight(verify.SITE_ENGINES, 'ar', 'الفجر', { fetch: fetchFn, sleep: noSleep });
    expect(live).toEqual(['gtx']);
    expect(calls).toHaveLength(1);
  });

  it('retries with backoff and gives up after the budget', async () => {
    let attempt = 0;
    const sleeps: number[] = [];
    const out = await verify.fetchWithRetry('gtx', 'ar', 'x', {
      fetch: async () => {
        attempt += 1;
        return attempt === 1 ? res('throttled', false, 429) : res(JSON.stringify([[['ok', 'x', null, null]]]));
      },
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(out).toBe('ok');
    expect(sleeps).toEqual([400]);

    const dead = await verify.fetchWithRetry('gtx', 'ar', 'x', {
      fetch: async () => res('block page', false, 429),
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(dead).toBeNull();
    expect(sleeps.slice(1)).toEqual([400, 800]);
  });
});

describe('the meaning heuristic behind the verdict colors', () => {
  it('keeps the true catches red while the owner-named ambiguities carry', () => {
    expect(verify.carriesMeaning('Dhuhr', 'Back')).toBe(false);
    // The owner's order ten: Morocco is a country, never the prayer - the round-trip
    // that names it does not verify Magrib, in any language
    expect(verify.carriesMeaning('Magrib', 'MOROCCO')).toBe(false);
    // al-isha is the Arabic word for supper - the name derives from the meal
    expect(verify.carriesMeaning('Isha', 'Dinner')).toBe(true);
  });

  it('carries the meaning through stopwords, synonyms and cognates', () => {
    // Stopwords: the transliteration article never blocks a match
    expect(verify.carriesMeaning('Fajr', 'Al Fajr')).toBe(true);
    // Exact and case-insensitive
    expect(verify.carriesMeaning('Sunrise', 'sunrise')).toBe(true);
    // The prayer glosses: the UI vocabulary's synonym map
    expect(verify.carriesMeaning('Fajr', 'The dawn')).toBe(true);
    expect(verify.carriesMeaning('Dhuhr', 'noon')).toBe(true);
    expect(verify.carriesMeaning('Magrib', 'Sunset prayer')).toBe(true);
    expect(verify.carriesMeaning('Asr', 'The afternoon prayer')).toBe(true);
    // The saat worked example: moment renders seconds in the timer context
    expect(verify.carriesMeaning('seconds', 'a moment')).toBe(true);
    // Cognates: 4-char prefixes or edit distance <= 2 on tokens >= 5 chars
    expect(verify.carriesMeaning('Notifications', 'notification')).toBe(true);
    expect(verify.carriesMeaning('Settings', 'setting')).toBe(true);
    expect(verify.carriesMeaning('Athan', 'adhan')).toBe(true);
    expect(verify.carriesMeaning('App', 'application')).toBe(true);
  });

  it('scores stopword-filtered overlap over the shorter set at threshold 0.5', () => {
    // 1 of the English's 2 tokens matches: 0.5 exactly, inclusive
    expect(verify.carriesMeaning('Set your preferences', 'Adjust your preferences')).toBe(true);
    // 0 of 1: red
    expect(verify.carriesMeaning('Sound', 'Volume slider')).toBe(false);
    // Extra round-trip words never fail a covered English
    expect(verify.carriesMeaning('Qibla', 'the direction of qibla towards mecca')).toBe(true);
  });

  it('falls back to raw tokens when stopword filtering would empty a side', () => {
    expect(verify.carriesMeaning('On', 'on')).toBe(true);
    expect(verify.carriesMeaning('Why?', 'for what reason')).toBe(true);
    expect(verify.carriesMeaning('Do not disturb', 'do not bother')).toBe(true);
  });

  it('matches group members through plural stemming, abbreviations and phrases', () => {
    // reminders and alerts both land in the notification group through the singular
    expect(verify.carriesMeaning('2 reminders', 'two alerts')).toBe(true);
    // N/A normalizes to a token the unavailable group holds
    expect(verify.carriesMeaning('unavailable', 'N/A')).toBe(true);
    // The phrase pairs the token matcher cannot see, with one stray edge word tolerated
    expect(verify.carriesMeaning("You're up to date", 'No new updates')).toBe(true);
    expect(verify.carriesMeaning("You're up to date", 'You are on the latest version')).toBe(true);
    // A short abbreviation round-trips a weekday or month it prefixes
    expect(verify.carriesMeaning('Mon', 'M')).toBe(true);
    expect(verify.carriesMeaning('Jun', 'June')).toBe(true);
    // The UI vocabulary pairs the pilot read demanded
    expect(verify.carriesMeaning('Display', 'appearance')).toBe(true);
    expect(verify.carriesMeaning('Close to save', 'Shut down in order to store')).toBe(true);
  });

  it('refuses empty and punctuation-only round-trips', () => {
    expect(verify.carriesMeaning('Fajr', '')).toBe(false);
    expect(verify.carriesMeaning('Fajr', '...')).toBe(false);
  });

  it('measures edit distance exactly', () => {
    expect(verify.levenshtein('athan', 'adhan')).toBe(1);
    expect(verify.levenshtein('suhoor', 'sahur')).toBe(3);
    expect(verify.levenshtein('same', 'same')).toBe(0);
  });
});

describe('the row verdict (owner order eight: phase one is Google alone, phase two needs both agreeing)', () => {
  const both = (a: string | null, b: string | null): Site[] => [
    { engine: 'gtx', roundtrip: a },
    { engine: 'secondsite', roundtrip: b },
  ];

  it('phase one (the default): green when gtx carries the meaning, red when it does not, amber where gtx did not render', () => {
    expect(verify.verdictOf('Fajr', both('Fajr', 'The dawn'))).toBe('green');
    expect(verify.verdictOf('Dhuhr', both('Back', 'the back'))).toBe('red');
    // Where gtx loses the meaning, the second slot cannot rescue a phase-one verdict
    expect(verify.verdictOf('Dhuhr', both('Back', 'noon'))).toBe('red');
    // gtx did not render: amber whether or not the judge filled, and a doubt is always amber
    expect(
      verify.verdictOf('Fajr', [
        { engine: 'gtx', roundtrip: null },
        { engine: 'secondsite', roundtrip: 'Fajr' },
      ])
    ).toBe('amber');
    expect(verify.verdictOf('Fajr', both(null, null), { roundtrip: 'Fajr' })).toBe('amber');
    expect(verify.verdictOf('Fajr', both('Fajr', 'The dawn'), null, 'judge doubted the rendering')).toBe('amber');
  });

  it('the Arabic loop lessons: engine renderings that carry the meaning read green', () => {
    // المغرب is also the Arabic name of Morocco - the engine names the word's own cognate
    expect(verify.verdictOf('Magrib', both('Morocco', 'x'))).toBe('red');
    // The engine read the Somali spelling Maqrib as the word's evening sense
    expect(verify.verdictOf('Magrib', both('In the evening', 'x'))).toBe('green');
    // العشاء is the Arabic word for supper - the name derives from the meal
    expect(verify.verdictOf('Isha', both('dinner', 'x'))).toBe('green');
    expect(verify.verdictOf('Done', both('It was completed', 'x'))).toBe('green');
    expect(verify.verdictOf('Out of date', both('Not updated', 'x'))).toBe('green');
    expect(verify.verdictOf('Out of date', both('No updates', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Sorry!', 'x'))).toBe('green');
    expect(verify.verdictOf('Rabiʻ II', both('Spring of the other', 'x'))).toBe('green');
    expect(verify.verdictOf('Safar', both('zero', 'x'))).toBe('green');
    expect(verify.verdictOf('Safar', both('Travel', 'x'))).toBe('green');
    expect(verify.verdictOf('Each prayer now has 2 reminders', both('Every prayer now has two warnings', 'x'))).toBe(
      'green'
    );
  });

  it('the Somali loop lessons: instruction verbs, the settings sense and the plural update phrase', () => {
    expect(verify.verdictOf('Settings', both('Arrangements', 'x'))).toBe('green');
    expect(verify.verdictOf('Hold flat and turn slowly', both('Keep it straight and move slowly', 'x'))).toBe('green');
    expect(verify.verdictOf('You’re up to date', both('There is no new update', 'x'))).toBe('green');
  });

  it('the Indonesian loop lessons: the device-off sense, the sacred month and the error verbs', () => {
    expect(verify.verdictOf('off', both('dead', 'x'))).toBe('green');
    expect(verify.verdictOf('Muharram', both('Sacred', 'x'))).toBe('green');
    expect(verify.verdictOf('Out of date', both('Expired', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Ouch!', 'x'))).toBe('green');
    expect(verify.verdictOf(' Something went wrong. ', both('There is an error.', 'x'))).toBe('green');
    expect(verify.verdictOf(' Refresh ', both('Reload', 'x'))).toBe('green');
    // Owner order eleven: the round-trip must land on sunrise itself - 'Rise' is a fragment
    expect(verify.verdictOf('Sunrise', both('Rise', 'x'))).toBe('red');
    expect(verify.verdictOf('Sunrise', both('Sunup', 'x'))).toBe('green');
    expect(verify.verdictOf('Sunrise', both('Shuruk', 'x'))).toBe('green');
    expect(verify.verdictOf('Asr', both('Asher', 'x'))).toBe('green');
    // 'Sun' names the day and the star, never the event - a fragment of sunrise (bug's fill audit)
    expect(verify.verdictOf('Sunrise', both('Sun', 'x'))).toBe('red');
  });

  it('the Malay loop lessons: the name variant, the postponing adverb, the dismay exclamation and the month spelling', () => {
    // Isak is the engine's romanization of Malay Isyak: it names the prayer itself, the Ashar/Asher class
    expect(verify.verdictOf('Isha', both('Isak', 'x'))).toBe('green');
    expect(verify.verdictOf('Later', both('Then', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Damn!', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zulhijjah', 'x'))).toBe('green');
  });

  it('the Minangkabau loop lessons: aid beside help, and mati rendered as its own verb', () => {
    expect(verify.verdictOf('Help', both('Aid', 'x'))).toBe('green');
    expect(verify.verdictOf('off', both('die', 'x'))).toBe('green');
  });

  it('the Somali ruling lessons: the athan word and the qibla word are transliterations', () => {
    // Owner order twelve: athan is transliterated in every language - Azaan names the word itself,
    // and Qibla's local spellings (Kiblat, Kıble...) name the same word
    expect(verify.verdictOf('Athan', both('Azaan', 'x'))).toBe('green');
    expect(verify.verdictOf('Qibla', both('Kiblat', 'x'))).toBe('green');
    expect(verify.verdictOf('Qibla', both('Kıble', 'x'))).toBe('green');
  });

  it('the Madurese loop lessons: the person-shifted update phrase, bisu as its own mute word, and the reset family', () => {
    expect(verify.verdictOf("You're up to date", both('They have the most recent version', 'x'))).toBe('green');
    expect(verify.verdictOf('silent', both('dumb', 'x'))).toBe('green');
    expect(verify.verdictOf('unavailable', both("can't", 'x'))).toBe('green');
    expect(verify.verdictOf('Reset to the default colour', both('Reverts to initial color', 'x'))).toBe('green');
    expect(verify.verdictOf('Reset', both('Returned', 'x'))).toBe('green');
    expect(verify.verdictOf('Display', both('Layout', 'x'))).toBe('green');
  });

  it('the Cebuano loop lessons: gipatay as its own off word, and wala as nothing', () => {
    expect(verify.verdictOf('Off', both('Killed', 'x'))).toBe('green');
    expect(verify.verdictOf('off', both('killed', 'x'))).toBe('green');
    expect(verify.verdictOf('unavailable', both('nothing', 'x'))).toBe('green');
  });

  it('the Ilocano loop lessons: dasal is the prayer word the engine leaves untranslated, and renewal is refresh', () => {
    expect(verify.carriesMeaning('This prayer', 'This dasal')).toBe(true);
    expect(verify.verdictOf(' Refresh ', both('Renewal', 'x'))).toBe('green');
    expect(verify.verdictOf('to refresh', both('to renew', 'x'))).toBe('green');
  });

  it('the Amharic loop lessons: the cancel and reminder senses, gone and improve, the stale old, and the Qiʻdah spelling', () => {
    expect(verify.verdictOf('Cancel', both('Delete', 'x'))).toBe('green');
    expect(verify.verdictOf('Reminder {n}', both('note {n}', 'x'))).toBe('green');
    expect(verify.verdictOf('Off', both("It's gone", 'x'))).toBe('green');
    expect(verify.verdictOf('Update', both('Improve', 'x'))).toBe('green');
    expect(verify.verdictOf('Out of date', both('old', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zulkida', 'x'))).toBe('green');
    // the opposite phrase never crosses: up-to-date reading old stays red
    expect(verify.verdictOf("You're up to date", both('old', 'x'))).toBe('red');
  });

  it('the Azerbaijani loop lessons: the name spellings, the UI senses and the exclamation', () => {
    expect(verify.verdictOf('Dhuhr', both('Zohr', 'x'))).toBe('green');
    expect(verify.verdictOf('Settings', both('Adjustments', 'x'))).toBe('green');
    expect(verify.verdictOf('Display', both('Screen', 'x'))).toBe('green');
    expect(verify.verdictOf('Off', both('Closed', 'x'))).toBe('green');
    expect(verify.verdictOf('Done', both('Ready', 'x'))).toBe('green');
    expect(verify.verdictOf('Safar', both('Trip', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zilhijja', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Wow!', 'x'))).toBe('green');
  });

  it('the Baluchi loop lessons: the Arabic-root senses, the script echo pairs and the month spellings', () => {
    expect(verify.verdictOf('Dhuhr', both('Lunch.', 'x'))).toBe('green');
    expect(verify.verdictOf('Asr', both('era;', 'x'))).toBe('green');
    expect(verify.verdictOf('Istijaba', both('Answer', 'x'))).toBe('green');
    expect(verify.verdictOf('Off', both('close', 'x'))).toBe('green');
    expect(verify.verdictOf('notification', both('information', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zul Qaeda', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zulhajjah', 'x'))).toBe('green');
  });

  it('the Bambara loop lessons: whole-sense phrases, reveal, and ahead', () => {
    expect(verify.verdictOf('Sunrise', both('the rising of the sun', 'x'))).toBe('green');
    expect(verify.verdictOf('Midnight', both('the middle of the night', 'x'))).toBe('green');
    expect(verify.verdictOf('Display', both('Reveal', 'x'))).toBe('green');
    expect(verify.verdictOf('Before', both('Ahead', 'x'))).toBe('green');
  });

  it('the Bengali loop lessons: the name renderings, namaz, and the month spellings', () => {
    expect(verify.verdictOf('Dhuhr', both('Zohar', 'x'))).toBe('green');
    expect(verify.verdictOf('Asr', both('Asar', 'x'))).toBe('green');
    expect(verify.verdictOf('Suhoor', both('sahri', 'x'))).toBe('green');
    expect(verify.verdictOf('Notification at prayer time', both('Notification during Namaz', 'x'))).toBe('green');
    expect(verify.verdictOf('Safar', both('tour', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zilkad', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zilhaj', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Hey!', 'x'))).toBe('green');
  });

  it('the Bosnian loop lessons: the traditional names and the obsolete stale', () => {
    expect(verify.verdictOf('Halfway between Magrib and Fajr', both('Midway between Aksham and Sabah', 'x'))).toBe(
      'green'
    );
    expect(verify.verdictOf('Out of date', both('Obsolete', 'x'))).toBe('green');
  });

  it('the Kurdish Sorani loop lessons: sahar and passive', () => {
    expect(verify.verdictOf('Suhoor', both('Sahar', 'x'))).toBe('green');
    expect(verify.verdictOf('Off', both('passive', 'x'))).toBe('green');
  });

  it('the German loop lessons: aus as its own off word', () => {
    expect(verify.verdictOf('Off', both('Out of', 'x'))).toBe('green');
    expect(verify.verdictOf('off', both('out of', 'x'))).toBe('green');
  });

  it('the Persian loop lessons: chasht names Duha, and the Qiʻdah spelling', () => {
    expect(verify.verdictOf('Duha', both('chasht prayer', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Dhil al-Qaida', 'x'))).toBe('green');
  });

  it('the Fulah loop lessons: indicate and showing, quiet, and past', () => {
    expect(verify.verdictOf('Show time passed', both('Indicate elapsed time', 'x'))).toBe('green');
    expect(verify.verdictOf('Display', both('Showing', 'x'))).toBe('green');
    expect(verify.verdictOf('Silent', both('Quiet', 'x'))).toBe('green');
    expect(verify.verdictOf('Out of date', both('Past', 'x'))).toBe('green');
  });

  it('the French loop lessons: Chourouq spells the sunrise name', () => {
    expect(verify.verdictOf('Sunrise', both('Shurouq', 'x'))).toBe('green');
  });

  it('the Gujarati loop lessons: the Qiʻdah spelling', () => {
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Dhul-Kida', 'x'))).toBe('green');
  });

  it('the Hausa loop lessons: indication, tongue, cover, renew, and the problem phrase', () => {
    expect(verify.verdictOf('Display', both('Indication', 'x'))).toBe('green');
    expect(verify.verdictOf('Language', both('Tongue', 'x'))).toBe('green');
    expect(verify.verdictOf('Close', both('Cover', 'x'))).toBe('green');
    expect(verify.verdictOf('Update', both('Renew', 'x'))).toBe('green');
    expect(verify.verdictOf(' Something went wrong. ', both('Another problem occurred.', 'x'))).toBe('green');
  });

  it('the Hindi loop lessons: the Devanagari name renderings', () => {
    expect(verify.verdictOf('Dhuhr', both('zuhar', 'x'))).toBe('green');
    expect(verify.verdictOf('Suhoor', both('sahari', 'x'))).toBe('green');
    expect(verify.verdictOf('Duha', both('Juha', 'x'))).toBe('green');
    expect(verify.verdictOf('Done', both('full', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('jill-kadah', 'x'))).toBe('green');
  });

  it('the Italian loop lessons: Ohimè joins the dismay exclamations', () => {
    expect(verify.verdictOf(' Oh no! ', both('Alas!', 'x'))).toBe('green');
  });

  it('the Japanese loop lessons: the katakana names and the element weekdays', () => {
    expect(verify.verdictOf('Dhuhr', both('Zuhur', 'x'))).toBe('green');
    expect(verify.verdictOf('Checking for updates...', both('Confirming...', 'x'))).toBe('green');
    expect(verify.verdictOf('Done', both('completion', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zulqaida', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zulhijah', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('ah!', 'x'))).toBe('green');
  });

  it('the Javanese loop lessons: the sunrise phrase in its other word order, and mengko as future', () => {
    expect(verify.verdictOf('Sunrise', both('The sun is rising', 'x'))).toBe('green');
    expect(verify.verdictOf('Later', both('Future', 'x'))).toBe('green');
  });

  it('the Kazakh loop lessons: parameters, messages, and the Qiʻdah rendering', () => {
    expect(verify.verdictOf('Settings', both('Parameters', 'x'))).toBe('green');
    expect(verify.verdictOf("Why don't I get any notifications?", both('Why is there no message?', 'x'))).toBe('green');
    expect(verify.verdictOf('Enable Notifications', both('Add messages', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('In Zulkag', 'x'))).toBe('green');
  });

  it('the Kannada loop lessons: Juhar, the noise sense, Bhanu as the sun, and Zul-Kida', () => {
    expect(verify.verdictOf('Dhuhr', both('Juhar', 'x'))).toBe('green');
    expect(verify.verdictOf('Sound', both('noise', 'x'))).toBe('green');
    expect(verify.verdictOf('Sun', both('Bhanu', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zul-Kida', 'x'))).toBe('green');
    expect(verify.verdictOf('Sunrise', both('Bhanu', 'x'))).not.toBe('green');
  });

  it('the Korean loop lessons: Dooha, and the month names romanized their own way', () => {
    expect(verify.verdictOf('Duha', both('Dooha', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Dulcada', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Dulhija', 'x'))).toBe('green');
  });

  it('the Kurdish loop lessons: Esha, the dawn meal, worked-out as calculated, and the two month spellings', () => {
    expect(verify.verdictOf('Isha', both('Esha', 'x'))).toBe('green');
    expect(verify.verdictOf('Suhoor', both('Morning meal', 'x'))).toBe('green');
    expect(
      verify.verdictOf(
        'The qibla is worked out from your location',
        both('Qibla is calculated from your location', 'x')
      )
    ).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zilqada', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zilhice', 'x'))).toBe('green');
  });

  it('the Kyrgyz loop lessons: no update as the up-to-date state, and Zulkaada', () => {
    expect(verify.verdictOf('You’re up to date', both('No update', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zulkaada', 'x'))).toBe('green');
  });

  it('the Malayalam loop lessons: the prayer romanizations, announcement, and the dismay word', () => {
    expect(verify.verdictOf('Fajr', both('Subah', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuhr', both('Luhr', 'x'))).toBe('green');
    expect(verify.verdictOf('Asr', both('Azar', 'x'))).toBe('green');
    expect(verify.verdictOf('Duha', both('Luha', 'x'))).toBe('green');
    expect(verify.verdictOf('Notification at prayer time', both('Announcement during Namaz', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Dulkhaad', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Dhul Hajj', 'x'))).toBe('green');
    expect(verify.verdictOf(' Oh no! ', both('Oops!', 'x'))).toBe('green');
  });

  it('the Marathi loop lesson: Zhul-Kada joins the Qiʻdah family', () => {
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zhul-Kada', 'x'))).toBe('green');
  });

  it('the Burmese loop lessons: Zahor, Asur, Kevlar as qibla, and the month pair', () => {
    expect(verify.verdictOf('Dhuhr', both('Zahor', 'x'))).toBe('green');
    expect(verify.verdictOf('Asr', both('Asur', 'x'))).toBe('green');
    expect(verify.verdictOf('Qibla', both('Kevlar', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Qiʻdah', both('Zulqaid', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuʻl-Hijjah', both('Zul Hajj', 'x'))).toBe('green');
  });

  it('the Oromo loop lessons: the sun s east as the whole-sense sunrise, and Zuhri', () => {
    expect(verify.verdictOf('Sunrise', both('East of the Sun', 'x'))).toBe('green');
    expect(verify.verdictOf('Dhuhr', both('Zuhri', 'x'))).toBe('green');
  });

  it('phase two: green when both slots carry the meaning, red when neither does, amber on divergence or a missing slot', () => {
    expect(verify.verdictOf('Fajr', both('Fajr', 'The dawn'), null, null, 'two')).toBe('green');
    expect(verify.verdictOf('Dhuhr', both('Back', 'the back'), null, null, 'two')).toBe('red');
    expect(verify.verdictOf('Dhuhr', both('Back', 'noon'), null, null, 'two')).toBe('amber');
    expect(
      verify.verdictOf(
        'Fajr',
        [
          { engine: 'gtx', roundtrip: null },
          { engine: 'pending', roundtrip: null },
        ],
        null,
        null,
        'two'
      )
    ).toBe('amber');
    expect(verify.verdictOf('Fajr', both(null, null), { roundtrip: 'Fajr' }, null, 'two')).toBe('amber');
  });
});

describe('the per-locale artifacts (Google alone; slot two sits empty for phase two)', () => {
  const catalog: Catalog = { ...realEn, 'prayer.fajr': 'الفجر' };
  const gtxBody = (text: string) => res(JSON.stringify([[[text, 'x', null, null]]]));
  const gtxFetch: FetchFn = async (url) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    return gtxBody(q === 'الفجر' ? 'The dawn prayer' : `g: ${q.slice(0, 6)}`);
  };

  it('fetches exactly one request per row, renders slot one and leaves slot two empty', async () => {
    let calls = 0;
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: SCRATCH,
      fetch: async (url) => {
        calls += 1;
        return gtxFetch(url);
      },
      sleep: noSleep,
      now: fixedNow,
      label: 'ar - Arabic',
    });
    expect(out.count).toBe(207);
    expect(out.misses).toEqual([]);
    // 207 rows plus the single pre-flight probe; slot two is never requested
    expect(calls).toBe(208);
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites).toEqual([
      { engine: 'gtx', roundtrip: 'The dawn prayer' },
      { engine: 'pending', roundtrip: null },
    ]);

    const json = JSON.parse(readFileSync(join(SCRATCH, 'ar.json'), 'utf8'));
    expect(json.languageName).toBe('ar - Arabic');
    expect(json.rowCount).toBe(207);
    expect(json.counts).toEqual(out.counts);
    expect(json.rows[0].sites).toHaveLength(2);
    expect(json.rows[0].url2).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain('mymemory');
  });

  it('pacing holds one engine request per gap, never two in flight', async () => {
    const events: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'paced'),
      fetch: async (url) => {
        events.push('fetch');
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        const answer = await gtxFetch(url);
        inFlight -= 1;
        return answer;
      },
      sleep: async (ms) => {
        events.push(`sleep:${ms}`);
      },
      now: fixedNow,
      pace: 12000,
    });
    expect(out.engineMix.gtx).toBe(207);
    expect(maxInFlight).toBe(1);
    expect(events[0]).toBe('sleep:12000');
    for (let i = 1; i < events.length; i += 1) {
      if (events[i] === 'fetch') expect(events[i - 1]).toBe('sleep:12000');
    }
  });

  it('a refused request waits its pace gap before the retry', async () => {
    const events: string[] = [];
    let call = 0;
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'paced-retry'),
      fetch: async (url) => {
        call += 1;
        events.push(`fetch:${call}`);
        if (call === 2) return res('blocked', false, 429);
        return gtxFetch(url);
      },
      sleep: async (ms) => {
        events.push(`sleep:${ms}`);
      },
      now: fixedNow,
      pace: 5000,
    });
    expect(out.engineMix.gtx).toBe(207);
    const secondRefusal = events.indexOf('fetch:2');
    const retry = events.indexOf('fetch:3');
    expect(events.slice(secondRefusal + 1, retry)).toEqual(['sleep:400', 'sleep:5000']);
  });

  it('marks a slot miss when the engine refuses, and lists the row as a gap, gtx dead whole-locale', async () => {
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'gtx-dead'),
      fetch: async () => res('blocked', false, 429),
      sleep: noSleep,
      now: fixedNow,
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[0]).toEqual({ engine: 'gtx', roundtrip: null });
    expect(fajr?.sites[1]).toEqual({ engine: 'pending', roundtrip: null });
    expect(fajr?.verdict).toBe('amber');
    expect(out.misses[0]).toEqual({ locale: 'ar', key: 'prayer.fajr', missing: ['gtx'] });
    expect(out.engineMix).toEqual({ gtx: 0, miss: 207, pending: 207 });
  });

  it('reports an unrendered row as a judge-fill gap and never invents a rendering', async () => {
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'both-dead'),
      fetch: async () => res('dead', false, 503),
      sleep: noSleep,
      now: fixedNow,
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites).toEqual([
      { engine: 'gtx', roundtrip: null },
      { engine: 'pending', roundtrip: null },
    ]);
    expect(fajr?.llm).toBeUndefined();
    expect(out.misses[0]).toEqual({ locale: 'ar', key: 'prayer.fajr', missing: ['gtx'] });
    expect(out.counts).toEqual({ green: 0, red: 0, amber: 207 });
  });

  it('reuses a resumed gtx slot only while the catalog string is unchanged, and never adopts MyMemory history', async () => {
    const priorRow = (key: string, en: string, cat: string): Row => ({
      key,
      en,
      catalog: cat,
      sites: [
        { engine: 'gtx', roundtrip: `old gtx: ${cat.slice(0, 4)}` },
        { engine: 'mymemory', roundtrip: `old mm: ${cat.slice(0, 4)}` },
      ],
      url: 'u',
      verdict: 'amber',
    });
    const resumeRows = new Map<string, Row>([
      ['prayer.fajr', priorRow('prayer.fajr', 'Fajr', 'الفجر')],
      ['prayer.sunrise', priorRow('prayer.sunrise', realEn['prayer.sunrise'], 'changed since then')],
    ]);
    let calls = 0;
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'resume'),
      fetch: async (url) => {
        calls += 1;
        return gtxFetch(url);
      },
      sleep: noSleep,
      now: fixedNow,
      resumeRows,
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[0].roundtrip).toBe('old gtx: الفج');
    // The historical MyMemory slot is not carried into the pending slot two
    expect(fajr?.sites[1]).toEqual({ engine: 'pending', roundtrip: null });
    // One probe plus the 206 rows whose gtx slot was not resumed
    expect(calls).toBe(207);
    const sunrise = out.rows.find((r) => r.key === 'prayer.sunrise');
    expect(sunrise?.sites[0].roundtrip).toBe('g: Sunris');
  });

  it('migrates an old single-round-trip artifact row only when its engine is gtx', async () => {
    const legacyGtx = { key: 'prayer.fajr', en: 'Fajr', catalog: 'الفجر', roundtrip: 'The dawn prayer', engine: 'gtx' };
    const legacyMm = {
      key: 'prayer.sunrise',
      en: 'Sunrise',
      catalog: 'Sunrise',
      roundtrip: 'old mymemory text',
      engine: 'mymemory',
    };
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'legacy'),
      fetch: async (url) => {
        const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
        return gtxBody(`fresh: ${q.slice(0, 4)}`);
      },
      sleep: noSleep,
      now: fixedNow,
      resumeRows: new Map<string, Row>([
        ['prayer.fajr', legacyGtx as unknown as Row],
        ['prayer.sunrise', legacyMm as unknown as Row],
      ]),
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[0].roundtrip).toBe('The dawn prayer');
    // A legacy MyMemory rendering seeds nothing; the row refetches on gtx
    const sunrise = out.rows.find((r) => r.key === 'prayer.sunrise');
    expect(sunrise?.sites[0].roundtrip).toBe('fresh: Sunr');
    expect(sunrise?.sites[1]).toEqual({ engine: 'pending', roundtrip: null });
  });
});

describe('the rendered pages (order two: modern, human-friendly, colored)', () => {
  const rows: Row[] = [
    {
      key: 'prayer.fajr',
      en: 'Fajr',
      catalog: 'الفجر',
      sites: [
        { engine: 'gtx', roundtrip: 'Fajr' },
        { engine: 'pending', roundtrip: null },
      ],
      llm: null,
      url: 'https://translate.google.com/x',
      verdict: 'green',
    },
    {
      key: 'prayer.dhuhr',
      en: 'Dhuhr',
      catalog: 'الظهر',
      sites: [
        { engine: 'gtx', roundtrip: 'Back' },
        { engine: 'pending', roundtrip: null },
      ],
      llm: null,
      url: 'u',
      verdict: 'red',
    },
    {
      key: 'prayer.isha',
      en: 'Isha',
      catalog: 'العشاء',
      sites: [
        { engine: 'gtx', roundtrip: null },
        { engine: 'pending', roundtrip: null },
      ],
      llm: { roundtrip: 'The night prayer', doubt: 'judge flagged the rendering' },
      url: 'u',
      verdict: 'amber',
    },
  ];

  it('renders the locale page with the label, the Google round-trip, an empty second slot, verdict classes and the one link', () => {
    const html = verify.renderLocaleHtml('ar', 'ar - Arabic', rows);
    expect(html).toContain('<h1>ar - Arabic</h1>');
    expect(html).toContain('Athan translation verification - ar - Arabic');
    expect(html).toContain('class="g"');
    expect(html).toContain('class="r"');
    expect(html).toContain('class="a"');
    expect(html).toContain('dir="rtl" lang="ar"');
    expect(html).toContain('Google round-trip');
    expect(html).toContain('phase two');
    expect(html).toContain('href="https://translate.google.com/x"');
    expect(html).not.toContain('MyMemory');
    expect(html).not.toContain('mymemory');
    // The llm fill shows once, marked, never as a site rendering, with its doubt
    expect((html.match(/The night prayer/g) ?? []).length).toBe(1);
    expect(html).toContain('llm');
    expect(html).toContain('judge flagged the rendering');
    expect(html).not.toContain('<script>');
  });

  it('renders the English reference page with no engines and no verdicts', () => {
    const html = verify.renderReferenceHtml('en - English', [
      { key: 'prayer.fajr', en: 'Fajr' },
      { key: 'settings.title', en: 'Settings' },
    ]);
    expect(html).toContain('<h1>en - English</h1>');
    expect(html).toContain('reference');
    expect(html).not.toContain('round-trip');
    expect(html).not.toContain('verdict');
    expect(html).toContain('Fajr');
  });

  it('renders the index as cards with per-language counts, the legend, the reference pinned first, red before amber', () => {
    const html = verify.renderIndexHtml([
      {
        locale: 'so',
        label: 'so - Somali',
        count: 207,
        counts: { green: 200, red: 5, amber: 2 },
        engineMix: {},
        file: 'so.html',
      },
      {
        locale: 'ar',
        label: 'ar - Arabic',
        count: 207,
        counts: { green: 150, red: 20, amber: 37 },
        engineMix: {},
        file: 'ar.html',
      },
      {
        locale: 'ms',
        label: 'ms - Malay',
        count: 207,
        counts: { green: 207, red: 0, amber: 0 },
        engineMix: {},
        file: 'ms.html',
      },
      { locale: 'en', label: 'en - English', count: 207, file: 'en.html', reference: true },
    ]);
    const arAt = html.indexOf('ar.html');
    const soAt = html.indexOf('so.html');
    const msAt = html.indexOf('ms.html');
    const enAt = html.indexOf('en.html');
    expect(enAt).toBeLessThan(arAt);
    expect(arAt).toBeLessThan(soAt);
    expect(soAt).toBeLessThan(msAt);
    expect(html).toContain('so - Somali');
    expect(html).toContain('20 red');
    expect(html).toContain('37 amber');
    expect(html).toContain('follow the red');
    expect(html).toContain('reference');
    expect(html).not.toContain('MyMemory');
  });
});

describe('direction: the RTL set reads from locale.ts, the one source of truth (review 5906)', () => {
  const localeSource = `type LocaleId = string;
export const RTL_IDS: ReadonlySet<LocaleId> = new Set(['ar', 'fa', 'ur', 'ps', 'pa-Arab', 'sd', 'ug', 'ckb', 'skr', 'bal', 'kas']);`;
  const rtlFixtureFetch: FetchFn = async (url) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    return res(JSON.stringify([[[`g: ${q.slice(0, 6)}`, 'x', null, null]]]));
  };

  it('parses the exported set and marks the canonical ids rtl', () => {
    const rtl = verify.parseRtlIds(localeSource, 'locale.ts');
    expect(rtl.has('pa-Arab')).toBe(true);
    expect(rtl.has('sd')).toBe(true);
    expect(rtl.has('ug')).toBe(true);
    expect(rtl.has('ckb')).toBe(true);
    expect(verify.dirFor('sd', rtl)).toBe('rtl');
    expect(verify.dirFor('en', rtl)).toBe('ltr');
  });

  it('renders the catalog column rtl for a locale the old copy missed', async () => {
    const rtl = verify.loadRtlIds({ readLocaleSource: () => localeSource });
    await verify.runLocale('sd', {
      en: realEn,
      catalog: { ...realEn },
      outDir: SCRATCH,
      fetch: rtlFixtureFetch,
      sleep: noSleep,
      now: fixedNow,
      label: 'sd',
      rtl,
    });
    const html = readFileSync(join(SCRATCH, 'sd.html'), 'utf8');
    expect(html).toContain('dir="rtl"');
  });
});

describe('the command line flow', () => {
  const readCatalogFile = async (locale: string) =>
    locale === 'en' ? realEn : { ...realEn, 'prayer.fajr': `t:${locale}` };
  const baseDeps = (fetchFn: FetchFn): Partial<Deps> => ({
    fetch: fetchFn,
    sleep: noSleep,
    now: fixedNow,
    log: (_line: string) => {},
    home: SCRATCH,
    readCatalogFile,
  });
  const fetchOk: FetchFn = async (url) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    return res(JSON.stringify([[[`g: ${q.slice(0, 6)}`, q, null, null]]]));
  };

  it('the index rebuild survives a stray non-artifact json in the out dir', async () => {
    const outDir = join(SCRATCH, 'cli-stray');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    writeFileSync(join(outDir, 'zzz-stray.json'), JSON.stringify({ not: 'an artifact' }));
    const report = await verify.run(['--locales', 'ar', '--out', outDir, '--resume'], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('ar - Arabic');
    expect(html).not.toContain('undefined');
  });

  it('rejects a junk --pace value and threads a whole-number pace into the locale run', async () => {
    const outDir = join(SCRATCH, 'cli-pace');
    await expect(verify.run(['--locales', 'ar', '--out', outDir, '--pace', 'abc'], baseDeps(fetchOk))).rejects.toThrow(
      /pace/
    );
    await expect(verify.run(['--locales', 'ar', '--out', outDir, '--pace', '-5'], baseDeps(fetchOk))).rejects.toThrow(
      /pace/
    );
    const sleeps: number[] = [];
    const deps = baseDeps(fetchOk);
    deps.sleep = async (ms: number) => {
      sleeps.push(ms);
    };
    const report = await verify.run(['--locales', 'ar', '--out', outDir, '--pace', '9000'], deps);
    expect(report.ok).toBe(true);
    // the probe plus every row, one pace gap before each
    expect(sleeps.filter((ms) => ms === 9000).length).toBe(208);
  });

  it('runs the named locales, generates the English reference without a single fetch, and reports ok', async () => {
    const outDir = join(SCRATCH, 'cli-a');
    const deps = baseDeps(fetchOk);
    let calls = 0;
    deps.fetch = async (url) => {
      calls += 1;
      return fetchOk(url);
    };
    const report = await verify.run(['--locales', 'en,ar', '--out', outDir], deps);
    expect(report.ok).toBe(true);
    expect(report.written.map((file) => file.split('/').at(-1)).sort()).toEqual([
      'ar.html',
      'ar.json',
      'en.html',
      'en.json',
      'index.html',
    ]);
    // 207 rows on the single engine plus one pre-flight probe; en fetches nothing
    expect(calls).toBe(208);
    const enHtml = readFileSync(join(outDir, 'en.html'), 'utf8');
    expect(enHtml).toContain('reference');
  });

  describe('the judge rulings (the loop phase one: a fluent judge greens a correct catalog the engine misread)', () => {
    const buildArtifact = async (outDir: string) => {
      await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
      return JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    };
    const makeRed = (before: { rows: Row[]; counts: Record<string, number> }, key: string) => {
      const row = before.rows.find((r: Row) => r.key === key);
      if (!row) throw new Error(`fixture artifact holds no ${key} row`);
      row.sites = [
        { engine: 'gtx', roundtrip: 'an engine rendering that loses the meaning' },
        { engine: 'pending', roundtrip: null },
      ];
      row.verdict = 'red';
      return before;
    };

    it('rules a red row green with a mandatory note, visibly marked, and recounts', async () => {
      const outDir = join(SCRATCH, 'cli-rule');
      const before = makeRed(await buildArtifact(outDir), 'prayer.fajr');
      writeFileSync(join(outDir, 'ar.json'), JSON.stringify(before));
      writeFileSync(
        join(outDir, 'ar.judge-rulings.json'),
        JSON.stringify([
          {
            key: 'prayer.fajr',
            note: 'the engine picked the country sense; the catalog name is the established prayer name',
          },
        ])
      );
      const lines: string[] = [];
      const deps = baseDeps(fetchOk);
      deps.log = (line: string) => {
        lines.push(line);
      };
      const report = await verify.run(['--rule', 'ar', '--out', outDir], deps);
      expect(report.ok).toBe(true);
      const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      const row = after.rows.find((r: Row) => r.key === 'prayer.fajr');
      expect(row.verdict).toBe('green');
      expect(row.ruling).toBe('the engine picked the country sense; the catalog name is the established prayer name');
      expect(after.counts.red).toBe(before.counts.red - 1);
      expect(after.judgeRuled).toBe(1);
      const html = readFileSync(join(outDir, 'ar.html'), 'utf8');
      expect(html).toContain('judge');
      expect(lines.some((line) => line.includes('ar: 1 ruling applied'))).toBe(true);
    });

    it('refuses a ruling without a note', async () => {
      const outDir = join(SCRATCH, 'cli-rule-no-note');
      const before = await buildArtifact(outDir);
      const red = before.rows.find((r: Row) => r.verdict === 'red');
      if (!red) throw new Error('fixture artifact holds no red row');
      writeFileSync(join(outDir, 'ar.judge-rulings.json'), JSON.stringify([{ key: red.key, note: '' }]));
      const report = await verify.run(['--rule', 'ar', '--out', outDir], baseDeps(fetchOk));
      expect(report.ok).toBe(false);
      expect(report.rulingErrors).toEqual([`ar/${red.key} carries no note`]);
      const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      expect(after.judgeRuled ?? 0).toBe(0);
    });

    it('a standing ruling survives a resume while the engine still reads red, and drops once the engine carries', async () => {
      const outDir = join(SCRATCH, 'cli-rule-resume');
      const before = makeRed(await buildArtifact(outDir), 'prayer.fajr');
      writeFileSync(join(outDir, 'ar.json'), JSON.stringify(before));
      writeFileSync(
        join(outDir, 'ar.judge-rulings.json'),
        JSON.stringify([{ key: 'prayer.fajr', note: 'the engine misreads a correct catalog string' }])
      );
      await verify.run(['--rule', 'ar', '--out', outDir], baseDeps(fetchOk));

      // The resume rebuilds every row from the resumed slots; the row still reads red
      // (makeRed's engine text loses the meaning), so the ruling must restore its green
      const resumed = await verify.run(['--locales', 'ar', '--out', outDir, '--resume'], baseDeps(fetchOk));
      expect(resumed.ok).toBe(true);
      const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      const row = after.rows.find((r: Row) => r.key === 'prayer.fajr');
      expect(row.ruling).toBe('the engine misreads a correct catalog string');
      expect(row.verdict).toBe('green');

      // A ruling that no longer applies (the engine's own rendering carries) rides nothing
      const greenArtifact = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      const greenRow = greenArtifact.rows.find((r: Row) => r.key === 'settings.title');
      greenRow.ruling = 'a ruling that no longer applies';
      greenRow.verdict = 'green';
      writeFileSync(join(outDir, 'ar.json'), JSON.stringify(greenArtifact));
      await verify.run(['--locales', 'ar', '--out', outDir, '--resume'], baseDeps(fetchOk));
      const final = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      const finalRow = final.rows.find((r: Row) => r.key === 'settings.title');
      expect(finalRow.ruling).toBeUndefined();
      expect(finalRow.verdict).toBe('green');
    });

    it('re-applying a standing ruling is a no-op, not a refusal', async () => {
      const outDir = join(SCRATCH, 'cli-rule-idempotent');
      const before = makeRed(await buildArtifact(outDir), 'prayer.fajr');
      writeFileSync(join(outDir, 'ar.json'), JSON.stringify(before));
      writeFileSync(
        join(outDir, 'ar.judge-rulings.json'),
        JSON.stringify([{ key: 'prayer.fajr', note: 'the engine misreads a correct catalog string' }])
      );
      await verify.run(['--rule', 'ar', '--out', outDir], baseDeps(fetchOk));
      const again = await verify.run(['--rule', 'ar', '--out', outDir], baseDeps(fetchOk));
      expect(again.ok).toBe(true);
      const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      const row = after.rows.find((r: Row) => r.key === 'prayer.fajr');
      expect(row.verdict).toBe('green');
      expect(after.judgeRuled).toBe(1);
    });

    it('refuses a ruling on a row the engine did not read red, a missing note, and an unknown key', async () => {
      const outDir = join(SCRATCH, 'cli-rule-refused');
      await buildArtifact(outDir);
      writeFileSync(
        join(outDir, 'ar.judge-rulings.json'),
        JSON.stringify([
          { key: 'settings.title', note: 'not a red row' },
          { key: 'settings.help', note: 'also not a red row' },
          { key: 'unknown.key', note: 'typo guard' },
        ])
      );
      const report = await verify.run(['--rule', 'ar', '--out', outDir], baseDeps(fetchOk));
      expect(report.ok).toBe(false);
      expect(report.rulingErrors).toEqual([
        'ar/settings.title is not a red row',
        'ar/settings.help is not a red row',
        'ar/unknown.key is not a row in the artifact',
      ]);
      const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
      expect(after.judgeRuled ?? 0).toBe(0);
    });
  });

  it("rebuilds the index from every artifact on disk, not only this run's locales", async () => {
    const outDir = join(SCRATCH, 'cli-index');
    await verify.run(['--locales', 'so', '--out', outDir], baseDeps(fetchOk));
    // A later run touching only ar must not erase so's card from the index
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const index = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(index).toContain('so.html');
    expect(index).toContain('ar.html');
  });

  it('skips the judge-rulings side file when rebuilding the index', async () => {
    const outDir = join(SCRATCH, 'cli-index-rulings');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    writeFileSync(
      join(outDir, 'ar.judge-rulings.json'),
      JSON.stringify([{ key: 'settings.title', note: 'a side file, not an artifact' }])
    );
    const report = await verify.run(['--locales', 'ar', '--out', outDir, '--resume'], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    const index = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(index).toContain('ar.html');
  });

  it('runs all 75 catalogs under --all, resolving codes from the language-name table', async () => {
    const deps = baseDeps(fetchOk);
    const report = await verify.run(['--all', '--out', join(SCRATCH, 'cli-all')], deps);
    expect(report.ok).toBe(true);
    expect(report.locales).toHaveLength(75);
    expect(report.locales[0]).toBe('en');
  });

  it('verdicts follow --phase on a fixture catalog, immune to catalog wording edits', async () => {
    const fixtureEn: Catalog = { 'prayer.fajr': 'Fajr', 'a.two': 'Dhuhr', 'a.three': 'Asr' };
    const fixtureDeps = (fetchFn: FetchFn) => {
      const deps = baseDeps(fetchFn);
      deps.readCatalogFile = async () => fixtureEn;
      return deps;
    };
    const oneDir = join(SCRATCH, 'cli-phase-one');
    const one = await verify.run(['--locales', 'ar', '--out', oneDir], fixtureDeps(fetchOk));
    expect(one.ok).toBe(true);
    const oneJson = JSON.parse(readFileSync(join(oneDir, 'ar.json'), 'utf8'));
    expect(oneJson.phase).toBe('one');
    // Every fixture string survives the 'g: ' prefix round-trip whole, so phase one
    // (Google's slot alone) reads all three green
    expect(oneJson.counts).toEqual({ green: 3, red: 0, amber: 0 });

    const twoDir = join(SCRATCH, 'cli-phase-two');
    const two = await verify.run(['--locales', 'ar', '--out', twoDir, '--phase', 'two'], fixtureDeps(fetchOk));
    expect(two.ok).toBe(true);
    const twoJson = JSON.parse(readFileSync(join(twoDir, 'ar.json'), 'utf8'));
    expect(twoJson.phase).toBe('two');
    // Slot two is structurally empty in this batch, so phase two ambers every row
    expect(twoJson.counts).toEqual({ green: 0, red: 0, amber: 3 });

    await expect(
      verify.run(['--locales', 'ar', '--out', join(SCRATCH, 'cli-phase-x'), '--phase', 'three'], fixtureDeps(fetchOk))
    ).rejects.toThrow('--phase');
  });

  it('defaults the out dir under the injected home and rejects an unknown locale', async () => {
    const deps = baseDeps(fetchOk);
    const report = await verify.run(['--locales', 'ar'], deps);
    expect(report.written).toContain(join(deps.home!, 'athan-i18n-verify', 'index.html'));
    await expect(verify.run(['--locales', 'xx'], deps)).rejects.toThrow('xx');
  });

  it('exits non-zero while a slot gap stands, and turns ok once the judge fills an unrendered row', async () => {
    const outDir = join(SCRATCH, 'cli-gap');
    const dead = baseDeps(async () => res('x', false, 429));
    const gap = await verify.run(['--locales', 'ar', '--out', outDir], dead);
    expect(gap.ok).toBe(false);
    expect(gap.misses.every((m) => m.missing.length === 1 && m.missing[0] === 'gtx')).toBe(true);

    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify(
        Object.keys(realEn).map((key) => ({ key, roundtrip: `judge: ${realEn[key]}` })),
        null,
        2
      )
    );
    const filled = await verify.run(['--fill', 'ar', '--out', outDir], baseDeps(fetchOk));
    expect(filled.ok).toBe(true);
    const json = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(json.rows.every((r: Row) => r.llm !== undefined || r.sites[0].roundtrip !== null)).toBe(true);
    expect(json.counts.amber).toBe(207);
    const html = readFileSync(join(outDir, 'ar.html'), 'utf8');
    expect(html).toContain('judge:');
  });

  it('skips a fill whose row the engine has since rendered, refuses unknown keys, and lists unfilled rows as gaps', async () => {
    const outDir = join(SCRATCH, 'cli-fill-rules');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const rendered = before.rows[0];
    const dark = { ...before.rows[1] };
    dark.sites = [
      { engine: 'gtx', roundtrip: null },
      { engine: 'pending', roundtrip: null },
    ];
    writeFileSync(join(outDir, 'ar.json'), JSON.stringify({ ...before, rows: [rendered, dark] }));
    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify([
        { key: rendered.key, roundtrip: 'stale entry the engine superseded' },
        { key: 'unknown.key', roundtrip: 'typo guard' },
      ])
    );
    const refused = await verify.run(['--fill', 'ar', '--out', outDir], baseDeps(fetchOk));
    expect(refused.ok).toBe(false);
    expect(refused.fillErrors).toEqual(['ar/unknown.key is not a row in the artifact']);
    const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(after.rows[0].llm).toBeUndefined();
    expect(after.rows[0].sites[0].roundtrip).not.toBeNull();
  });

  it('merges fresh fills for still-dark rows beside superseded ones without refusing', async () => {
    const outDir = join(SCRATCH, 'cli-fill-mixed');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const rendered = before.rows[0];
    const dark = { ...before.rows[1] };
    dark.sites = [
      { engine: 'gtx', roundtrip: null },
      { engine: 'pending', roundtrip: null },
    ];
    writeFileSync(join(outDir, 'ar.json'), JSON.stringify({ ...before, rows: [rendered, dark] }));
    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify([
        { key: rendered.key, roundtrip: 'stale' },
        { key: dark.key, roundtrip: 'the judge rendering' },
      ])
    );
    const report = await verify.run(['--fill', 'ar', '--out', outDir], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(after.rows[0].llm).toBeUndefined();
    expect(after.rows[1].llm?.roundtrip).toBe('the judge rendering');
    expect(after.rows[1].verdict).toBe('amber');
  });

  it('a partial fill exits non-zero and names the rows still dark (review 5905/5906)', async () => {
    const outDir = join(SCRATCH, 'cli-fill-partial');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const darkRows = before.rows.slice(0, 2).map((row: Row) => ({
      ...row,
      sites: [
        { engine: 'gtx', roundtrip: null },
        { engine: 'pending', roundtrip: null },
      ],
    }));
    writeFileSync(join(outDir, 'ar.json'), JSON.stringify({ ...before, rows: [...darkRows, ...before.rows.slice(2)] }));
    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify([{ key: darkRows[0].key, roundtrip: 'the judge rendering' }])
    );
    const lines: string[] = [];
    const deps = baseDeps(fetchOk);
    deps.log = (line: string) => {
      lines.push(line);
    };
    const report = await verify.run(['--fill', 'ar', '--out', outDir], deps);
    expect(report.ok).toBe(false);
    expect(report.misses).toEqual([{ locale: 'ar', key: darkRows[1].key }]);
    expect(lines.some((line) => line.includes('still dark') && line.includes(`ar/${darkRows[1].key}`))).toBe(true);
  });

  it('an engine recovery supersedes a stale judge fill even when the fill file no longer names the row', async () => {
    const outDir = join(SCRATCH, 'cli-fill-stale-llm');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const green = before.rows.find((row: Row) => row.verdict === 'green');
    const stale = { ...green };
    stale.llm = { roundtrip: 'an old judge rendering' };
    stale.verdict = 'amber';
    const staleIndex = before.rows.indexOf(green);
    writeFileSync(
      join(outDir, 'ar.json'),
      JSON.stringify({ ...before, rows: before.rows.map((row: Row, i: number) => (i === staleIndex ? stale : row)) })
    );
    writeFileSync(join(outDir, 'ar.llm-fill.json'), JSON.stringify([]));
    const report = await verify.run(['--fill', 'ar', '--out', outDir], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(after.rows[staleIndex].llm).toBeUndefined();
    expect(after.rows[staleIndex].verdict).toBe('green');
  });

  it('an engine recovery supersedes a stale judge fill that the fill file still names', async () => {
    const outDir = join(SCRATCH, 'cli-fill-stale-llm-named');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const green = before.rows.find((row: Row) => row.verdict === 'green');
    const stale = { ...green };
    stale.llm = { roundtrip: 'an old judge rendering' };
    stale.verdict = 'amber';
    const staleIndex = before.rows.indexOf(green);
    writeFileSync(
      join(outDir, 'ar.json'),
      JSON.stringify({ ...before, rows: before.rows.map((row: Row, i: number) => (i === staleIndex ? stale : row)) })
    );
    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify([{ key: stale.key, roundtrip: 'a fresher judge rendering' }])
    );
    const lines: string[] = [];
    const deps = baseDeps(fetchOk);
    deps.log = (line: string) => {
      lines.push(line);
    };
    const report = await verify.run(['--fill', 'ar', '--out', outDir], deps);
    expect(report.ok).toBe(true);
    const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(after.rows[staleIndex].llm).toBeUndefined();
    expect(after.rows[staleIndex].verdict).toBe('green');
    expect(lines.some((line) => line.includes('superseded'))).toBe(true);
  });

  it('marks a doubted judge fill amber even where the engine agrees, and a phase-two artifact refreshes as phase two', async () => {
    const outDir = join(SCRATCH, 'cli-doubt');
    await verify.run(['--locales', 'ar', '--out', outDir, '--phase', 'two'], baseDeps(fetchOk));
    // Break one row to both-miss so a fill is legal, then doubt it
    const artifact = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const key = artifact.rows[0].key;
    artifact.rows[0].sites = [
      { engine: 'gtx', roundtrip: null },
      { engine: 'pending', roundtrip: null },
    ];
    writeFileSync(join(outDir, 'ar.json'), JSON.stringify(artifact));
    writeFileSync(
      join(outDir, 'ar.llm-fill.json'),
      JSON.stringify([{ key, roundtrip: 'a rendering', doubt: 'unresolved word' }])
    );
    const report = await verify.run(['--fill', 'ar', '--out', outDir], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    const after = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const row = after.rows[0];
    expect(row.verdict).toBe('amber');
    expect(row.llm?.doubt).toBe('unresolved word');
    // The refresh rides the artifact's own phase, not the default
    expect(after.phase).toBe('two');
  });

  it('exits non-zero on a row shortfall from 207 and refuses to run with no locales named', async () => {
    const shortLocale = { ...realEn };
    delete shortLocale['app.loadingLabel'];
    const deps = baseDeps(fetchOk);
    deps.readCatalogFile = async (locale) => (locale === 'en' ? realEn : shortLocale);
    const report = await verify.run(['--locales', 'ar', '--out', join(SCRATCH, 'cli-short')], deps);
    expect(report.ok).toBe(false);
    expect(report.shortfalls).toEqual([{ locale: 'ar', count: 206 }]);
    await expect(verify.run(['--out', join(SCRATCH, 'cli-none')], deps)).rejects.toThrow('--locales');
  });

  it('resolves the default out dir through the OS home when no home is injected', async () => {
    const { home, ...withoutHome } = baseDeps(fetchOk);
    const report = await verify.run(['--locales', 'ar'], { ...withoutHome, homedir: () => SCRATCH });
    expect(report.written).toContain(join(SCRATCH, 'athan-i18n-verify', 'index.html'));
  });
});
