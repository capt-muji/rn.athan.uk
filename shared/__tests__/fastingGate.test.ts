/**
 * The fasting day gate at the schedule plan's own collector
 *
 * The gate is the one seam the fasting modes act through: a gated-out day
 * never becomes a candidate row, so it arms nothing (at-time or reminder)
 * and spends none of the request budget. These tests pin that at the shared
 * plan level, with hand-built gates over the same predicates the store's
 * gate is built from; the store's own wiring is covered in
 * stores/__tests__/fastingSettings.test.ts.
 *
 * Fixtures sit in April 2026, after Ramadan 1447: its white days fall on the
 * 1st to the 3rd, the 2nd is a Thursday, the 6th a Monday.
 */

import { london } from '@/hooks/__tests__/londonDays';
import { NOTIFICATION_REQUEST_BUDGET } from '@/shared/constants';
import { isMuhammadDay, isWhiteDay } from '@/shared/fasting';
import {
  buildSchedulePlan,
  collectCandidateRows,
  type DayArmedReader,
  genScheduleDatesForPrayer,
  schedulePlanKey,
} from '@/shared/notifications';
import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { ScheduleType } from '@/shared/types';
import { __installTimetableDays, __resetTimetableForTest } from '@/stores/timetable';

const TIMES = { fajr: '05:50', sunrise: '07:30', dhuhr: '13:00', asr: '16:00', magrib: '19:00', isha: '20:30' };

/** Suhoor lands at 05:30, twenty minutes before Fajr */
const installDays = (count: number) => {
  const days = Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
    return minutesToRecord(date, toDayMinutes(TIMES));
  });
  __installTimetableDays(days);
};

const everyPrayerCostsOne = () => 1;

/** A gate that arms suhoor on exactly the days the predicate names */
const gateFor =
  (armed: (date: string) => boolean): DayArmedReader =>
  (scheduleType, id, date) =>
    scheduleType !== ScheduleType.Extra || id !== 'suhoor' || armed(date);

/** The plan's suhoor days under one gate */
const suhoorDays = (gate?: DayArmedReader): string[] =>
  genScheduleDatesForPrayer(ScheduleType.Extra, 'suhoor', everyPrayerCostsOne, gate);

/** What the plan's accepted rows cost together: the budget the phone holds */
const planCost = (gate?: DayArmedReader): number => {
  const rows = collectCandidateRows(everyPrayerCostsOne, gate);
  const plan = buildSchedulePlan(rows, NOTIFICATION_REQUEST_BUDGET);
  const armed = new Set<string>();
  for (const [key, dates] of plan) for (const date of dates) armed.add(`${key}@${date}`);

  return rows
    .filter((row) => armed.has(`${schedulePlanKey(row.scheduleType, row.id)}@${row.date}`))
    .reduce((sum, row) => sum + row.requestCost, 0);
};

beforeEach(() => {
  jest.useFakeTimers({ now: london('2026-03-31', '09:00') });
});

afterEach(() => {
  jest.useRealTimers();
  __resetTimetableForTest();
});

describe('the ungated plan', () => {
  it('arms suhoor on every installed day', () => {
    installDays(5);
    expect(suhoorDays()).toEqual(['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05']);
  });
});

describe('the muhammad gate', () => {
  it('arms suhoor only on Mondays and Thursdays', () => {
    installDays(6);
    expect(suhoorDays(gateFor(isMuhammadDay))).toEqual(['2026-04-02', '2026-04-06']);
  });
});

describe('the white-days gate', () => {
  it('arms suhoor on the 13th to the 15th of the Hijri month', () => {
    installDays(5);
    expect(suhoorDays(gateFor(isWhiteDay))).toEqual(['2026-04-01', '2026-04-02', '2026-04-03']);
  });
});

describe('the subset property', () => {
  it('a gated plan arms only suhoor days the ungated plan also arms', () => {
    installDays(80);

    const ungated = new Set(suhoorDays());
    for (const gate of [gateFor(isMuhammadDay), gateFor(isWhiteDay), gateFor(() => false)]) {
      for (const date of suhoorDays(gate)) expect(ungated.has(date)).toBe(true);
    }
  });

  it('never exceeds the request budget, gated or not', () => {
    installDays(80);

    expect(planCost()).toBeLessThanOrEqual(NOTIFICATION_REQUEST_BUDGET);
    expect(planCost()).toBeGreaterThan(0);
    expect(planCost(gateFor(isMuhammadDay))).toBeLessThanOrEqual(NOTIFICATION_REQUEST_BUDGET);
    expect(planCost(gateFor(isMuhammadDay))).toBeGreaterThan(0);
  });
});

describe('the other rows', () => {
  it('pass the gate untouched while suhoor is gated out', () => {
    installDays(5);
    const gated = gateFor(isMuhammadDay);

    expect(genScheduleDatesForPrayer(ScheduleType.Extra, 'midnight', everyPrayerCostsOne, gated)).toEqual(
      genScheduleDatesForPrayer(ScheduleType.Extra, 'midnight', everyPrayerCostsOne)
    );
    expect(genScheduleDatesForPrayer(ScheduleType.Standard, 'fajr', everyPrayerCostsOne, gated)).toEqual(
      genScheduleDatesForPrayer(ScheduleType.Standard, 'fajr', everyPrayerCostsOne)
    );
  });
});
