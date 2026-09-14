/**
 * The alarm window either side of 00:00 on London's 18 October 2026, where list 18's Midnight is at exactly 00:00:00
 *
 * Nothing reschedules because the clock reaches 00:00: the window a reschedule arms is counted from London's date
 * when it runs, and the next one moves it by one list day. Every expected trigger and identifier was worked out
 * separately, from zoneinfo and the scheduling rules, not by the app's time helpers.
 */

jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: jest.fn(async () => undefined),
}));

jest.mock('@/stores/sync', () => ({
  sync: jest.fn(async () => undefined),
  getArmedDayChanges: jest.fn(() => 0),
}));

import { ScheduleType } from '@/shared/types';
import { startCountdowns } from '@/stores/countdown';
import { rescheduleAllNotifications } from '@/stores/notifications';
import { getNextPrayer, setSequence } from '@/stores/schedule';

import {
  cancelCalls,
  enable,
  forgetCalls,
  londonDays,
  osIdentifiers,
  resetAlarms,
  storeDays,
  triggers,
} from './alarmHarness';

describe('the alarm window either side of 00:00 on 18 October 2026', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetAlarms();
    storeDays(londonDays('2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'));
    enable(ScheduleType.Standard, 'Fajr');
    enable(ScheduleType.Extra, 'Midnight');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('moves every window by exactly one list day between a reschedule at 23:59:30 and one at 00:00:30', async () => {
    jest.setSystemTime(new Date('2026-10-17T22:59:30.000Z'));

    await rescheduleAllNotifications();

    expect(triggers()).toEqual({
      'athan_extra_midnight_2026-10-18': '2026-10-17T23:00:00.000Z',
      'athan_extra_midnight_2026-10-19': '2026-10-18T22:59:00.000Z',
      'athan_standard_fajr_2026-10-18': '2026-10-18T04:54:00.000Z',
    });

    forgetCalls();
    jest.setSystemTime(new Date('2026-10-17T23:00:30.000Z'));

    await rescheduleAllNotifications();

    expect(triggers()).toEqual({
      'athan_extra_midnight_2026-10-19': '2026-10-18T22:59:00.000Z',
      'athan_extra_midnight_2026-10-20': '2026-10-19T22:59:00.000Z',
      'athan_standard_fajr_2026-10-18': '2026-10-18T04:54:00.000Z',
      'athan_standard_fajr_2026-10-19': '2026-10-19T04:55:00.000Z',
    });
    // List 18's Midnight fired 30 seconds ago, so it is not re-attempted and its identifier is cancelled; list 17, the
    // day that left the window, was never armed
    expect(cancelCalls()).toEqual(['athan_extra_midnight_2026-10-18']);
    expect(osIdentifiers()).toEqual(Object.keys(triggers()).sort());
  });

  it('arms and cancels nothing by itself when the clock crosses 00:00:00 with the app running', async () => {
    jest.setSystemTime(new Date('2026-10-17T22:59:58.000Z'));
    await rescheduleAllNotifications();
    const armed = osIdentifiers();

    setSequence(ScheduleType.Standard, new Date());
    setSequence(ScheduleType.Extra, new Date());
    expect(getNextPrayer(ScheduleType.Extra)).toMatchObject({
      english: 'Midnight',
      belongsToDate: '2026-10-18',
      datetime: new Date('2026-10-17T23:00:00.000Z'),
    });
    forgetCalls();

    startCountdowns();
    await jest.advanceTimersByTimeAsync(4000);

    // The ticker really crossed that Midnight: the Extras list moved on to its Last Third
    expect(new Date().toISOString()).toBe('2026-10-17T23:00:02.000Z');
    expect(getNextPrayer(ScheduleType.Extra)).toMatchObject({
      english: 'Last Third',
      belongsToDate: '2026-10-18',
      datetime: new Date('2026-10-18T00:58:00.000Z'),
    });
    expect(triggers()).toEqual({});
    expect(cancelCalls()).toEqual([]);
    expect(osIdentifiers()).toEqual(armed);
  });
});
