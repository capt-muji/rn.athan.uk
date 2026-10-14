/**
 * The locale resolution core: which of the six shipped locales the app speaks,
 * and the runtime switch a Settings pick drives (R1.1, R3.1). The resolution
 * half stays pure, so a test can drive the algorithm without a device.
 */

import { getLocales } from 'expo-localization';
// The vanilla entry: this module loads in logic suites whose react is a stub,
// and the root entry would pull Provider (and react) into that graph
import { atom, getDefaultStore } from 'jotai/vanilla';

import * as Database from '@/stores/database';

/** The D32 confidence set. Storage keys and surfaces locale-key off these ids. */
export const LOCALE_IDS = ['en', 'ar', 'ms', 'so', 'hi', 'th'] as const;

export type LocaleId = (typeof LOCALE_IDS)[number];

/** Every shipped locale that reads right to left; a new RTL language joins this set and every
 * direction-keyed surface follows without further code */
const RTL_IDS: ReadonlySet<LocaleId> = new Set(['ar']);

export const localeDirection = (id: LocaleId): 'ltr' | 'rtl' => (RTL_IDS.has(id) ? 'rtl' : 'ltr');

/** The locale's own numerals for digits the app draws as data (dates, sentences); Latin where
 * the locale has none. A new language with native numerals adds one entry here */
const NATIVE_DIGITS: Partial<Record<LocaleId, string>> = { ar: '٠١٢٣٤٥٦٧٨٩' };

export const localizeDigits = (value: string): string => {
  const native = NATIVE_DIGITS[currentLocaleId()];
  return native === undefined ? value : value.replace(/[0-9]/g, (digit) => native[Number(digit)]);
};

/** The sheet chevron points with the reading direction: right under LTR, mirrored under RTL.
 * Reads the live locale at call time, so it follows a switch without a reload */
export const chevronFor = (): string => (localeDirection(currentLocaleId()) === 'rtl' ? '\u2039' : '\u203A');

export interface DeviceLocaleInfo {
  languageTag: string;
  languageCode: string | null;
}

/** Bumped once per switch; the layout root keys off it to remount the tree (R3.1) */
export const localeVersionAtom = atom(0);

/** The locale a Settings pick forced, or null while the device locale decides */
let active: LocaleId | null = null;

/** The device resolution, computed on first need and never again (R1.1) */
let resolved: LocaleId | null = null;

/**
 * The active locale: a stored preference's or the device's answer on the first
 * call, and whatever setActiveLocale last set afterwards. The first call runs
 * the synchronous preference and device reads and memoizes the result, which
 * serves the typography map's module-scope callers and bootstrap alike.
 */
export const currentLocaleId = (): LocaleId => {
  if (resolved === null) {
    resolved = resolveInitialLocale(readStoredLanguagePreference(), getLocales());
  }
  return active ?? resolved;
};

/** Switches the active locale and bumps the remount version (R3.1) */
export const setActiveLocale = (id: LocaleId): void => {
  active = id;
  getDefaultStore().set(localeVersionAtom, (version) => version + 1);
};

/**
 * RFC 4647 lookup over the device's ordered locale list: a valid stored
 * preference wins (R1.2's shape), then each device locale in user order
 * matches its exact tag, then its language code. Anything else is en.
 */
export const resolveInitialLocale = (
  preference: string | null,
  deviceLocales: readonly DeviceLocaleInfo[]
): LocaleId => {
  if (preference !== null && (LOCALE_IDS as readonly string[]).includes(preference)) {
    return preference as LocaleId;
  }

  for (const locale of deviceLocales) {
    if ((LOCALE_IDS as readonly string[]).includes(locale.languageTag)) {
      return locale.languageTag as LocaleId;
    }
    if (locale.languageCode !== null && (LOCALE_IDS as readonly string[]).includes(locale.languageCode)) {
      return locale.languageCode as LocaleId;
    }
  }

  return 'en';
};

/**
 * The nullable preference D33 rules: null means no choice yet, so the device
 * locale decides. Read here rather than through an atom because resolution
 * runs at module-eval-adjacent times where MMKV's synchronous read is safe.
 *
 * The preference atom stores the BARE locale id (atomWithStorageString), while
 * older eyes on the same key wrote JSON-quoted strings, so both forms read: a
 * bare shipped-locale id returns as itself, a quoted string parses as the
 * stored choice it always was, and anything else - including bytes JSON.parse
 * would throw on - reads as no choice rather than taking the tree down at the
 * first t() call (the 3T cold-start blank, refresh 6).
 */
export const readStoredLanguagePreference = (): string | null => {
  const raw = Database.getRawItem('preference_language');
  if (raw === undefined) return null;
  if ((LOCALE_IDS as readonly string[]).includes(raw)) return raw;

  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'string' && parsed !== '' ? parsed : null;
  } catch {
    return null;
  }
};
