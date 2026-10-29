/**
 * Native strings from committed config (D43, D46): every per-locale native
 * value - the permission purposes and the widget gallery names - reproduces
 * from app.json on every prebuild, byte-identical to the plan's native
 * table, and the locale declarations cover the fifty-eight-language set on both
 * table, and the locale declarations cover the fifty-nine-language set on both
 * platforms.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const app = (JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')) as { expo: Record<string, unknown> }).expo;
const NATIVE = JSON.parse(readFileSync(join(ROOT, 'shared', 'i18n', 'native-strings.json'), 'utf8')) as Record<
  string,
  {
    NSLocationWhenInUseUsageDescription: string;
    NSUserNotificationsUsageDescription: string;
    gallery: Record<string, string>;
  }
>;

const LOCALES = [
  'en',
  'ar',
  'ms',
  'so',
  'hi',
  'th',
  'id',
  'tr',
  'fr',
  'uz',
  'sw',
  'ha',
  'pt',
  'ur',
  'fa',
  'bn',
  'ru',
  'az',
  'de',
  'sq',
  'bs',
  'ps',
  'ta',
  'ml',
  'zh-Hans',
  'zh-Hant',
  'es',
  'nl',
  'kk',
  'ky',
  'tg',
  'tk',
  'wo',
  'mr',
  'om',
  'bm',
  'tl',
  'ff',
  'te',
  'gu',
  'kn',
  'am',
  'pa-Arab',
  'sd',
  'ug',
  'ckb',
  'ku',
  'yo',
  'jv',
  'su',
  'my',
  'tt',
  'ce',
  'uk',
  'qu',
  'min',
  'mad',
  'bug',
  'ja',
  'ko',
  'it',
  'pl',
  'ro',
  'ceb',
  'ilo',
  'vi',
  'skr',
  'bal',
  'kas',
  'dv',
  'aa',
  'mdh',
  'kr',
  'mnk',
  'dje',
] as const;
type NonEnLocale = Exclude<(typeof LOCALES)[number], 'en'>;
const NON_EN = LOCALES.slice(1) as readonly NonEnLocale[];

/** The locales whose native rows are written in Cyrillic, so a Latin letter in one is a slip */
const CYRILLIC_SCRIPT: readonly string[] = ['ru', 'kk', 'ky', 'tg', 'tt', 'ce', 'uk'];

/** The words of a value that carry both scripts, the shape of a homoglyph */
const mixedWords = (value: string): string[] =>
  value.split(/[^\p{L}]+/u).filter((word) => /\p{Script=Latin}/u.test(word) && /\p{Script=Cyrillic}/u.test(word));

/** A native row's strings, keyed for the failure message */
const nativeStrings = (locale: string): Record<string, string> => {
  const row = NATIVE[locale];
  return {
    NSLocationWhenInUseUsageDescription: row.NSLocationWhenInUseUsageDescription,
    NSUserNotificationsUsageDescription: row.NSUserNotificationsUsageDescription,
    ...row.gallery,
  };
};

/** The widget kinds' config entries from the expo-widgets plugin block */
const widgetKinds = (): Array<{ name: string; displayName: string; description: string }> => {
  const plugins = app.plugins as unknown[];
  const entry = plugins.find(
    (plugin): plugin is [string, { widgets: Array<{ name: string; displayName: string; description: string }> }] =>
      Array.isArray(plugin) && plugin[0] === 'expo-widgets'
  );
  if (!entry) throw new Error('expo-widgets plugin block missing');
  return entry[1].widgets;
};

/** snake_case of a widget kind name, the resource-name derivation (digits split off) */
const resourceName = (kind: string): string =>
  kind
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z])([0-9])/g, '$1_$2')
    .toLowerCase();

