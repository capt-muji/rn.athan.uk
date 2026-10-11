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
 * call, and whatever setActiveLocale last set afterwards. Lazy so nothing runs
 * a native read at module evaluation, before bootstrap has hydrated storage.
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
 */
export const readStoredLanguagePreference = (): string | null => {
  const stored = Database.getItem('preference_language');
  return stored === '' || stored === null ? null : stored;
};
