// The T-575 verification generator's own gates: the catalog parse rule (the exported
// object literal whose declarator is not PRAYER_LABELS), the 11-5-191 row order with
// the owner's category rank table, HTML escaping, the loanword failover rule, the
// per-locale engine pre-flight, and the artifact shapes. Every network call goes
// through an injected fetch returning fixtures: no test touches a real engine, and
// no test reads the real clock (now is injected).
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const verify = require('../i18n-verify.js') as {
  parseCatalogSource(source: string, file: string): Catalog;
  orderedKeys(en: Catalog): string[];
  SECTION3_RANKS: string[];
  escapeHtml(value: string): string;
  dirFor(locale: string): string;
  spotCheckUrl(locale: string, text: string): string;
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
  rowAccepts(catalog: string, english: string, roundtrip: string | null): boolean;
  runLocale(
    locale: string,
    opts: Deps & { en: Catalog; catalog: Catalog; outDir: string; engineOrder?: string[]; concurrency?: number }
  ): Promise<LocaleResult>;
  renderIndexHtml(
    summaries: Array<{ locale: string; count: number; engineMix: Record<string, number>; file: string }>
  ): string;
  run(
    argv: string[],
    deps?: Partial<Deps>
  ): Promise<{
    ok: boolean;
    locales: string[];
    written: string[];
    shortfalls: Array<{ locale: string; count: number }>;
    misses: Array<{ locale: string; key: string }>;
  }>;
};

/** The shapes the fixtures trade in, so the lambdas over the required module stay typed */
type Catalog = Record<string, string>;
interface FetchResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}
type FetchFn = (url: string) => Promise<FetchResponse>;
interface Row {
  key: string;
  en: string;
  catalog: string;
  roundtrip: string | null;
  engine: string;
  url: string;
}
interface LocaleResult {
  locale: string;
  count: number;
  rows: Row[];
  engineMix: Record<string, number>;
  misses: Row[];
  files: string[];
}
interface Deps {
  fetch: FetchFn;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  log?: (line: string) => void;
  home?: string;
  readCatalogFile?: (locale: string) => Promise<Catalog>;
}

const SCRATCH = mkdtempSync(join(tmpdir(), 'i18n-verify-test-'));
const CATALOG_PATH = join(__dirname, '..', '..', 'shared', 'i18n', 'en.ts');

const res = (body: string, ok = true, status = 200): FetchResponse => ({ ok, status, text: async () => body });
const noSleep = async () => {};
const fixedNow = () => new Date('2026-11-02T12:00:00.000Z');

const realEn: Catalog = verify.parseCatalogSource(readFileSync(CATALOG_PATH, 'utf8'), 'en.ts');

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

describe('the 11-5-191 row order', () => {
  const keys = verify.orderedKeys(realEn);

  it('splits the real English catalog into the three sections with the exact counts', () => {
    expect(Object.keys(realEn)).toHaveLength(207);
    expect(keys).toHaveLength(207);
    expect(keys.slice(0, 11).every((k) => k.startsWith('prayer.'))).toBe(true);
    expect(keys.slice(11, 16).every((k) => k.startsWith('extras.explanation.'))).toBe(true);
    expect(keys.slice(16).every((k) => !k.startsWith('prayer.') && !k.startsWith('extras.explanation.'))).toBe(true);
    expect(keys.slice(16)).toHaveLength(191);
  });

  it('keeps the owner priority order inside sections 1 and 2', () => {
    expect(keys.slice(0, 11)).toEqual([
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
    ]);
    expect(keys.slice(11, 16)).toEqual([
      'extras.explanation.midnight',
      'extras.explanation.last third',
      'extras.explanation.suhoor',
      'extras.explanation.duha',
      'extras.explanation.istijaba',
    ]);
  });

  it('orders section 3 by the prefix rank table with unranked prefixes after in catalog order', () => {
    const prefixes: string[] = [];
    for (const key of keys.slice(16)) {
      const prefix = key.split('.')[0];
      if (!prefixes.includes(prefix)) prefixes.push(prefix);
    }
    expect(prefixes.slice(0, 18)).toEqual([
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
    ]);
    // The remaining prefixes are the unranked tail, in catalog (first-appearance) order
    const catalogOrder: string[] = [];
    for (const key of Object.keys(realEn)) {
      if (key.startsWith('prayer.') || key.startsWith('extras.explanation.')) continue;
      const prefix = key.split('.')[0];
      if (!catalogOrder.includes(prefix)) catalogOrder.push(prefix);
    }
    const unranked = catalogOrder.filter((p) => !verify.SECTION3_RANKS.includes(p));
    expect(prefixes.slice(18)).toEqual(unranked);
  });

  it('orders a synthetic catalog the same way', () => {
    const en = {
      'app.name': 'Athan',
      'prayer.fajr': 'Fajr',
      'whatsNew.title': 'What changed',
      'widget.refresh': 'Refresh',
      'settings.title': 'Settings',
      'extras.explanation.duha': '20 mins after Sunrise',
      'help.q.none': 'Why?',
      'settings.showSeconds': 'Show seconds',
    };
    expect(verify.orderedKeys(en)).toEqual([
      'prayer.fajr',
      'extras.explanation.duha',
      'settings.title',
      'settings.showSeconds',
      'help.q.none',
      'widget.refresh',
      'app.name',
      'whatsNew.title',
    ]);
  });
});

