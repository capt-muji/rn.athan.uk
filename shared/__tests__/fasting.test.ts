/**
 * Unit tests for shared/fasting.ts
 *
 * The fasting-day predicate: which calendar days carry a Sahur alert, and why.
 * - hijriPartsFor() - the ICU islamic-umalqura read, adjusted and memoized
 * - isWhiteDay() / isRamadanDay() - the Hijri designations
 * - isMuhammadDay() - the weekday designation
 * - dawoodCycleFor() / isDawoodDay() - the alternate-day cycle from an anchor
 * - fastingEvaluator() - one day's verdict under a settings snapshot
 * - dawoodActivates() - the two transitions that (re)start a Dawood cycle
 * - upcomingFastingDays() - the sheet preview's data
 *
 * Everything is injected: no test reads the real clock or the store. The Hijri
 * pins below are ICU's own islamic-umalqura data (the engine the app ships for
 * its Hijri date display), cross-checked against published tables: sources
 * place 1 Ramadan 1447 on 18 or 19 February 2026 (the calculated-to-sighted
 * spread the adjustment setting exists for; Islamic Relief's table names the
 * evening of the 18th) and 1 Ramadan 1451 on 5 January 2030 (the widely
 * published double-Ramadan year). On divergence the pin records ICU's value
 * with a note, because ICU is the shipped source and the adjustment setting is
 * the user's remedy.
 */

import type { FastingSettings, SuhoorInstantFor } from '@/shared/fasting';
import {
  DEFAULT_FASTING_MODE,
  dawoodActivates,
  dawoodCycleFor,
  fastingEvaluator,
  hijriPartsFor,
  isDawoodDay,
  isMuhammadDay,
  isRamadanDay,
  isWhiteDay,
  upcomingFastingDays,
  validFastingMode,
  validHijriAdjustment,
} from '@/shared/fasting';

/** A fixed suhoor wall time (05:30Z) so every cycle test owns its instants */
const suhoorAtHalfFive: SuhoorInstantFor = (date) => new Date(Date.parse(`${date}T05:30:00Z`));

const settings = (over: Partial<FastingSettings> = {}): FastingSettings => ({
  mode: DEFAULT_FASTING_MODE,
  whiteDaysAddOn: false,
  hijriAdjustment: 0,
  dawoodAnchorMs: 0,
  ...over,
});

describe('hijriPartsFor', () => {
  it('pins ICU umalqura against the published calendar: 1 Ramadan 1447 is 18 February 2026', () => {
    expect(hijriPartsFor('2026-02-18', 0)).toEqual({ month: 9, day: 1 });
  });

  it('pins the white days of Ramadan 1447: 13th to 15th fall on 2 to 4 March 2026', () => {
    expect(hijriPartsFor('2026-03-02', 0)).toEqual({ month: 9, day: 13 });
    expect(hijriPartsFor('2026-03-03', 0)).toEqual({ month: 9, day: 14 });
    expect(hijriPartsFor('2026-03-04', 0)).toEqual({ month: 9, day: 15 });
  });

  it('pins a date near the far end of the timetable span', () => {
    expect(hijriPartsFor('2076-10-06', 0)).toEqual({ month: 11, day: 8 });
  });

  it('shifts the conversion by the adjustment: +1 reads the next Gregorian day', () => {
    expect(hijriPartsFor('2026-03-02', 1)).toEqual(hijriPartsFor('2026-03-03', 0));
    expect(hijriPartsFor('2026-03-02', -1)).toEqual(hijriPartsFor('2026-03-01', 0));
  });

  it('returns the same value on a repeated call (the memo holds)', () => {
    expect(hijriPartsFor('2026-02-18', 0)).toEqual({ month: 9, day: 1 });
    expect(hijriPartsFor('2026-02-18', 0)).toEqual({ month: 9, day: 1 });
  });

  it('returns null when the formatter throws', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementation(() => {
      throw new Error('no calendar support');
    });
    expect(hijriPartsFor('2044-06-01', 0)).toBeNull();
    spy.mockRestore();
    expect(hijriPartsFor('2044-06-02', 0)).not.toBeNull();
  });

  it('returns null when the parts carry no readable month', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementationOnce(
      () =>
        ({
          formatToParts: () => [{ type: 'day', value: '13' }],
        }) as unknown as Intl.DateTimeFormat
    );
    expect(hijriPartsFor('2044-06-03', 0)).toBeNull();
    spy.mockRestore();
  });
});

