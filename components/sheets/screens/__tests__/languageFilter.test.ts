/**
 * The picker's name search (T-451): a query folds case, diacritics and the
 * apostrophe family, and a row matches on its endonym or its English name. The
 * locale tag never matches, because the catalogs the waves add carry tags a
 * reader never types.
 */

import { LANGUAGE_NAMES } from '@/shared/languageNames';

import { filterLanguages, foldForSearch } from '../languageFilter';

const ids = (query: string) => filterLanguages(query).map((entry) => entry.id);

describe('the search fold', () => {
  it('drops case and the combining marks NFD separates', () => {
    expect(foldForSearch('Español')).toBe('espanol');
    expect(foldForSearch('Türkçe')).toBe('turkce');
    expect(foldForSearch('Yorùbá')).toBe('yoruba');
    expect(foldForSearch('ESPAÑOL')).toBe('espanol');
  });

  it('folds Madurese’s ḍ and â to plain Latin (T-454)', () => {
    // The picker must find the Madurese row whether a reader types the
    // precomposed letters or the plain keys: NFD separates ḍ into d plus the
    // dot below, and â into a plus the circumflex, and the fold drops both
    expect(foldForSearch('Madhurâ')).toBe('madhura');
    expect(foldForSearch('bâ\u1e0dâ')).toBe('bada');
  });

  it('drops the apostrophe family NFD cannot reach', () => {
    expect(foldForSearch('Oʻzbekcha')).toBe('ozbekcha');
    expect(foldForSearch('O\u02bczbekcha')).toBe('ozbekcha');
    expect(foldForSearch("O'zbekcha")).toBe('ozbekcha');
  });

  it('leaves a script with no diacritics alone but for its case', () => {
    expect(foldForSearch('Қазақша')).toBe('қазақша');
  });
});

describe('the filtered list', () => {
  it('returns the whole picker untouched for an empty or blank query', () => {
    expect(filterLanguages('')).toEqual(LANGUAGE_NAMES);
    expect(filterLanguages('   ')).toEqual(LANGUAGE_NAMES);
  });

  it('matches the endonym with its own diacritics typed or dropped', () => {
    expect(ids('espanol')).toEqual(['es']);
    expect(ids('Español')).toEqual(['es']);
  });

  it('matches the English name a reader who knows only the gloss types', () => {
    expect(ids('spanish')).toEqual(['es']);
    expect(ids('arabic')).toEqual(['ar']);
  });

  it('matches the variant spellings speakers type at the gloss', () => {
    expect(ids('farsi')).toEqual(['fa']);
    expect(ids('bangla')).toEqual(['bn']);
    expect(ids('azeri')).toEqual(['az']);
    expect(ids('uighur')).toEqual(['ug']);
    expect(ids('pushto')).toEqual(['ps']);
    expect(ids('fulani')).toEqual(['ff']);
    expect(ids('pulaar')).toEqual(['ff']);
  });

  it('keeps the picker order across several matches', () => {
    const matched = ids('turk');
    expect(matched).toEqual(['tk', 'tr']);
    const positions = matched.map((id) => LANGUAGE_NAMES.findIndex((entry) => entry.id === id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('never matches the locale tag', () => {
    // Both tags carry a Latin run a reader could type, and neither name does
    expect(ids('zh-hans')).toEqual([]);
    expect(ids('zh-hant')).toEqual([]);
    expect(ids('pa-arab')).toEqual([]);
  });

  it('returns nothing for a query no name holds', () => {
    expect(ids('zzz')).toEqual([]);
  });
});