describe('HTML escaping and row direction', () => {
  it('escapes script tags and quotes, and leaves RTL punctuation untouched', () => {
    expect(verify.escapeHtml(`<script>alert("x")</script> '؟ «hi»'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &apos;؟ «hi»&apos;'
    );
  });

  it('answers rtl for the Arabic-script locales and ltr elsewhere', () => {
    expect(verify.dirFor('ar')).toBe('rtl');
    expect(verify.dirFor('skr')).toBe('rtl');
    expect(verify.dirFor('so')).toBe('ltr');
    expect(verify.dirFor('zh-Hans')).toBe('ltr');
  });

  it('builds the owner-protocol spot-check URL', () => {
    expect(verify.spotCheckUrl('ms', 'saat\n Lama')).toBe(
      'https://translate.google.com/?sl=ms&tl=en&text=saat%0A%20Lama&op=translate'
    );
  });
});

describe('the loanword failover rule', () => {
  it('accepts unchanged output only where the catalog string equals the English source', () => {
    // A loanword row: the catalog IS the English, so an echo is a valid round-trip
    expect(verify.rowAccepts('Fajr', 'Fajr', 'Fajr')).toBe(true);
    expect(verify.rowAccepts('Fajr', 'Fajr', 'Fejér')).toBe(true);
    // A translated row: an echo means the engine never translated
    expect(verify.rowAccepts('الفجر', 'Fajr', 'الفجر')).toBe(false);
    expect(verify.rowAccepts('الفجر', 'Fajr', 'The dawn')).toBe(true);
    expect(verify.rowAccepts('الفجر', 'Fajr', '')).toBe(false);
    expect(verify.rowAccepts('الفجر', 'Fajr', null)).toBe(false);
  });
});

describe('the engines behind an injected fetch', () => {
  it('builds each engine request URL with the locale and the encoded text', () => {
    expect(verify.gtxUrl('ar', 'hello world')).toBe(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=hello%20world'
    );
    expect(verify.myMemoryUrl('ar', 'hello world')).toBe(
      'https://api.mymemory.translated.net/get?q=hello%20world&langpair=ar%7Cen'
    );
  });

  it('extracts each engine body shape', () => {
    expect(verify.extractGtx(JSON.stringify([[['The dawn', 'الفجر', null, null]], null, 'ar']))).toBe('The dawn');
    expect(
      verify.extractGtx(
        JSON.stringify([
          [
            ['Hello ', 'a', null, null],
            ['world', 'b', null, null],
          ],
        ])
      )
    ).toBe('Hello world');
    expect(verify.extractGtx('[]')).toBeNull();
    expect(verify.extractMyMemory(JSON.stringify({ responseData: { translatedText: 'The dawn' } }))).toBe('The dawn');
    expect(verify.extractMyMemory(JSON.stringify({ responseData: { translatedText: '' } }))).toBeNull();
    expect(verify.extractMyMemory('not json')).toBeNull();
  });

  it('pre-flights one request per engine and orders the engines by who answers', async () => {
    const calls: string[] = [];
    const fetchFn = async (url: string) => {
      calls.push(url);
      if (url.includes('translate.googleapis.com')) return res('blocked', false, 429);
      return res(JSON.stringify({ responseData: { translatedText: 'yes' } }));
    };
    const order = await verify.preFlight(['gtx', 'mymemory'], 'ar', 'الفجر', {
      fetch: fetchFn,
      sleep: noSleep,
    });
    expect(order).toEqual(['mymemory', 'gtx']);
    expect(calls).toHaveLength(2);
  });

  it('returns no engine when the pre-flight finds both dead', async () => {
    const order = await verify.preFlight(['gtx', 'mymemory'], 'ar', 'الفجر', {
      fetch: async () => res('no', false, 429),
      sleep: noSleep,
    });
    expect(order).toEqual([]);
  });

  it('retries with backoff and succeeds on a late answer', async () => {
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
  });

  it('gives up after the retry budget and answers null', async () => {
    const sleeps: number[] = [];
    const out = await verify.fetchWithRetry('gtx', 'ar', 'x', {
      fetch: async () => res('block page', false, 429),
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(out).toBeNull();
    expect(sleeps).toEqual([400, 800]);
  });
});

describe('the per-locale artifacts', () => {
  const catalog: Catalog = { ...realEn, 'prayer.fajr': 'الفجر' };
  const fetchFn = async (url: string) => {
    if (url.includes('mymemory')) {
      const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
      return res(
        JSON.stringify({ responseData: { translatedText: q === 'الفجر' ? 'The dawn' : `en: ${q.slice(0, 8)}` } })
      );
    }
    return res('block page', false, 429);
  };

  it('writes the html and json pair with every row, its engine and its spot-check URL', async () => {
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: SCRATCH,
      fetch: fetchFn,
      sleep: noSleep,
      now: fixedNow,
    });
    expect(out.count).toBe(207);
    expect(out.misses).toEqual([]);
    expect(out.engineMix).toEqual({ mymemory: 207 });

    const html = readFileSync(join(SCRATCH, 'ar.html'), 'utf8');
    // 207 data rows plus one header row per section
    expect((html.match(/<tr>/g) ?? []).length).toBe(210);
    expect(html).toContain('dir="rtl" lang="ar"');
    expect(html).toContain('<h2>Section 1');
    expect(html).toContain('<h2>Section 2');
    expect(html).toContain('<h2>Section 3');
    expect(html).toContain('https://translate.google.com/?sl=ar&amp;tl=en&amp;text=');
    expect(html).not.toContain('<script>');

    const json = JSON.parse(readFileSync(join(SCRATCH, 'ar.json'), 'utf8'));
    expect(json.locale).toBe('ar');
    expect(json.generatedAt).toBe('2026-11-02T12:00:00.000Z');
    expect(json.rowCount).toBe(207);
    expect(json.engineMix).toEqual({ mymemory: 207 });
    expect(json.rows).toHaveLength(207);
    expect(json.rows[0]).toEqual({
      key: 'prayer.fajr',
      en: 'Fajr',
      catalog: 'الفجر',
      roundtrip: 'The dawn',
      engine: 'mymemory',
      url: 'https://translate.google.com/?sl=ar&tl=en&text=%D8%A7%D9%84%D9%81%D8%AC%D8%B1&op=translate',
    });
  });

  it('fails a row over to the second engine and marks the row engine none when both fail', async () => {
    let gtxEchoed = false;
    const fetchMixed = async (url: string) => {
      const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
      if (url.includes('mymemory')) {
        // MyMemory echoes the input on one row (a miss for a translated string) and
        // dies on another
        if (q === 'الفجر') return res(JSON.stringify({ responseData: { translatedText: q } }));
        if (q === catalog['settings.checkingUpdates']) return res('dead', false, 503);
        return res(JSON.stringify({ responseData: { translatedText: 'The settings' } }));
      }
      gtxEchoed = true;
      if (q === catalog['settings.checkingUpdates']) return res('dead', false, 503);
      return res(JSON.stringify([[[q === 'الفجر' ? 'The dawn prayer' : `en2: ${q.slice(0, 6)}`, q, null, null]]]));
    };
    const out = await verify.runLocale('ar', {
      en: realEn,
      catalog,
      outDir: SCRATCH,
      fetch: fetchMixed,
      sleep: noSleep,
      now: fixedNow,
      engineOrder: ['mymemory', 'gtx'],
    });
    expect(gtxEchoed).toBe(true);
    const fajr = out.rows.find((r) => r.key === 'prayer.fajr');
    expect(fajr?.engine).toBe('gtx');
    expect(fajr?.roundtrip).toBe('The dawn prayer');
    const title = out.rows.find((r) => r.key === 'settings.checkingUpdates');
    expect(title?.engine).toBe('none');
    expect(title?.roundtrip).toBeNull();
    expect(out.misses.map((r) => r.key)).toEqual(['settings.checkingUpdates']);
    expect(out.engineMix).toEqual({ mymemory: 205, gtx: 1, none: 1 });
  });

  it('renders the index with one line per locale, its engine mix and the verdict protocol', () => {
    const html = verify.renderIndexHtml([
      { locale: 'ar', count: 207, engineMix: { mymemory: 207 }, file: 'ar.html' },
      { locale: 'so', count: 207, engineMix: { gtx: 207 }, file: 'so.html' },
    ]);
    expect(html).toContain('<a href="ar.html">ar</a>');
    expect(html).toContain('207 rows');
    expect(html).toContain('mymemory: 207');
    expect(html).toContain('gtx: 207');
    expect(html).toContain('verdict');
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
  const fetchOk = async (url: string) => {
    const q = decodeURIComponent(url.split('q=')[1].split('&')[0]);
    return res(JSON.stringify([[[`en: ${q.slice(0, 6)}`, q, null, null]]]));
  };

  it('runs the named locales into the out dir and reports ok', async () => {
    const outDir = join(SCRATCH, 'cli-a');
    const report = await verify.run(['--locales', 'ar,so', '--out', outDir], baseDeps(fetchOk));
    expect(report.ok).toBe(true);
    expect(report.written.map((file) => file.split('/').at(-1)).sort()).toEqual([
      'ar.html',
      'ar.json',
      'index.html',
      'so.html',
      'so.json',
    ]);
    const index = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(index).toContain('ar');
    expect(index).toContain('so');
  });

  it('defaults the out dir under the injected home and runs the pilot wave under --waves', async () => {
    const deps = baseDeps(fetchOk);
    const report = await verify.run(['--waves'], deps);
    expect(report.ok).toBe(true);
    expect(report.locales).toEqual(['ar', 'so', 'id', 'ms', 'min', 'mad', 'bug', 'ceb', 'ilo']);
    expect(report.written).toContain(join(deps.home, 'athan-i18n-verify', 'index.html'));
  });

  it('exits non-zero when engines fail rows, listing them, and never invents an LLM round-trip', async () => {
    const outDir = join(SCRATCH, 'cli-dead');
    const report = await verify.run(
      ['--locales', 'ar', '--out', outDir],
      baseDeps(async () => res('x', false, 429))
    );
    expect(report.ok).toBe(false);
    expect(report.misses).toHaveLength(207);
    expect(report.misses[0]).toEqual({ locale: 'ar', key: 'prayer.fajr' });
    const json = JSON.parse(readFileSync(join(outDir, 'ar.json'), 'utf8'));
    expect(json.rows.every((r: Row) => r.engine === 'none' && r.roundtrip === null)).toBe(true);
    expect(json.engineMix).toEqual({ none: 207 });
  });

  it('exits non-zero on a row shortfall from 207 and refuses to run with no locales named', async () => {
    const shortLocale = { ...realEn };
    delete shortLocale['app.loadingLabel'];
    const deps = baseDeps(fetchOk);
    deps.readCatalogFile = async (locale: string) => (locale === 'en' ? realEn : shortLocale);
    const report = await verify.run(['--locales', 'ar', '--out', join(SCRATCH, 'cli-short')], deps);
    expect(report.ok).toBe(false);
    expect(report.shortfalls).toEqual([{ locale: 'ar', count: 206 }]);

    await expect(verify.run(['--out', join(SCRATCH, 'cli-none')], deps)).rejects.toThrow('--locales');
  });
});