describe('native strings from committed config', () => {
  it('carries an expo.locales entry per non-en locale, byte-identical to the native table', () => {
    const locales = app.locales as Record<string, Record<string, unknown>> | undefined;

    for (const locale of NON_EN) {
      const entry = locales?.[locale] as
        | {
            NSLocationWhenInUseUsageDescription: string;
            NSUserNotificationsUsageDescription: string;
            ios: { 'Localizable.strings': Record<string, string> };
            android: Record<string, string>;
          }
        | undefined;
      expect(entry).toBeDefined();
      if (!entry) continue;
      const native = NATIVE[locale];

      expect(entry.NSLocationWhenInUseUsageDescription).toBe(native.NSLocationWhenInUseUsageDescription);
      expect(entry.NSUserNotificationsUsageDescription).toBe(native.NSUserNotificationsUsageDescription);

      // The iOS gallery table is keyed by the English literals the generated Swift carries
      expect(entry.ios['Localizable.strings']).toEqual(native.gallery);

      // The Android gallery table is keyed by the plugin-derived resource names
      for (const widget of widgetKinds()) {
        expect(entry.android[`${resourceName(widget.name)}_display_name`]).toBe(native.gallery[widget.displayName]);
        expect(entry.android[`${resourceName(widget.name)}_description`]).toBe(native.gallery[widget.description]);
      }
    }
  });

  it('refuses a Cyrillic letter inside a Latin-script locale', () => {
    // Russian, Kazakh, Kyrgyz and Tajik write Cyrillic; every other shipped locale
    // writes Latin, Arabic, Devanagari, Thai, Bengali, Tamil, Malayalam, Kannada,
    // Telugu, Gujarati, Ethiopic, Myanmar or Han, so a Cyrillic letter in one of
    // their rows is a homoglyph slip, not a spelling
    const CYRILLIC = /[\u0400-\u04FF]/;
    const failures: string[] = [];
    for (const locale of LOCALES) {
      if (CYRILLIC_SCRIPT.includes(locale)) continue;
      const row = NATIVE[locale];
      const strings: Record<string, string> = {
        NSLocationWhenInUseUsageDescription: row.NSLocationWhenInUseUsageDescription,
        NSUserNotificationsUsageDescription: row.NSUserNotificationsUsageDescription,
        ...row.gallery,
      };
      for (const [key, value] of Object.entries(strings)) {
        if (CYRILLIC.test(value)) failures.push(`${locale}: ${key} carries a Cyrillic letter`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('refuses a Latin letter inside a Cyrillic-script locale', () => {
    // The mirror rule, and the one Chechen broke: a Latin letter glued to Cyrillic
    // inside one word is a homoglyph for the palochka, while a whole Latin token is
    // the brand or a platform label, so the scan reads word by word
    const failures: string[] = [];
    for (const locale of CYRILLIC_SCRIPT) {
      for (const [key, value] of Object.entries(nativeStrings(locale))) {
        const words = mixedWords(value);
        if (words.length) failures.push(`${locale}: ${key} carries ${words.join(', ')}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('declares every shipped locale in CFBundleLocalizations with the display name unchanged', () => {
    const ios = app.ios as { infoPlist?: Record<string, unknown> };
    const infoPlist = (ios.infoPlist ?? {}) as Record<string, unknown>;
    expect(infoPlist.CFBundleLocalizations).toEqual([...LOCALES]);
    expect(infoPlist.CFBundleDisplayName).toBe('Athan');
  });

  it('derives a default-locale twin for every translated android key, byte-identical to the en table', () => {
    const { defaultLocaleStringEntries, buildDefaultLocaleStringsXml } = require(
      join(ROOT, 'plugins', 'androidLocaleConfig.js')
    ) as {
      defaultLocaleStringEntries: (projectRoot: string, config: Record<string, unknown>) => Array<[string, string]>;
      buildDefaultLocaleStringsXml: (entries: ReadonlyArray<[string, string]>) => string;
    };

    const entries = defaultLocaleStringEntries(ROOT, app);
    const defaults = new Map(entries);

    // The permission strings' en bytes come from the committed infoPlist, the table's own source
    const infoPlist = (app.ios as { infoPlist: Record<string, string> }).infoPlist;
    expect(infoPlist.NSLocationWhenInUseUsageDescription).toBe(NATIVE.en.NSLocationWhenInUseUsageDescription);
    expect(defaults.get('NSLocationWhenInUseUsageDescription')).toBe(NATIVE.en.NSLocationWhenInUseUsageDescription);
    expect(defaults.get('NSUserNotificationsUsageDescription')).toBe(NATIVE.en.NSUserNotificationsUsageDescription);

    // The android-null kinds are the iOS-only gallery entries: exactly their keys gain twins
    const widgets = widgetKinds() as Array<{
      name: string;
      displayName: string;
      description: string;
      android?: unknown;
    }>;
    const iosOnly = widgets.filter((widget) => !widget.android);
    expect(iosOnly).toHaveLength(10);
    for (const widget of iosOnly) {
      expect(defaults.get(`${resourceName(widget.name)}_display_name`)).toBe(NATIVE.en.gallery[widget.displayName]);
      expect(defaults.get(`${resourceName(widget.name)}_description`)).toBe(NATIVE.en.gallery[widget.description]);
    }
    expect(defaults.size).toBe(22);

    // No translated key may lack either a default twin or an android-kind owner in values/
    const locales = app.locales as Record<string, { android: Record<string, string> }>;
    const translatedKeys = new Set(Object.values(locales).flatMap((entry) => Object.keys(entry.android)));
    translatedKeys.add('NSLocationWhenInUseUsageDescription');
    translatedKeys.add('NSUserNotificationsUsageDescription');
    const androidOwned = new Set(
      widgets
        .filter((widget) => widget.android)
        .flatMap((widget) => [`${resourceName(widget.name)}_display_name`, `${resourceName(widget.name)}_description`])
    );
    for (const key of translatedKeys) {
      expect(defaults.has(key) || androidOwned.has(key)).toBe(true);
    }

    // The written resource matches the stock locale writer's quoted-value shape
    const xml = buildDefaultLocaleStringsXml(entries);
    expect(xml).toContain('<resources>');
    expect(xml.match(/<string /g)).toHaveLength(22);
    expect(xml).toContain(
      `<string name="NSUserNotificationsUsageDescription">"${NATIVE.en.NSUserNotificationsUsageDescription}"</string>`
    );
  });

  it('derives all 38 defaults when the resolution strips expo-widgets', () => {
    const { defaultLocaleStringEntries } = require(join(ROOT, 'plugins', 'androidLocaleConfig.js')) as {
      defaultLocaleStringEntries: (projectRoot: string, config: Record<string, unknown>) => Array<[string, string]>;
    };
    const stripped = {
      ...app,
      plugins: (app.plugins as unknown[]).filter((plugin) => !(Array.isArray(plugin) && plugin[0] === 'expo-widgets')),
    };
    const entries = defaultLocaleStringEntries(ROOT, stripped);
    const defaults = new Map(entries);
    expect(defaults.size).toBe(38);

    // The ExtraTranslation invariant: every translated key gains a default twin
    const locales = app.locales as Record<string, { android: Record<string, string> }>;
    const translatedKeys = new Set(Object.values(locales).flatMap((entry) => Object.keys(entry.android)));
    translatedKeys.add('NSLocationWhenInUseUsageDescription');
    translatedKeys.add('NSUserNotificationsUsageDescription');
    expect(translatedKeys.size).toBe(38);
    for (const key of translatedKeys) {
      expect(defaults.has(key)).toBe(true);
    }

    // The android kinds' twins read the same en gallery bytes as the iOS-only kinds'
    for (const widget of widgetKinds()) {
      expect(defaults.get(`${resourceName(widget.name)}_display_name`)).toBe(NATIVE.en.gallery[widget.displayName]);
      expect(defaults.get(`${resourceName(widget.name)}_description`)).toBe(NATIVE.en.gallery[widget.description]);
    }
  });

  it('builds the Android locales_config with every shipped locale', () => {
    const pluginPath = join(ROOT, 'plugins', 'androidLocaleConfig.js');
    expect(existsSync(pluginPath)).toBe(true);

    const { buildLocalesConfigXml } = require(pluginPath) as { buildLocalesConfigXml: (locales: string[]) => string };
    const xml = buildLocalesConfigXml([...LOCALES]);
    for (const locale of LOCALES) {
      expect(xml).toContain(`<locale android:name="${locale}"/>`);
    }
    expect(xml.match(/<locale /g)).toHaveLength(LOCALES.length);
    expect(xml).toContain('<locale-config xmlns:android="http://schemas.android.com/apk/res/android">');
  });
});
