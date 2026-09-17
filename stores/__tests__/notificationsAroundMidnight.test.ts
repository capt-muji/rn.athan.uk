/**
 * Alarms for rows near 00:00, each armed at its own instant under the list day it belongs to
 *
 * High-latitude shapes, which London never has: a Standard row read either side of 00:00 and of 06:00, a Last Third
 * before and at 00:00, and a Fajr just after it.
 */

jest.mock('@/stores/widget', () => ({
  refreshPrayerWidgets: jest.fn(async () => undefined),
}));

jest.mock('@/stores/sync', () => ({
  sync: jest.fn(async () => undefined),
  getArmedDayChanges: jest.fn(() => 0),
}));

import * as Notifications from 'expo-notifications';

import { AlertType, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { rescheduleAllNotifications, setPrayerAlertType } from '@/stores/notifications';

import {
  cancelCalls,
  enable,
  forgetCalls,
  minutesBefore,
  osIdentifiers,
  resetAlarms,
  sameTimesOn,
  storeDays,
  type Times,
  triggers,
} from './alarmHarness';

beforeEach(() => {
  jest.useFakeTimers();
  resetAlarms();
});

afterEach(() => {
  jest.useRealTimers();
});

/** An occurrence's at-time trigger and its 5-minute reminder, or nothing when it is not expected to be armed */
const armedWithReminder = (scheduleType: ScheduleType, name: string, date: string, instant: string | null) =>
  instant === null
    ? {}
    : {
        [`athan_${scheduleType}_${name.toLowerCase()}_${date}`]: instant,
        [`reminder_${scheduleType}_${name.toLowerCase()}_${date}_5`]: minutesBefore(instant, 5),
      };

describe('a Standard row read either side of 00:00 and of 06:00', () => {
  // The Magrib shape puts sunset itself in the small hours, with Isha after it
  const SHAPES: Record<'Isha' | 'Magrib', (reading: string) => Times> = {
    Isha: (reading) => ['02:40', '04:43', '13:02', '17:20', '21:25', reading],
    Magrib: (reading) => ['01:30', '02:55', '13:30', '17:30', reading, '00:30'],
  };

  const READINGS: { reading: string; list20: string | null; list21: string }[] = [
    { reading: '23:59', list20: '2026-06-20T22:59:00.000Z', list21: '2026-06-21T22:59:00.000Z' },
    { reading: '00:00', list20: '2026-06-20T23:00:00.000Z', list21: '2026-06-21T23:00:00.000Z' },
    { reading: '00:01', list20: '2026-06-20T23:01:00.000Z', list21: '2026-06-21T23:01:00.000Z' },
    { reading: '05:59', list20: '2026-06-21T04:59:00.000Z', list21: '2026-06-22T04:59:00.000Z' },
    // 06:00 is its own date's morning, already past at 13:00 BST on 20 June
    { reading: '06:00', list20: null, list21: '2026-06-21T05:00:00.000Z' },
  ];

  it.each((['Isha', 'Magrib'] as const).flatMap((name) => READINGS.map((row) => ({ name, ...row }))))(
    'arms $name read as $reading under its own list day, at its real instant, with its reminder',
    async ({ name, reading, list20, list21 }) => {
      jest.setSystemTime(new Date('2026-06-20T12:00:00.000Z'));
      storeDays(sameTimesOn(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'], SHAPES[name](reading)));
      enable(ScheduleType.Standard, name, 5);

      await rescheduleAllNotifications();

      expect(triggers()).toEqual({
        ...armedWithReminder(ScheduleType.Standard, name, '2026-06-20', list20),
        ...armedWithReminder(ScheduleType.Standard, name, '2026-06-21', list21),
      });
    }
  );
});

describe('a Last Third before and at 00:00', () => {
  const SHAPES = [
    { when: 'at 23:00 BST, before 00:00', magrib: '17:00', fajr: '02:00', lastThird: '2026-06-20T22:00:00.000Z' },
    { when: 'at 00:00 BST', magrib: '18:00', fajr: '03:00', lastThird: '2026-06-20T23:00:00.000Z' },
  ];

  const storeShape = (magrib: string, fajr: string) =>
    storeDays({
      '2026-06-20': ['02:40', '04:43', '13:02', '15:00', magrib, '19:00'],
      '2026-06-21': [fajr, '04:43', '13:02', '15:00', '19:00', '20:00'],
    });

  it.each(SHAPES)('arms the 21 June list Last Third $when under that list day', async ({ magrib, fajr, lastThird }) => {
    jest.setSystemTime(new Date('2026-06-20T19:00:00.000Z'));
    // List 20's night is already over and 22 June is not stored, so only list 21 arms
    storeShape(magrib, fajr);
    enable(ScheduleType.Extra, 'Last Third', 5);

    await rescheduleAllNotifications();

    expect(triggers()).toEqual(armedWithReminder(ScheduleType.Extra, 'Last Third', '2026-06-21', lastThird));
  });

  it.each(SHAPES)(
    'from 20:00 BST on 19 June arms only list 21, never a 20 June list whose day before is not stored ($when)',
    async ({ magrib, fajr, lastThird }) => {
      jest.setSystemTime(new Date('2026-06-19T19:00:00.000Z'));
      // A night borrowed from 20 June's own Magrib would still be ahead here, so only refusing to borrow keeps list 20
      // unarmed
      storeShape(magrib, fajr);
      enable(ScheduleType.Extra, 'Last Third', 5);

      await rescheduleAllNotifications();

      expect(triggers()).toEqual(armedWithReminder(ScheduleType.Extra, 'Last Third', '2026-06-21', lastThird));
    }
  );
});

describe('a Fajr just after 00:00', () => {
  it.each([
    ['00:00', '2026-06-20T23:00:00.000Z'],
    ['00:10', '2026-06-20T23:10:00.000Z'],
    ['00:19', '2026-06-20T23:19:00.000Z'],
    ['00:20', '2026-06-20T23:20:00.000Z'],
  ])('arms a Fajr at %s for the 21 June list at %s, never shifted a day', async (fajr, instant) => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    // List 20's Fajr at 00:30 BST is already past
    storeDays({
      '2026-06-20': ['00:30', '02:55', '13:00', '17:30', '23:28', '23:52'],
      '2026-06-21': [fajr, '02:55', '13:00', '17:30', '23:30', '23:54'],
    });
    enable(ScheduleType.Standard, 'Fajr', 5);

    await rescheduleAllNotifications();

    expect(triggers()).toEqual(armedWithReminder(ScheduleType.Standard, 'Fajr', '2026-06-21', instant));
  });
});

describe("a reschedule between 00:00 and yesterday's still-due rows (finding 74, gap map item 6)", () => {
  // The alarm window starts from the earliest list day that still has a row due (owner, 2026-09-13),
  // so a reschedule after midnight re-attempts yesterday's post-midnight alarm instead of cancelling
  // it as stale. The window keeps its length: while yesterday is still due it is [yesterday, today]
  const ISHA_AT_0001: Times = ['02:40', '04:43', '13:02', '17:20', '21:25', '00:01'];
  const days = (shape: Times) => sameTimesOn(['2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'], shape);

  it("keeps yesterday's list Isha armed, re-attempted under its own identifier", async () => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    storeDays(days(ISHA_AT_0001));
    enable(ScheduleType.Standard, 'Isha', 5);

    await rescheduleAllNotifications();
    expect(osIdentifiers()).toEqual(
      [
        'athan_standard_isha_2026-06-20',
        'athan_standard_isha_2026-06-21',
        'reminder_standard_isha_2026-06-20_5',
        'reminder_standard_isha_2026-06-21_5',
      ].sort()
    );

    // 00:00:30 BST on the 21st: the 20th's Isha is 30 seconds away, its reminder already past
    jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
    forgetCalls();

    await rescheduleAllNotifications();

    expect(triggers()['athan_standard_isha_2026-06-20']).toBe('2026-06-20T23:01:00.000Z');
    // Only the reminder whose moment has passed is stale; the at-time is never passed to cancel
    expect(cancelCalls()).toEqual(['reminder_standard_isha_2026-06-20_5']);
    expect(osIdentifiers()).toEqual(
      ['athan_standard_isha_2026-06-20', 'athan_standard_isha_2026-06-21', 'reminder_standard_isha_2026-06-21_5'].sort()
    );
  });

  it('keeps a Magrib after midnight armed the same way', async () => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    storeDays(days(['01:30', '02:55', '13:30', '17:30', '00:01', '00:25']));
    enable(ScheduleType.Standard, 'Magrib', 5);

    await rescheduleAllNotifications();

    jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
    forgetCalls();

    await rescheduleAllNotifications();

    expect(triggers()['athan_standard_magrib_2026-06-20']).toBe('2026-06-20T23:01:00.000Z');
    expect(cancelCalls()).toEqual(['reminder_standard_magrib_2026-06-20_5']);
    expect(osIdentifiers()).toEqual(
      [
        'athan_standard_magrib_2026-06-20',
        'athan_standard_magrib_2026-06-21',
        'reminder_standard_magrib_2026-06-21_5',
      ].sort()
    );
  });

  it('keeps a Friday Istijaba that falls after midnight armed, while the Saturday list carries none', async () => {
    // 26 June 2026 is a Friday; its Istijaba falls at 00:20 BST on the Saturday
    const shape: Times = ['01:32', '02:58', '13:31', '17:31', '01:20', '01:44'];
    jest.setSystemTime(new Date('2026-06-26T20:00:00.000Z'));
    storeDays(sameTimesOn(['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'], shape));
    enable(ScheduleType.Extra, 'Istijaba', 5);

    await rescheduleAllNotifications();

    // 00:05 BST on the Saturday: Friday's Istijaba is 15 minutes away
    jest.setSystemTime(new Date('2026-06-26T23:05:00.000Z'));
    forgetCalls();

    await rescheduleAllNotifications();

    expect(triggers()['athan_extra_istijaba_2026-06-26']).toBe('2026-06-26T23:20:00.000Z');
    expect(cancelCalls()).toEqual([]);
    expect(osIdentifiers()).toEqual(['athan_extra_istijaba_2026-06-26', 'reminder_extra_istijaba_2026-06-26_5'].sort());
  });

  it('lets the window move on the moment the still-due row has passed, as the scheduler skips past rows', async () => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    storeDays(days(ISHA_AT_0001));
    enable(ScheduleType.Standard, 'Isha', 5);

    await rescheduleAllNotifications();

    jest.setSystemTime(new Date('2026-06-20T23:01:00.000Z'));
    forgetCalls();

    await rescheduleAllNotifications();

    expect(cancelCalls().sort()).toEqual(['athan_standard_isha_2026-06-20', 'reminder_standard_isha_2026-06-20_5']);
    expect(osIdentifiers()).toEqual(
      [
        'athan_standard_isha_2026-06-21',
        'athan_standard_isha_2026-06-22',
        'reminder_standard_isha_2026-06-21_5',
        'reminder_standard_isha_2026-06-22_5',
      ].sort()
    );
  });

  it('keeps the record of a refused cancel of a still-due yesterday alarm, so the repair can reach it', async () => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    storeDays(days(ISHA_AT_0001));
    enable(ScheduleType.Standard, 'Isha', 5);

    await rescheduleAllNotifications();

    // The user turns Isha off at 00:00:30 and the phone refuses to cancel yesterday's at-time alarm
    jest.setSystemTime(new Date('2026-06-20T23:00:30.000Z'));
    const cancelBase = (Notifications.cancelScheduledNotificationAsync as jest.Mock).getMockImplementation();
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockImplementation(async (id: string) => {
      if (id === 'athan_standard_isha_2026-06-20') throw new Error('refused');
      return cancelBase?.(id);
    });
    setPrayerAlertType(ScheduleType.Standard, 5, AlertType.Off);

    await rescheduleAllNotifications();

    // The alarm is still to come, so its record survives the refused cancel: only that record can
    // reach the alarm the phone still holds on the next repair pass
    expect(osIdentifiers()).toContain('athan_standard_isha_2026-06-20');
    const records = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 5).map((record) => record.id);
    expect(records).toContain('athan_standard_isha_2026-06-20');
  });

  it('drops the record of a refused cancel of an alarm older than yesterday, spent like any passed moment', async () => {
    jest.setSystemTime(new Date('2026-06-20T20:00:00.000Z'));
    storeDays(days(ISHA_AT_0001));
    enable(ScheduleType.Standard, 'Isha', 5);

    await rescheduleAllNotifications();

    // Two evenings later the 20th's alarm is long past; the phone refuses to cancel it anyway
    jest.setSystemTime(new Date('2026-06-22T19:00:00.000Z'));
    const cancelBase = (Notifications.cancelScheduledNotificationAsync as jest.Mock).getMockImplementation();
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockImplementation(async (id: string) => {
      if (id === 'athan_standard_isha_2026-06-20') throw new Error('refused');
      return cancelBase?.(id);
    });
    setPrayerAlertType(ScheduleType.Standard, 5, AlertType.Off);

    await rescheduleAllNotifications();

    // The OS still holds the refused alarm, but its moment is past and its record is spent: keeping
    // it would make every later clear ask for it again for ever
    expect(osIdentifiers()).toContain('athan_standard_isha_2026-06-20');
    const records = Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 5).map((record) => record.id);
    expect(records).toEqual([]);
  });
});