describe('isWhiteDay', () => {
  it('arms the 13th, 14th and 15th of a Hijri month', () => {
    expect(isWhiteDay('2026-03-02', 0)).toBe(true);
    expect(isWhiteDay('2026-03-03', 0)).toBe(true);
    expect(isWhiteDay('2026-03-04', 0)).toBe(true);
  });

  it('does not arm the days around them', () => {
    expect(isWhiteDay('2026-03-01', 0)).toBe(false);
    expect(isWhiteDay('2026-03-05', 0)).toBe(false);
  });

  it('arms the white days of a far month in the span', () => {
    expect(isWhiteDay('2076-10-11', 0)).toBe(true);
    expect(isWhiteDay('2076-10-12', 0)).toBe(true);
    expect(isWhiteDay('2076-10-13', 0)).toBe(true);
    expect(isWhiteDay('2076-10-14', 0)).toBe(false);
  });

  it('follows the adjustment: +1 arms the Gregorian day before a white day', () => {
    expect(isWhiteDay('2026-03-01', 1)).toBe(true);
    expect(isWhiteDay('2026-03-04', 1)).toBe(false);
  });
});

describe('isRamadanDay', () => {
  it('covers the whole published Ramadan 1447 span', () => {
    expect(isRamadanDay('2026-02-18', 0)).toBe(true);
    expect(isRamadanDay('2026-03-19', 0)).toBe(true);
  });

  it('excludes the day before and the day after', () => {
    expect(isRamadanDay('2026-02-17', 0)).toBe(false);
    expect(isRamadanDay('2026-03-20', 0)).toBe(false);
  });

  it('pins the far span: 1 Ramadan 1451 is 5 January 2030', () => {
    expect(isRamadanDay('2030-01-05', 0)).toBe(true);
  });
});

describe('isMuhammadDay', () => {
  it('arms Monday (2026-01-05) and Thursday (2026-01-08)', () => {
    expect(isMuhammadDay('2026-01-05')).toBe(true);
    expect(isMuhammadDay('2026-01-08')).toBe(true);
  });

  it('arms no other weekday that week', () => {
    expect(isMuhammadDay('2026-01-06')).toBe(false);
    expect(isMuhammadDay('2026-01-07')).toBe(false);
    expect(isMuhammadDay('2026-01-09')).toBe(false);
    expect(isMuhammadDay('2026-01-10')).toBe(false);
    expect(isMuhammadDay('2026-01-11')).toBe(false);
  });
});

describe('dawoodCycleFor', () => {
  it("starts on the next day when the anchor day's suhoor has passed", () => {
    const anchor = Date.parse('2026-03-09T15:00:00Z');
    expect(dawoodCycleFor(anchor, suhoorAtHalfFive).firstOnDay).toBe('2026-03-10');
  });

  it('starts on the anchor day itself while its suhoor is still ahead', () => {
    const anchor = Date.parse('2026-03-10T04:00:00Z');
    expect(dawoodCycleFor(anchor, suhoorAtHalfFive).firstOnDay).toBe('2026-03-10');
  });

  it('needs the trigger strictly ahead: the suhoor instant itself is already gone', () => {
    const anchor = Date.parse('2026-03-10T05:30:00Z');
    expect(dawoodCycleFor(anchor, suhoorAtHalfFive).firstOnDay).toBe('2026-03-11');
  });

  it('passes over a day with no readable row', () => {
    const anchor = Date.parse('2026-03-09T15:00:00Z');
    const skippingOne: SuhoorInstantFor = (date) => (date === '2026-03-10' ? null : suhoorAtHalfFive(date));
    expect(dawoodCycleFor(anchor, skippingOne).firstOnDay).toBe('2026-03-11');
  });

  it('returns no cycle for a never-anchored settings value', () => {
    expect(dawoodCycleFor(0, suhoorAtHalfFive).firstOnDay).toBeNull();
  });

  it('gives up when no day in the search window has a trigger ahead', () => {
    const neverReadable: SuhoorInstantFor = () => null;
    expect(dawoodCycleFor(Date.parse('2026-03-09T15:00:00Z'), neverReadable).firstOnDay).toBeNull();
  });
});

