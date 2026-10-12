/**
 * The digit localiser (D54, D57): ar maps the ten Latin digit glyphs to
 * Eastern Arabic-Indic, every other locale keeps Latin bytes, and only the
 * digit glyphs map: the colon stays ASCII.
 */

import { ARABIC_INDIC, localiseDigits } from '@/shared/i18n/digits';
import { setActiveLocale } from '@/shared/i18n/locale';

afterEach(() => {
  setActiveLocale('en');
});

describe('ARABIC_INDIC', () => {
  it('maps exactly the ten Latin digit glyphs', () => {
    expect(Object.keys(ARABIC_INDIC)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(Object.values(ARABIC_INDIC)).toEqual(['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']);
  });
});

describe('localiseDigits', () => {
  it('maps every digit under ar and leaves the colon ASCII', () => {
    setActiveLocale('ar');
    expect(localiseDigits('05:44')).toBe('٠٥:٤٤');
  });

  it('is the identity under en, ms, so, hi and th', () => {
    for (const locale of ['en', 'ms', 'so', 'hi', 'th'] as const) {
      setActiveLocale(locale);
      expect(localiseDigits('05:44')).toBe('05:44');
    }
  });

  it('returns the empty string unchanged under ar', () => {
    setActiveLocale('ar');
    expect(localiseDigits('')).toBe('');
  });

  it('returns a string with no digits unchanged under ar', () => {
    setActiveLocale('ar');
    expect(localiseDigits('الآن')).toBe('الآن');
  });
});
