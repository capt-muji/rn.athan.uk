// The T-575 verification generator's own gates: the catalog and language-name parse
// rules, the 11-5-191 row order with the category rank table, HTML escaping, the
// loanword slot rule, the per-engine pre-flight, the meaning heuristic behind the
// verdict colors, the two-engine row shape with resume and the judge fill, and the
// v2 artifact shapes. Every network call goes through an injected fetch returning
// fixtures: no test touches a real engine, and no test reads the real clock.
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
  orderedKeys(en: Catalog): string[];
  escapeHtml(value: string): string;
  dirFor(locale: string): string;
  spotCheckUrl(locale: string, text: string): string;
  myMemoryCheckUrl(locale: string, text: string): string;
  gtxUrl(locale: string, text: string): string;
  myMemoryUrl(locale: string, text: string): string;
  extractGtx(body: string): string | null;
  extractMyMemory(body: string): string | null;
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
    doubt?: string | null
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
  url2: string;
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

describe('HTML escaping, direction and spot-check URLs', () => {
  it('escapes script tags and quotes, and leaves RTL punctuation untouched', () => {
    expect(verify.escapeHtml(`<script>alert("x")</script> '؟ «hi»'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &apos;؟ «hi»&apos;'
    );
  });

  it('answers rtl for the Arabic-script locales and ltr elsewhere', () => {
    expect(verify.dirFor('ar')).toBe('rtl');
    expect(verify.dirFor('skr')).toBe('rtl');
    expect(verify.dirFor('so')).toBe('ltr');
  });

  it('builds both spot-check links: the Google human page and the exact MyMemory API request', () => {
    expect(verify.spotCheckUrl('ms', 'saat lama')).toBe(
      'https://translate.google.com/?sl=ms&tl=en&text=saat%20lama&op=translate'
    );
    expect(verify.myMemoryCheckUrl('ms', 'saat lama')).toBe(
      'https://api.mymemory.translated.net/get?q=saat%20lama&langpair=ms%7Cen'
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

describe('the engines behind an injected fetch', () => {
  it('builds each engine request URL with the locale and the encoded text, aliasing zh-Hans', () => {
    expect(verify.gtxUrl('ar', 'hello world')).toBe(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=hello%20world'
    );
    expect(verify.gtxUrl('zh-Hans', '你好')).toBe(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=%E4%BD%A0%E5%A5%BD'
    );
    expect(verify.myMemoryUrl('ar', 'hello world')).toBe(
      'https://api.mymemory.translated.net/get?q=hello%20world&langpair=ar%7Cen'
    );
    expect(verify.myMemoryUrl('zh-Hans', '你好')).toBe(
      'https://api.mymemory.translated.net/get?q=%E4%BD%A0%E5%A5%BD&langpair=zh-CN%7Cen'
    );
  });

  it('extracts each engine body shape', () => {
    expect(verify.extractGtx(JSON.stringify([[['The dawn', 'الفجر', null, null]], null, 'ar']))).toBe('The dawn');
    expect(verify.extractGtx('[]')).toBeNull();
    expect(verify.extractMyMemory(JSON.stringify({ responseData: { translatedText: 'The dawn' } }))).toBe('The dawn');
    expect(verify.extractMyMemory('not json')).toBeNull();
  });

  it('pre-flights one request per engine and lists only the engines that answer', async () => {
    const calls: string[] = [];
    const fetchFn = async (url: string) => {
      calls.push(url);
      if (url.includes('translate.googleapis.com')) return res('blocked', false, 429);
      return res(JSON.stringify({ responseData: { translatedText: 'yes' } }));
    };
    const live = await verify.preFlight(verify.SITE_ENGINES, 'ar', 'الفجر', { fetch: fetchFn, sleep: noSleep });
    expect(live).toEqual(['mymemory']);
    expect(calls).toHaveLength(2);
  });

  it('retries with backoff and gives up after the budget', async () => {
    let attempt = 0;
    const sleeps: number[] = [];
    const out = await verify.fetchWithRetry('mymemory', 'ar', 'x', {
      fetch: async () => {
        attempt += 1;
        return attempt === 1
          ? res('throttled', false, 429)
          : res(JSON.stringify({ responseData: { translatedText: 'ok' } }));
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
  it('keeps the three true catches red: the round-trip loses the prayer meaning', () => {
    expect(verify.carriesMeaning('Dhuhr', 'Back')).toBe(false);
    expect(verify.carriesMeaning('Magrib', 'MOROCCO')).toBe(false);
    expect(verify.carriesMeaning('Isha', 'Dinner')).toBe(false);
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

describe('the row verdict (order three: a pass rests on two engines agreeing)', () => {
  const both = (a: string | null, b: string | null): Site[] => [
    { engine: 'gtx', roundtrip: a },
    { engine: 'mymemory', roundtrip: b },
  ];

  it('reads green when both engines carry the meaning, red when neither does', () => {
    expect(verify.verdictOf('Fajr', both('Fajr', 'The dawn'))).toBe('green');
    expect(verify.verdictOf('Dhuhr', both('Back', 'the back'))).toBe('red');
  });

  it('reads amber when the engines diverge, when a slot is missing, when the judge filled, and when the judge doubted', () => {
    expect(verify.verdictOf('Dhuhr', both('Back', 'noon'))).toBe('amber');
    expect(
      verify.verdictOf('Fajr', [
        { engine: 'gtx', roundtrip: null },
        { engine: 'mymemory', roundtrip: 'Fajr' },
      ])
    ).toBe('amber');
    expect(verify.verdictOf('Fajr', both(null, null), { roundtrip: 'Fajr' })).toBe('amber');
    expect(verify.verdictOf('Fajr', both('Fajr', 'The dawn'), null, 'judge doubted the rendering')).toBe('amber');
  });
});

describe('the two-engine per-locale artifacts', () => {
  const catalog: Catalog = { ...realEn, 'prayer.fajr': 'الفجر' };
  const gtxBody = (text: string) => res(JSON.stringify([[[text, 'x', null, null]]]));
  const mmBody = (text: string) => res(JSON.stringify({ responseData: { translatedText: text } }));
  const bothLiveFetch: FetchFn = async (url) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    if (url.includes('translate.googleapis.com'))
      return gtxBody(q === 'الفجر' ? 'The dawn prayer' : `g: ${q.slice(0, 6)}`);
    return mmBody(q === 'الفجر' ? 'Al Fajr' : `m: ${q.slice(0, 6)}`);
  };

  it('fetches both engines per row independently and records two slots and a verdict', async () => {
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: SCRATCH,
      fetch: bothLiveFetch,
      sleep: noSleep,
      now: fixedNow,
      label: 'ar - Arabic',
    });
    expect(out.count).toBe(207);
    expect(out.misses).toEqual([]);
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites).toEqual([
      { engine: 'gtx', roundtrip: 'The dawn prayer' },
      { engine: 'mymemory', roundtrip: 'Al Fajr' },
    ]);
    expect(fajr?.verdict).toBe('green');
    // A loanword row round-trips to itself on both engines
    const loan = out.rows.find((r) => r.key === 'prayer.asr');
    expect(loan?.verdict).toBe('green');

    const json = JSON.parse(readFileSync(join(SCRATCH, 'ar.json'), 'utf8'));
    expect(json.languageName).toBe('ar - Arabic');
    expect(json.rowCount).toBe(207);
    expect(json.counts).toEqual(out.counts);
    expect(json.rows[0].url2).toBe(verify.myMemoryCheckUrl('ar', 'الفجر'));
    expect(json.rows[0].sites).toHaveLength(2);
  });

  it('marks a slot miss when its engine refuses, and lists the row as a gap, gtx dead whole-locale', async () => {
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'gtx-dead'),
      fetch: async (url) => {
        if (url.includes('translate.googleapis.com')) return res('blocked', false, 429);
        return mmBody('Al Fajr');
      },
      sleep: noSleep,
      now: fixedNow,
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[0]).toEqual({ engine: 'gtx', roundtrip: null });
    expect(fajr?.verdict).toBe('amber');
    expect(out.misses[0]).toEqual({ locale: 'ar', key: 'prayer.fajr', missing: ['gtx'] });
    expect(out.engineMix).toEqual({ gtx: 0, mymemory: 207, miss: 207 });
  });

  it('reports a both-miss row as a judge-fill gap and never invents a rendering', async () => {
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
      { engine: 'mymemory', roundtrip: null },
    ]);
    expect(fajr?.llm).toBeUndefined();
    expect(out.misses[0]).toEqual({ locale: 'ar', key: 'prayer.fajr', missing: ['gtx', 'mymemory'] });
    expect(out.counts).toEqual({ green: 0, red: 0, amber: 207 });
  });

  it('reuses a resumed slot only while the catalog string is unchanged, and refetches the rest', async () => {
    const priorRow = (key: string, en: string, cat: string): Row => ({
      key,
      en,
      catalog: cat,
      sites: [
        { engine: 'gtx', roundtrip: null },
        { engine: 'mymemory', roundtrip: `old: ${cat.slice(0, 4)}` },
      ],
      url: 'u',
      url2: 'u2',
      verdict: 'amber',
    });
    const resumeRows = new Map<string, Row>([
      ['prayer.fajr', priorRow('prayer.fajr', 'Fajr', 'الفجر')],
      ['prayer.sunrise', priorRow('prayer.sunrise', realEn['prayer.sunrise'], 'changed since then')],
    ]);
    let myMemoryCalls = 0;
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'resume'),
      fetch: async (url) => {
        if (url.includes('mymemory')) myMemoryCalls += 1;
        return bothLiveFetch(url);
      },
      sleep: noSleep,
      now: fixedNow,
      resumeRows,
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[1].roundtrip).toBe('old: الفج');
    // The stale row and every other row refetch MyMemory beside the pre-flight probe;
    // the fresh fajr row reuses its resumed MyMemory slot
    expect(myMemoryCalls).toBe(207);
    const sunrise = out.rows.find((r) => r.key === 'prayer.sunrise');
    expect(sunrise?.sites[1].roundtrip).toBe('m: Sunris');
  });

  it('migrates an old single-round-trip artifact row into its engine slot on resume', async () => {
    const resumeRows = new Map<string, Row>([
      [
        'prayer.fajr',
        {
          key: 'prayer.fajr',
          en: 'Fajr',
          catalog: 'الفجر',
          sites: [
            { engine: 'gtx', roundtrip: null },
            { engine: 'mymemory', roundtrip: 'Al Fajr' },
          ],
          url: 'u',
          url2: 'u2',
          verdict: 'amber',
        } as Row,
      ],
    ]);
    const legacy = { ...resumeRows.get('prayer.fajr')!, sites: undefined, roundtrip: 'Al Fajr', engine: 'mymemory' };
    // The legacy shape arrives from run()'s loader; simulate by hand here
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: join(SCRATCH, 'legacy'),
      fetch: async (url) => {
        if (url.includes('mymemory')) return mmBody('Al Fajr');
        return gtxBody('The dawn prayer');
      },
      sleep: noSleep,
      now: fixedNow,
      resumeRows: new Map<string, Row>([['prayer.fajr', legacy as unknown as Row]]),
    });
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.sites[1].roundtrip).toBe('Al Fajr');
    expect(legacy).toBeTruthy();
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
        { engine: 'mymemory', roundtrip: 'The dawn' },
      ],
      llm: null,
      url: 'https://translate.google.com/x',
      url2: 'https://api.mymemory.translated.net/get?q=x',
      verdict: 'green',
    },
    {
      key: 'prayer.dhuhr',
      en: 'Dhuhr',
      catalog: 'الظهر',
      sites: [
        { engine: 'gtx', roundtrip: 'Back' },
        { engine: 'mymemory', roundtrip: 'Back' },
      ],
      llm: null,
      url: 'u',
      url2: 'u2',
      verdict: 'red',
    },
    {
      key: 'prayer.isha',
      en: 'Isha',
      catalog: 'العشاء',
      sites: [
        { engine: 'gtx', roundtrip: null },
        { engine: 'mymemory', roundtrip: null },
      ],
      llm: { roundtrip: 'The night prayer', doubt: 'judge flagged the rendering' },
      url: 'u',
      url2: 'u2',
      verdict: 'amber',
    },
  ];

  it('renders the locale page with the label, both round-trips, verdict classes and both links', () => {
    const html = verify.renderLocaleHtml('ar', 'ar - Arabic', rows);
    expect(html).toContain('<h1>ar - Arabic</h1>');
    expect(html).toContain('Athan translation verification - ar - Arabic');
    expect(html).toContain('class="g"');
    expect(html).toContain('class="r"');
    expect(html).toContain('class="a"');
    expect(html).toContain('dir="rtl" lang="ar"');
    expect(html).toContain('Google round-trip');
    expect(html).toContain('MyMemory round-trip');
    expect(html).toContain('href="https://translate.google.com/x"');
    expect(html).toContain('href="https://api.mymemory.translated.net/get?q=x"');
    // The llm fill shows once, marked, never as a site rendering, with its doubt
    expect((html.match(/The night prayer/g) ?? []).length).toBe(1);
    expect(html).toContain('llm');
    expect(html).toContain('judge flagged the rendering');
    expect(html).not.toContain('<script>');
    // Escaping still holds on the styled page
    expect(html).not.toContain('<td>&lt;script&gt;');
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
  });
});

describe('the command line flow', () => {
  const readCatalogFile = async (locale: string) =>
    locale === 'en' ? realEn : { ...realEn, 'prayer.fajr': `t:${locale}` };
  const baseDeps = (fetchFn: FetchFn) => ({
    fetch: fetchFn,
    sleep: noSleep,
    now: fixedNow,
    log: () => {},
    home: SCRATCH,
    readCatalogFile,
  });
  const fetchOk: FetchFn = async (url) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    if (url.includes('translate.googleapis.com'))
      return res(JSON.stringify([[[`g: ${q.slice(0, 6)}`, q, null, null]]]));
    return res(JSON.stringify({ responseData: { translatedText: `m: ${q.slice(0, 6)}` } }));
  };

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
    // 207 rows x 2 engines for ar plus one pre-flight probe per engine; en fetches nothing
    expect(calls).toBe(416);
    const enHtml = readFileSync(join(outDir, 'en.html'), 'utf8');
    expect(enHtml).toContain('reference');
  });

  it('runs all 75 catalogs under --all, resolving codes from the language-name table', async () => {
    const deps = baseDeps(fetchOk);
    const report = await verify.run(['--all', '--out', join(SCRATCH, 'cli-all')], deps);
    expect(report.ok).toBe(true);
    expect(report.locales).toHaveLength(75);
    expect(report.locales[0]).toBe('en');
  });

  it('defaults the out dir under the injected home and rejects an unknown locale', async () => {
    const deps = baseDeps(fetchOk);
    const report = await verify.run(['--locales', 'ar'], deps);
    expect(report.written).toContain(join(deps.home, 'athan-i18n-verify', 'index.html'));
    await expect(verify.run(['--locales', 'xx'], deps)).rejects.toThrow('xx');
  });

  it('exits non-zero while a slot gap stands, and turns ok once the judge fills a both-miss row', async () => {
    const outDir = join(SCRATCH, 'cli-gap');
    const dead = baseDeps(async () => res('x', false, 429));
    const gap = await verify.run(['--locales', 'ar', '--out', outDir], dead);
    expect(gap.ok).toBe(false);
    expect(gap.misses.every((m) => m.missing.length === 2)).toBe(true);

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
    expect(json.rows.every((r: Row) => r.llm !== undefined || (r.sites[0].roundtrip && r.sites[1].roundtrip))).toBe(
      true
    );
    expect(json.counts.amber).toBe(207);
    const html = readFileSync(join(outDir, 'ar.html'), 'utf8');
    expect(html).toContain('judge:');
  });

  it('skips a fill whose row an engine has since rendered, refuses unknown keys, and lists unfilled both-miss rows as gaps', async () => {
    const outDir = join(SCRATCH, 'cli-fill-rules');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    const before = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const rendered = before.rows[0];
    const dark = { ...before.rows[1] };
    dark.sites = [
      { engine: 'gtx', roundtrip: null },
      { engine: 'mymemory', roundtrip: null },
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
      { engine: 'mymemory', roundtrip: null },
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

  it('marks a doubted judge fill amber even where both engines agree', async () => {
    const outDir = join(SCRATCH, 'cli-doubt');
    await verify.run(['--locales', 'ar', '--out', outDir], baseDeps(fetchOk));
    // Break one row to both-miss so a fill is legal, then doubt it
    const artifact = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    const key = artifact.rows[0].key;
    artifact.rows[0].sites = [
      { engine: 'gtx', roundtrip: null },
      { engine: 'mymemory', roundtrip: null },
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
