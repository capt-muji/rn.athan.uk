/**
 * The fasting preferences and the store's day gate.
 *
 * getFastingSettings sanitizes what MMKV holds; fastingDayGate turns the
 * settings into the plan's day gate, memoised per settings snapshot so a
 * pass resolves the Dawood cycle once. The days sit in April 2026, after
 * Ramadan 1447: its white days fall on the 1st to the 3rd, the 2nd is a
 * Thursday, the 6th a Monday, and suhoor reads 05:30.
 */

import { getDefaultStore } from 'jotai';

import { london } from '@/hooks/__tests__/londonDays';
import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { ScheduleType } from '@/shared/types';
import {
  fastingDawoodAnchorAtom,
  fastingDayGate,
  fastingModeAtom,
  fastingWhiteDaysAtom,
  getFastingSettings,
} from '@/stores/notifications';
import { __installTimetableDays, __resetTimetableForTest } from '@/stores/timetable';

const TIMES = { fajr: '05:50', sunrise: '07:30', dhuhr: '13:00', asr: '16:00', magrib: '19:00', isha: '20:30' };

const store = getDefaultStore();

/** Six days from 2026-04-01, the third carrying no published Fajr at all */
const installDays = () => {
  __installTimetableDays(
    Array.from({ length: 6 }, (_, i) => {
      const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      const times = date === '2026-04-03' ? { ...TIMES, fajr: null } : TIMES;
      return minutesToRecord(date, toDayMinutes(times));
    })
  );
};

beforeEach(() => {
  jest.useFakeTimers({ now: london('2026-03-31', '09:00') });
  installDays();

  store.set(fastingModeAtom, 'everyDay');
  store.set(fastingWhiteDaysAtom, false);
  store.set(fastingDawoodAnchorAtom, 0);
});

afterEach(() => {
  jest.useRealTimers();
  __resetTimetableForTest();
});

describe('getFastingSettings', () => {
  it('reads the stored settings', () => {
    store.set(fastingModeAtom, 'muhammad');
    store.set(fastingWhiteDaysAtom, true);
    store.set(fastingDawoodAnchorAtom, 123);

    expect(getFastingSettings()).toEqual({ mode: 'muhammad', whiteDaysAddOn: true, dawoodAnchorMs: 123 });
  });

  it('sanitizes a stored mode that names no mode', () => {
    store.set(fastingModeAtom, 'nonsense');
    expect(getFastingSettings().mode).toBe('everyDay');
  });
});

describe('fastingDayGate', () => {
  it('passes every row under the default everyDay mode', () => {
    const gate = fastingDayGate();

    expect(gate(ScheduleType.Standard, 'fajr', '2026-04-01')).toBe(true);
    expect(gate(ScheduleType.Extra, 'midnight', '2026-04-01')).toBe(true);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(true);
  });

  it('arms only Mondays and Thursdays under muhammad', () => {
    store.set(fastingModeAtom, 'muhammad');
    const gate = fastingDayGate();

    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(false);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-02')).toBe(true);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-06')).toBe(true);
  });

  it('arms the white days alone under whiteDays', () => {
    store.set(fastingModeAtom, 'whiteDays');
    const gate = fastingDayGate();

    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(true);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-04')).toBe(false);
  });

  it('stacks the white-days add-on on muhammad', () => {
    store.set(fastingModeAtom, 'muhammad');
    store.set(fastingWhiteDaysAtom, true);
    const gate = fastingDayGate();

    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(true);
  });

  it('alternates from the stored anchor under dawood, passing over a day with no row', () => {
    store.set(fastingModeAtom, 'dawood');
    // 15:00 sits after that day's 05:30 suhoor, and the 3rd has no suhoor row
    // at all, so the search passes over both and starts the cycle on the 4th
    store.set(fastingDawoodAnchorAtom, london('2026-04-02', '15:00').getTime());
    const gate = fastingDayGate();

    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(false);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-03')).toBe(false);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-04')).toBe(true);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-05')).toBe(false);
    expect(gate(ScheduleType.Extra, 'suhoor', '2026-04-06')).toBe(true);
  });

  it('returns the same reader while the settings hold', () => {
    expect(fastingDayGate()).toBe(fastingDayGate());
  });

  it('builds a fresh reader when the settings change', () => {
    const before = fastingDayGate();
    store.set(fastingModeAtom, 'muhammad');
    const after = fastingDayGate();

    expect(after).not.toBe(before);
    expect(before(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(true);
    expect(after(ScheduleType.Extra, 'suhoor', '2026-04-01')).toBe(false);
  });
});