describe('isDawoodDay', () => {
  const anchor = Date.parse('2026-03-09T15:00:00Z');
  const cycle = dawoodCycleFor(anchor, suhoorAtHalfFive);

  it('arms every second day from the first on day', () => {
    expect(isDawoodDay('2026-03-10', cycle)).toBe(true);
    expect(isDawoodDay('2026-03-11', cycle)).toBe(false);
    expect(isDawoodDay('2026-03-12', cycle)).toBe(true);
    expect(isDawoodDay('2026-03-13', cycle)).toBe(false);
    expect(isDawoodDay('2026-03-14', cycle)).toBe(true);
  });

  it('arms nothing before the cycle began', () => {
    expect(isDawoodDay('2026-03-09', cycle)).toBe(false);
    expect(isDawoodDay('2026-02-20', cycle)).toBe(false);
  });

  it('arms nothing without a cycle', () => {
    expect(isDawoodDay('2026-03-10', { firstOnDay: null })).toBe(false);
  });
});

describe('fastingEvaluator', () => {
  it('arms every day under everyDay, with no designations', () => {
    const verdict = fastingEvaluator(settings({ mode: 'everyDay' }), suhoorAtHalfFive);
    expect(verdict('2026-01-06')).toEqual({ arms: true, designations: [] });
    expect(verdict('2026-01-07')).toEqual({ arms: true, designations: [] });
  });

  it('arms Mondays and Thursdays only under muhammad', () => {
    const verdict = fastingEvaluator(settings({ mode: 'muhammad' }), suhoorAtHalfFive);
    expect(verdict('2026-01-05')).toEqual({ arms: true, designations: ['muhammad'] });
    expect(verdict('2026-01-06')).toEqual({ arms: false, designations: [] });
  });

  it('stacks the white-days add-on on muhammad', () => {
    const verdict = fastingEvaluator(settings({ mode: 'muhammad', whiteDaysAddOn: true }), suhoorAtHalfFive);
    expect(verdict('2026-04-01')).toEqual({ arms: true, designations: ['whiteDay'] });
  });

  it('ignores the add-on under everyDay and whiteDays', () => {
    const every = fastingEvaluator(settings({ mode: 'everyDay', whiteDaysAddOn: true }), suhoorAtHalfFive);
    expect(every('2026-04-01')).toEqual({ arms: true, designations: [] });
    const white = fastingEvaluator(settings({ mode: 'whiteDays', whiteDaysAddOn: true }), suhoorAtHalfFive);
    expect(white('2026-03-31')).toEqual({ arms: false, designations: [] });
  });

  it('arms the white days alone under whiteDays', () => {
    const verdict = fastingEvaluator(settings({ mode: 'whiteDays' }), suhoorAtHalfFive);
    expect(verdict('2026-04-01')).toEqual({ arms: true, designations: ['whiteDay'] });
    expect(verdict('2026-04-04')).toEqual({ arms: false, designations: [] });
  });

  it('stacks designations on a coinciding day', () => {
    // 2026-04-02 is a Thursday and a white day (10/14): the muhammad regimen
    // arms it as both, and the dawood cycle arms it as both from an anchor
    // whose first on day is the 2nd
    const muhammad = fastingEvaluator(settings({ mode: 'muhammad', whiteDaysAddOn: true }), suhoorAtHalfFive);
    expect(muhammad('2026-04-02')).toEqual({ arms: true, designations: ['muhammad', 'whiteDay'] });

    const anchor = Date.parse('2026-04-01T15:00:00Z');
    const dawood = fastingEvaluator(
      settings({ mode: 'dawood', whiteDaysAddOn: true, dawoodAnchorMs: anchor }),
      suhoorAtHalfFive
    );
    expect(dawood('2026-04-02')).toEqual({ arms: true, designations: ['dawood', 'whiteDay'] });
  });

  it('arms every day of Ramadan under any mode, badged ramadan alone', () => {
    const white = fastingEvaluator(settings({ mode: 'whiteDays' }), suhoorAtHalfFive);
    expect(white('2026-02-19')).toEqual({ arms: true, designations: ['ramadan'] });
    const muhammad = fastingEvaluator(settings({ mode: 'muhammad' }), suhoorAtHalfFive);
    expect(muhammad('2026-03-02')).toEqual({ arms: true, designations: ['ramadan'] });
  });

  it('follows the adjustment inside the Ramadan override', () => {
    const later = fastingEvaluator(settings({ mode: 'whiteDays', hijriAdjustment: 1 }), suhoorAtHalfFive);
    // 2026-02-17 reads as Ramadan only when the conversion shifts a day later
    expect(later('2026-02-17')).toEqual({ arms: true, designations: ['ramadan'] });
    const earlier = fastingEvaluator(settings({ mode: 'whiteDays', hijriAdjustment: -1 }), suhoorAtHalfFive);
    // 2026-03-20 reads as Ramadan only when the conversion shifts a day earlier
    expect(earlier('2026-03-20')).toEqual({ arms: true, designations: ['ramadan'] });
  });

  it('still arms weekday and cycle days when the Hijri read fails', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementation(() => {
      throw new Error('no calendar support');
    });
    // Fresh dates, never converted before the spy, so the failure path runs
    const verdict = fastingEvaluator(settings({ mode: 'muhammad' }), suhoorAtHalfFive);
    expect(verdict('2027-01-04')).toEqual({ arms: true, designations: ['muhammad'] });
    const white = fastingEvaluator(settings({ mode: 'whiteDays' }), suhoorAtHalfFive);
    expect(white('2033-05-03')).toEqual({ arms: false, designations: [] });
    spy.mockRestore();
  });
});

