/**
 * isRamadan in shared/time.ts when the engine's Intl cannot give the Islamic calendar
 *
 * The season is read at render time (the icon variant, the decorations and the settings toggle), so
 * an engine whose Intl rejects the islamic-umalqura calendar must leave the season off rather than
 * throw into a render. Jest's Intl always supports it, so the failure is simulated.
 */

import { isRamadan } from '../time';

/**
 * Instants inside the season, including 00:30 and 23:59:41 BST in Ramadan 1445 (Umm al-Qura: 11 March
 * to 9 April 2024, BST from 31 March). Only in-season instants can show a failure being swallowed: out
 * of season, false is the answer whether or not the failure reaches the code.
 */
const IN_SEASON = [
  { label: 'Ramadan 1447, GMT', iso: '2026-03-10T12:00:00Z' },
  { label: "the pre-Ramadan window in Sha'ban 1447", iso: '2026-02-15T12:00:00Z' },
  { label: '00:30 BST on 5 April 2024, Ramadan 1445', iso: '2024-04-04T23:30:00Z' },
  { label: '23:59:41 BST on 4 April 2024, Ramadan 1445', iso: '2024-04-04T22:59:41Z' },
];

const CONTROLS = [
  ...IN_SEASON.map((instant) => ({ ...instant, inSeason: true })),
  { label: 'June 2026, out of season', iso: '2026-06-15T12:00:00Z', inSeason: false },
];

const RealDateTimeFormat = Intl.DateTimeFormat;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('isRamadan with a working Intl (control)', () => {
  it.each(CONTROLS)('reads $label as inSeason=$inSeason', ({ iso, inSeason }) => {
    jest.setSystemTime(new Date(iso));

    expect(isRamadan()).toBe(inSeason);
  });
});

describe('isRamadan when Intl fails', () => {
  it.each(IN_SEASON)('is false, without throwing, at $label when the calendar is rejected', ({ iso }) => {
    jest.setSystemTime(new Date(iso));
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new RangeError('Invalid calendar: islamic-umalqura');
    });

    expect(isRamadan()).toBe(false);
  });

  it.each(IN_SEASON)('is false, without throwing, at $label when formatting fails', ({ iso }) => {
    jest.setSystemTime(new Date(iso));
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((locales, options) => {
      const formatter = new RealDateTimeFormat(locales, options);
      // format is a getter on the prototype, so a plain assignment throws instead of replacing it
      Object.defineProperty(formatter, 'format', {
        value: () => {
          throw new TypeError('format is not supported');
        },
      });
      return formatter;
    });

    expect(isRamadan()).toBe(false);
  });
});
