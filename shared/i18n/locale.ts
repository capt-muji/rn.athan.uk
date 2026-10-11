/**
 * The locale resolution core: which of the six shipped locales the app speaks,
 * before any runtime switch exists (R1.1). Pure functions only, so a test can
 * drive the algorithm without a device.
 */

import * as Database from '@/stores/database';

/** The D32 confidence set. Storage keys and surfaces locale-key off these ids. */
export const LOCALE_IDS = ['en', 'ar', 'ms', 'so', 'hi', 'th'] as const;

export type LocaleId = (typeof LOCALE_IDS)[number];

export interface DeviceLocaleInfo {
  languageTag: string;
  languageCode: string | null;
}

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
