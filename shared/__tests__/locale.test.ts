/**
 * The locale the app speaks before anyone picks one: a valid stored preference wins,
 * else the device's ordered locale list resolves against the shipped set, else en.
 */

import { getDefaultStore } from 'jotai/vanilla';

import {
  chevronFor,
  type DeviceLocaleInfo,
  localizeDigits,
  readStoredLanguagePreference,
  resolveInitialLocale,
  setActiveLocale,
} from '@/shared/i18n/locale';
import * as Database from '@/stores/database';
import { languagePreferenceAtom } from '@/stores/language';

const LANGUAGE_KEY = 'preference_language';

describe('resolveInitialLocale', () => {
  it('resolves ar from ar-EG', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'ar-EG', languageCode: 'ar' }])).toBe('ar');
  });

  // Columns: the device language tag, its language code, the locale it resolves to
  it.each([
    ['ms-MY', 'ms', 'ms'],
    ['so-SO', 'so', 'so'],
    ['hi-IN', 'hi', 'hi'],
    ['th-TH', 'th', 'th'],
    ['en-GB', 'en', 'en'],
  ] as const)('resolves %s to %s', (languageTag, languageCode, expected) => {
    expect(resolveInitialLocale(null, [{ languageTag, languageCode }])).toBe(expected);
  });

  it('falls back to en for an unsupported language', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'fr-FR', languageCode: 'fr' }])).toBe('en');
    expect(resolveInitialLocale(null, [{ languageTag: 'zh-Hans', languageCode: 'zh' }])).toBe('en');
  });

  it('the stored preference wins', () => {
    const deviceLocales: readonly DeviceLocaleInfo[] = [{ languageTag: 'th-TH', languageCode: 'th' }];
    expect(resolveInitialLocale('ar', deviceLocales)).toBe('ar');
  });

  it('an unsupported stored preference falls through to the device', () => {
    const deviceLocales: readonly DeviceLocaleInfo[] = [{ languageTag: 'ms-MY', languageCode: 'ms' }];
    expect(resolveInitialLocale('zz', deviceLocales)).toBe('ms');
  });

  it('an earlier device locale wins over a later one', () => {
    const deviceLocales: readonly DeviceLocaleInfo[] = [
      { languageTag: 'fr-FR', languageCode: 'fr' },
      { languageTag: 'ar-EG', languageCode: 'ar' },
    ];
    expect(resolveInitialLocale(null, deviceLocales)).toBe('ar');
  });

  it('matches a device language tag that is exactly a shipped locale', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'so', languageCode: null }])).toBe('so');
  });

  it('skips a device locale with no language code', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'fr-FR', languageCode: null }])).toBe('en');
  });

  it('resolves en when the device reports no locales', () => {
    expect(resolveInitialLocale(null, [])).toBe('en');
  });
});

describe('readStoredLanguagePreference', () => {
  beforeEach(() => {
    Database.removeItem(LANGUAGE_KEY);
  });

  it('reads the stored choice', () => {
    Database.setItem(LANGUAGE_KEY, 'ar');
    expect(readStoredLanguagePreference()).toBe('ar');
  });

  it('treats an absent key as no choice', () => {
    expect(readStoredLanguagePreference()).toBeNull();
  });

  it('treats an empty string as no choice', () => {
    Database.setItem(LANGUAGE_KEY, '');
    expect(readStoredLanguagePreference()).toBeNull();
  });
});

describe('the stored-preference round trip', () => {
  beforeEach(() => {
    Database.removeItem(LANGUAGE_KEY);
  });

  // The regression the 3T caught: the preference atom writes the bare locale,
  // and a cold start reads it back through this resolver
  it('a bare locale written through the storage atom reads back as itself', () => {
    getDefaultStore().set(languagePreferenceAtom, 'ar');
    expect(readStoredLanguagePreference()).toBe('ar');
  });

  it('a JSON-quoted locale written through setItem still reads back', () => {
    Database.setItem(LANGUAGE_KEY, 'ar');
    expect(readStoredLanguagePreference()).toBe('ar');
  });

  it('a bare empty string reads as no choice', () => {
    Database.database.set(LANGUAGE_KEY, '');
    expect(readStoredLanguagePreference()).toBeNull();
  });

  it('an unparseable stored value reads as no choice, never a throw', () => {
    Database.database.set(LANGUAGE_KEY, 'hello');
    expect(readStoredLanguagePreference()).toBeNull();
  });

  it('a stored non-string value reads as no choice', () => {
    Database.database.set(LANGUAGE_KEY, '5');
    expect(readStoredLanguagePreference()).toBeNull();
  });
});

describe('chevronFor', () => {
  it('points the sheet chevron with the reading direction, whatever the locale', () => {
    // The owner's ruling, 2026-10-14: LTR locales point right, every RTL locale mirrors
    expect(chevronFor()).toBe('\u203A');
    setActiveLocale('ar');
    try {
      expect(chevronFor()).toBe('\u2039');
    } finally {
      setActiveLocale('en');
    }
  });
});

describe('localizeDigits', () => {
  it('maps Latin digits to Arabic-Indic under ar and leaves every other locale Latin', () => {
    setActiveLocale('ar');
    try {
      expect(localizeDigits('1448')).toBe('١٤٤٨');
      expect(localizeDigits('30, 1448')).toBe('٣٠, ١٤٤٨');
    } finally {
      setActiveLocale('en');
    }
    expect(localizeDigits('1448')).toBe('1448');
  });
});
