/**
 * The locale the app speaks before anyone picks one: a valid stored preference wins,
 * else the device's ordered locale list resolves against the shipped set, else en.
 */

import { getDefaultStore } from 'jotai/vanilla';

import {
  chevronFor,
  type DeviceLocaleInfo,
  readStoredLanguagePreference,
  resolveInitialLocale,
  sentenceComma,
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
    ['id-ID', 'id', 'id'],
    ['tr-TR', 'tr', 'tr'],
    ['fr-FR', 'fr', 'fr'],
    ['uz-UZ', 'uz', 'uz'],
    ['sw-KE', 'sw', 'sw'],
    ['ha-NG', 'ha', 'ha'],
    ['pt-BR', 'pt', 'pt'],
    ['ur-PK', 'ur', 'ur'],
    ['fa-IR', 'fa', 'fa'],
    ['bn-BD', 'bn', 'bn'],
    ['es-ES', 'es', 'es'],
    ['nl-NL', 'nl', 'nl'],
    ['kk-KZ', 'kk', 'kk'],
    ['ky-KG', 'ky', 'ky'],
    ['tg-TJ', 'tg', 'tg'],
    ['tk-TM', 'tk', 'tk'],
    ['wo-SN', 'wo', 'wo'],
    ['mr-IN', 'mr', 'mr'],
    ['ru-RU', 'ru', 'ru'],
    ['az-AZ', 'az', 'az'],
    ['de-DE', 'de', 'de'],
    ['sq-AL', 'sq', 'sq'],
    ['bs-BA', 'bs', 'bs'],
    ['ps-AF', 'ps', 'ps'],
    ['ta-IN', 'ta', 'ta'],
    ['ta-LK', 'ta', 'ta'],
    ['ml-IN', 'ml', 'ml'],
    ['om-ET', 'om', 'om'],
    ['bm-ML', 'bm', 'bm'],
    ['tl-PH', 'tl', 'tl'],
    ['ff-SN', 'ff', 'ff'],
    ['te-IN', 'te', 'te'],
    ['gu-IN', 'gu', 'gu'],
    ['kn-IN', 'kn', 'kn'],
    ['am-ET', 'am', 'am'],
    ['pa-PK', 'pa', 'pa-Arab'],
    ['pa-Arab-PK', 'pa', 'pa-Arab'],
    ['sd-PK', 'sd', 'sd'],
    ['ug-CN', 'ug', 'ug'],
    ['ckb-IQ', 'ckb', 'ckb'],
    ['ku-TR', 'ku', 'ku'],
    ['ig-NG', 'yo', 'yo'],
    ['jv-ID', 'jv', 'jv'],
    ['su-ID', 'su', 'su'],
    ['skr-PK', 'skr', 'skr'],
    ['bal-PK', 'bal', 'bal'],
    ['bal-IR', 'bal', 'bal'],
    ['ks-IN', 'ks', 'kas'],
    ['ks-Arab-IN', 'ks', 'kas'],
    // Devanagari Kashmiri stays unshipped: a ks-Deva reader is not served Perso-Arabic copy
    ['ks-Deva-IN', 'ks', 'en'],
    ['dv-MV', 'dv', 'dv'],
    ['aa-DJ', 'aa', 'aa'],
    ['aa-ET', 'aa', 'aa'],
    ['mdh-PH', 'mdh', 'mdh'],
    ['kr-NG', 'kr', 'kr'],
    ['kr-NE', 'kr', 'kr'],
    ['mnk-GM', 'mnk', 'mnk'],
    ['mnk-SN', 'mnk', 'mnk'],
    ['dje-NE', 'dje', 'dje'],
    // Gurmukhi and India's Punjabi stay unshipped: a Gurmukhi reader is not served Shahmukhi
    ['pa-Guru-IN', 'pa', 'en'],
    ['pa-IN', 'pa', 'en'],
    // Decision 9, plan T-419: the zh pair resolves by script subtag, then by the
    // TW/HK/MO region list CLDR's likely-subtags answers, and bare zh reads
    // Simplified (R4 A.4: a bare zh entry must never serve a Traditional reader)
    ['zh-Hans', 'zh', 'zh-Hans'],
    ['zh-Hans-CN', 'zh', 'zh-Hans'],
    ['zh-Hans-SG', 'zh', 'zh-Hans'],
    ['zh-Hant-TW', 'zh', 'zh-Hant'],
    ['zh-Hant-HK', 'zh', 'zh-Hant'],
    ['zh-TW', 'zh', 'zh-Hant'],
    ['zh-HK', 'zh', 'zh-Hant'],
    ['zh-MO', 'zh', 'zh-Hant'],
    ['zh-CN', 'zh', 'zh-Hans'],
    ['zh-SG', 'zh', 'zh-Hans'],
    ['zh', 'zh', 'zh-Hans'],
  ] as const)('resolves %s to %s', (languageTag, languageCode, expected) => {
    expect(resolveInitialLocale(null, [{ languageTag, languageCode }])).toBe(expected);
  });

  it('falls back to en for an unsupported language', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'ig-NG', languageCode: 'ig' }])).toBe('en');
    // yue is its own language code, never a zh tag: a yue-tagged device falls through
    expect(resolveInitialLocale(null, [{ languageTag: 'yue-Hant-HK', languageCode: 'yue' }])).toBe('en');
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
      { languageTag: 'ig-NG', languageCode: 'ig' },
      { languageTag: 'ar-EG', languageCode: 'ar' },
    ];
    expect(resolveInitialLocale(null, deviceLocales)).toBe('ar');
  });

  it('matches a device language tag that is exactly a shipped locale', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'so', languageCode: null }])).toBe('so');
  });

  it('skips a device locale with no language code', () => {
    expect(resolveInitialLocale(null, [{ languageTag: 'ig-NG', languageCode: null }])).toBe('en');
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
    // LTR locales point right, every RTL locale mirrors
    expect(chevronFor()).toBe('\u203A');
    setActiveLocale('ar');
    try {
      expect(chevronFor()).toBe('\u2039');
    } finally {
      setActiveLocale('en');
    }
  });

  it.each(['ur', 'fa', 'ps', 'pa-Arab', 'sd', 'ug', 'ckb', 'skr', 'bal', 'kas', 'dv'] as const)(
    'mirrors the chevron under %s, the later RTL locales',
    (locale) => {
      setActiveLocale(locale);
      try {
        expect(chevronFor()).toBe('\u2039');
      } finally {
        setActiveLocale('en');
      }
    }
  );
});

describe('sentenceComma', () => {
  it.each(['ar', 'ur', 'fa', 'ps', 'pa-Arab', 'sd', 'ug', 'ckb', 'skr', 'bal', 'kas', 'dv'] as const)(
    'carries the Arabic comma under %s',
    (locale) => {
      setActiveLocale(locale);
      try {
        expect(sentenceComma()).toBe('\u060C');
      } finally {
        setActiveLocale('en');
      }
    }
  );

  it.each(['en', 'ms', 'so', 'hi', 'th'] as const)('keeps the Latin comma under %s', (locale) => {
    setActiveLocale(locale);
    try {
      expect(sentenceComma()).toBe(',');
    } finally {
      setActiveLocale('en');
    }
  });
});