describe('dawoodActivates', () => {
  it('activates when the bell comes on onto dawood', () => {
    expect(dawoodActivates({ bellOn: false, mode: 'dawood' }, { bellOn: true, mode: 'dawood' })).toBe(true);
  });

  it('activates when the mode switches to dawood while the bell is on', () => {
    expect(dawoodActivates({ bellOn: true, mode: 'muhammad' }, { bellOn: true, mode: 'dawood' })).toBe(true);
  });

  it('does not activate again while dawood stays active', () => {
    expect(dawoodActivates({ bellOn: true, mode: 'dawood' }, { bellOn: true, mode: 'dawood' })).toBe(false);
  });

  it('does not activate for the bell or the mode alone', () => {
    expect(dawoodActivates({ bellOn: false, mode: 'muhammad' }, { bellOn: true, mode: 'muhammad' })).toBe(false);
    expect(dawoodActivates({ bellOn: false, mode: 'dawood' }, { bellOn: false, mode: 'dawood' })).toBe(false);
    expect(dawoodActivates({ bellOn: true, mode: 'muhammad' }, { bellOn: true, mode: 'whiteDays' })).toBe(false);
  });
});

describe('the storage validators', () => {
  it('keeps a valid mode and falls back to the default', () => {
    expect(validFastingMode('dawood')).toBe('dawood');
    expect(validFastingMode('everyDay')).toBe('everyDay');
    expect(validFastingMode('nonsense')).toBe(DEFAULT_FASTING_MODE);
    expect(validFastingMode('')).toBe(DEFAULT_FASTING_MODE);
  });

  it('keeps an adjustment in range and falls back to zero', () => {
    expect(validHijriAdjustment(2)).toBe(2);
    expect(validHijriAdjustment(-2)).toBe(-2);
    expect(validHijriAdjustment(0)).toBe(0);
    expect(validHijriAdjustment(3)).toBe(0);
    expect(validHijriAdjustment(-3)).toBe(0);
  });
});

describe('upcomingFastingDays', () => {
  it('walks Mondays and Thursdays under muhammad', () => {
    const days = upcomingFastingDays('2026-01-05', 3, settings({ mode: 'muhammad' }), suhoorAtHalfFive);
    expect(days.map((day) => day.date)).toEqual(['2026-01-05', '2026-01-08', '2026-01-12']);
  });

  it('walks consecutive days under everyDay', () => {
    const days = upcomingFastingDays('2026-01-05', 2, settings({ mode: 'everyDay' }), suhoorAtHalfFive);
    expect(days.map((day) => day.date)).toEqual(['2026-01-05', '2026-01-06']);
  });

  it('walks every day of Ramadan regardless of mode', () => {
    const days = upcomingFastingDays('2026-02-18', 3, settings({ mode: 'whiteDays' }), suhoorAtHalfFive);
    expect(days.map((day) => day.date)).toEqual(['2026-02-18', '2026-02-19', '2026-02-20']);
    expect(days[0].verdict.designations).toEqual(['ramadan']);
  });

  it("stops at the month's white days under whiteDays", () => {
    const days = upcomingFastingDays('2076-10-10', 3, settings({ mode: 'whiteDays' }), suhoorAtHalfFive);
    expect(days.map((day) => day.date)).toEqual(['2076-10-11', '2076-10-12', '2076-10-13']);
  });
});
