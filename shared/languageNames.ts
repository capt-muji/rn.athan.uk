/**
 * The D26 picker names: each language in its own name, sorted by codepoint,
 * so a reader scans for the name they know rather than an English gloss.
 * Latin before Cyrillic before Arabic before Devanagari before Bengali
 * before Tamil before Malayalam before Thai before Chinese. Names
 * data, not copy: the scanner's data-module rule allows this module's `name`
 * field.
 */

import type { LocaleId } from '@/shared/i18n/locale';

export const LANGUAGE_NAMES: ReadonlyArray<{ id: LocaleId; name: string }> = [
  { id: 'az', name: 'Azərbaycanca' },
  { id: 'id', name: 'Bahasa Indonesia' },
  { id: 'ms', name: 'Bahasa Melayu' },
  { id: 'bm', name: 'Bamanankan' },
  { id: 'bs', name: 'Bosanski' },
  { id: 'de', name: 'Deutsch' },
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
  { id: 'ff', name: 'Fulfulde' },
  { id: 'ha', name: 'Hausa' },
  { id: 'sw', name: 'Kiswahili' },
  { id: 'om', name: 'Oromoo' },
  { id: 'uz', name: 'Oʻzbekcha' },
  { id: 'pt', name: 'Português' },
  { id: 'sq', name: 'Shqip' },
  { id: 'so', name: 'Soomaali' },
  { id: 'tl', name: 'Tagalog' },
  { id: 'tr', name: 'Türkçe' },
  { id: 'ru', name: 'Русский' },
  { id: 'ur', name: 'اردو' },
  { id: 'ar', name: 'العربية' },
  { id: 'fa', name: 'فارسی' },
  { id: 'ps', name: 'پښتو' },
  { id: 'hi', name: 'हिन्दी' },
  { id: 'bn', name: 'বাংলা' },
  { id: 'ta', name: 'தமிழ்' },
  { id: 'ml', name: 'മലയാളം' },
  { id: 'th', name: 'ไทย' },
  { id: 'zh-Hans', name: '简体中文' },
  { id: 'zh-Hant', name: '繁體中文' },
];

const NAMES_BY_ID = Object.fromEntries(LANGUAGE_NAMES.map((entry) => [entry.id, entry.name])) as Record<
  LocaleId,
  string
>;

/** The locale's own name, exactly as its picker row reads it */
export const nativeLanguageName = (id: LocaleId): string => NAMES_BY_ID[id];
