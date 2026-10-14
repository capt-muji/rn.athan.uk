/**
 * The catalog-composed date labels (R6.1, R6.2): Gregorian and Hijri labels
 * compose from the active catalog's calendar keys in the English shape and
 * order, no era in any locale, and each locale's own digits
 */

import { format } from 'date-fns';

import { PRAYER_TIMEZONE } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';
import { formatDateLocalized, formatHijriDateLocalized, getDayAnchor } from '@/shared/time';

/** The date-fns output en must stay byte-identical to, computed independently of the app's formatter */
const gregorianOracle = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  return format(new Date(year, month - 1, day, 12), 'EEE, d MMM yyyy');
};

/** The Hijri label en must stay byte-identical to: today's Intl long-month output, era stripped */
const hijriOracle = (date: string): string =>
  new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: PRAYER_TIMEZONE,
  })
    .format(getDayAnchor(date))
    .replace(/ AH$/, '');

/** Every calendar day of 2026, which is not a leap year */
const EVERY_DAY_OF_2026 = Array.from({ length: 365 }, (_, index) => {
  const day = new Date(2026, 0, 1 + index);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
});

/** Ten fixtures spanning the Hijri year, with Ramadan 1st and Dhuʻl-Hijjah 10th among them */
const HIJRI_FIXTURES = [
  '2026-01-01', // Rajab 12, 1447
  '2026-02-19', // Ramadan 2, 1447
  '2026-03-20', // Shawwal 1, 1447
  '2026-04-14', // Shawwal 26, 1447
  '2026-05-26', // Dhuʻl-Hijjah 9, 1447
  '2026-05-27', // Dhuʻl-Hijjah 10, 1447
  '2026-06-15', // Dhuʻl-Hijjah 29, 1447
  '2026-08-29', // Rabiʻ I 16, 1448
  '2026-10-11', // Rabiʻ II 30, 1448
  '2027-02-08', // Ramadan 1, 1448
] as const;

afterEach(() => {
  setActiveLocale('en');
});

describe('formatDateLocalized', () => {
  it('matches the date-fns English output byte for byte for every day of 2026', () => {
    for (const day of EVERY_DAY_OF_2026) {
      expect(formatDateLocalized(day)).toBe(gregorianOracle(day));
    }
  });

  it('composes the label from the ar calendar keys with Arabic-Indic digits', () => {
    setActiveLocale('ar');
    expect(formatDateLocalized('2026-10-11')).toBe('الأحد, ١١ أكتوبر ٢٠٢٦');
  });
});

describe('formatHijriDateLocalized', () => {
  it('matches today’s English Hijri output for ten fixture dates, with no AH suffix', () => {
    for (const day of HIJRI_FIXTURES) {
      expect(formatHijriDateLocalized(day)).toBe(hijriOracle(day));
    }
  });

  it('draws the Thai catalog month with Latin digits and no era under th', () => {
    setActiveLocale('th');
    // 2026-10-11 is Rabiʻ II 30, 1448; the Thai catalog names that month รอบี II
    expect(formatHijriDateLocalized('2026-10-11')).toBe('รอบี II 30, 1448');
    expect(formatHijriDateLocalized('2026-10-11')).not.toMatch(/[๐-๙]/);
  });

  it('draws the ar catalog month with Arabic-Indic digits and no era under ar', () => {
    setActiveLocale('ar');
    // 2026-10-11 is Rabiʻ II 30, 1448; the ar catalog names that month ربيع الآخر
    expect(formatHijriDateLocalized('2026-10-11')).toBe('ربيع الآخر ٣٠, ١٤٤٨');
  });

  it('falls back to the localized Gregorian label when the Hijri conversion throws', () => {
    // The trailing space breaks the ISO parse (so getDayAnchor throws) but not
    // the field split, so the Gregorian fallback still composes
    expect(formatHijriDateLocalized('2026-03-05 ')).toBe('Thu, 5 Mar 2026');
  });
});
