/**
 * The digit edge of the native-surface goal (D54, D57): ar renders Eastern
 * Arabic-Indic digits everywhere a user sees a number; every other locale
 * keeps Latin bytes. Only the ten digit glyphs map: colons, spaces and
 * punctuation stay ASCII, and stored keys, log lines and API traffic never
 * pass through here.
 */

import { currentLocaleId } from './locale';

/** The ten Eastern Arabic-Indic digit glyphs, keyed by the Latin digit they replace */
export const ARABIC_INDIC: Readonly<Record<string, string>> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

/** Maps a string's Latin digits to Eastern Arabic-Indic glyphs under ar, identity in every other locale */
export const localiseDigits = (value: string): string => {
  const mapped = value.replace(/[0-9]/g, (digit) => ARABIC_INDIC[digit]);
  return currentLocaleId() === 'ar' ? mapped : value;
};
