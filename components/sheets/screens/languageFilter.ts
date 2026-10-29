/**
 * The picker's name search (T-451): a query folds case, diacritics and the
 * apostrophe family, and a row matches when the folded query sits inside its
 * endonym or its English name. The locale tag is never read, so a catalog's tag
 * cannot make a row match a string no person types.
 */

import type { LocaleId } from '@/shared/i18n/locale';
import { LANGUAGE_NAMES } from '@/shared/languageNames';

/** The combining-mark blocks NFD hands back: a base letter plus one of these folds to the base */
const COMBINING_MARKS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;

/** The apostrophe family the endonyms use (Oʻzbekcha carries the turned comma), dropped whole */
const APOSTROPHES = /[\u02bb\u02bc\u2019']/g;

export const foldForSearch = (value: string): string =>
  value.normalize('NFD').replace(COMBINING_MARKS, '').replace(APOSTROPHES, '').toLowerCase();

export interface LanguageRow {
  id: LocaleId;
  name: string;
  english: string;
}

/** The rows a query keeps, in the picker's own codepoint order */
export const filterLanguages = (query: string): readonly LanguageRow[] => {
  const folded = foldForSearch(query.trim());
  if (folded === '') return LANGUAGE_NAMES;
  return LANGUAGE_NAMES.filter(
    (entry) => foldForSearch(entry.name).includes(folded) || foldForSearch(entry.english).includes(folded)
  );
};
