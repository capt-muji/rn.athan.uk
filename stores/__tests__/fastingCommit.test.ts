/**
 * The fasting fields on the alert commit: the mode and add-on persist with the
 * rest of a Sahur change, and the Dawood anchor moves on exactly the two
 * activations that start a cycle, rolling back with everything else when the
 * phone refuses the change.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { type AlertMenuState, AlertType, type FastingSelection, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  commitPrayerAlertChange,
  fastingDawoodAnchorAtom,
  fastingModeAtom,
  fastingWhiteDaysAtom,
} from '@/stores/notifications';
import { __installTimetableDays, __resetTimetableForTest } from '@/stores/timetable';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn(async () => undefined) }));

jest.mock('@/stores/sync', () => ({
  ...jest.requireActual('@/stores/sync'),
  sync: jest.fn(async () => undefined),
}));

const store = getDefaultStore();

// 09:00 London time on Wednesday 1 April 2026, whose fajr reads 05:50
const NOW = Date.parse('2026-04-01T08:00:00.000Z');
const SUHOOR = 2;
const TIMES = { fajr: '05:50', sunrise: '07:30', dhuhr: '13:00', asr: '16:00', magrib: '19:00', isha: '20:30' };

/** The athan segments both states share, so a test varies only what it names */
const reminders = [
  { alert: AlertType.Off, interval: 5 },
  { alert: AlertType.Off, interval: 10 },
] as const;

const state = (atTimeAlert: AlertType, fasting?: AlertMenuState['fasting']): AlertMenuState => ({
  atTimeAlert,
  reminders: [...reminders],
  ...(fasting !== undefined ? { fasting } : {}),
});

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  __installTimetableDays(
    Array.from({ length: 4 }, (_, i) => {
      const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      return minutesToRecord(date, toDayMinutes(TIMES));
    })
  );
  jest.spyOn(Notifications, 'getAllScheduledNotificationsAsync').mockResolvedValue([]);
  jest.spyOn(Notifications, 'scheduleNotificationAsync').mockResolvedValue('scheduled');
  jest.spyOn(Notifications, 'cancelScheduledNotificationAsync').mockResolvedValue();
  // A spy restored to the manual mock keeps the calls earlier tests recorded
  // through it, so every count starts at zero here
  jest.clearAllMocks();

  store.set(fastingModeAtom, 'everyDay');
  store.set(fastingWhiteDaysAtom, false);
  store.set(fastingDawoodAnchorAtom, 0);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  __resetTimetableForTest();
});

describe('the anchor transitions', () => {
  it('writes the anchor when the bell comes on onto dawood', async () => {
    const committed = await commitPrayerAlertChange(
      ScheduleType.Extra,
      SUHOOR,
      'suhoor',
      state(AlertType.Sound, { mode: 'dawood', whiteDaysAddOn: false }),
      state(AlertType.Off, { mode: 'dawood', whiteDaysAddOn: false })
    );

    expect(committed).toBe(true);
    expect(store.get(fastingModeAtom)).toBe('dawood');
    expect(store.get(fastingDawoodAnchorAtom)).toBe(NOW);
  });

  it('writes the anchor when the mode moves to dawood while the bell is on', async () => {
    const committed = await commitPrayerAlertChange(
      ScheduleType.Extra,
      SUHOOR,
      'suhoor',
      state(AlertType.Sound, { mode: 'dawood', whiteDaysAddOn: true }),
      state(AlertType.Sound, { mode: 'muhammad', whiteDaysAddOn: false })
    );

    expect(committed).toBe(true);
    expect(store.get(fastingWhiteDaysAtom)).toBe(true);
    expect(store.get(fastingDawoodAnchorAtom)).toBe(NOW);
  });

  it('leaves the anchor while dawood stays active', async () => {
    store.set(fastingDawoodAnchorAtom, 123);
    const committed = await commitPrayerAlertChange(
      ScheduleType.Extra,
      SUHOOR,
      'suhoor',
      state(AlertType.Sound, { mode: 'dawood', whiteDaysAddOn: false }),
      state(AlertType.Sound, { mode: 'dawood', whiteDaysAddOn: false })
    );

    expect(committed).toBe(true);
    expect(store.get(fastingDawoodAnchorAtom)).toBe(123);
  });

  it('leaves the anchor on a change with no fasting fields', async () => {
    store.set(fastingDawoodAnchorAtom, 123);
    const committed = await commitPrayerAlertChange(
      ScheduleType.Standard,
      0,
      'fajr',
      state(AlertType.Sound),
      state(AlertType.Off)
    );

    expect(committed).toBe(true);
    expect(store.get(fastingDawoodAnchorAtom)).toBe(123);
    expect(store.get(fastingModeAtom)).toBe('everyDay');
  });

  it('rolls the anchor back with everything else when the phone refuses the change', async () => {
    store.set(fastingDawoodAnchorAtom, 123);
    store.set(fastingModeAtom, 'muhammad');
    const refused = jest.spyOn(Notifications, 'scheduleNotificationAsync').mockRejectedValue(new Error('refused'));

    const committed = await commitPrayerAlertChange(
      ScheduleType.Extra,
      SUHOOR,
      'suhoor',
      state(AlertType.Sound, { mode: 'dawood', whiteDaysAddOn: false }),
      state(AlertType.Sound, { mode: 'muhammad', whiteDaysAddOn: false })
    );

    expect(committed).toBe(false);
    expect(refused).toHaveBeenCalled();
    expect(store.get(fastingModeAtom)).toBe('muhammad');
    expect(store.get(fastingDawoodAnchorAtom)).toBe(123);
  });
});

describe('an off at-time alert with a committed pattern', () => {
  // The owner's question (2026-11-08): with the Sahur alert off, does the
  // pattern still schedule? The answer these tests pin: no. The commit routes
  // an off at-time alert to the two clearers and never to a scheduler, so the
  // bell's identity dots were visual only
  const patterns: readonly (readonly [string, FastingSelection])[] = [
    ['every day', { mode: 'everyDay', whiteDaysAddOn: false }],
    ['muhammad', { mode: 'muhammad', whiteDaysAddOn: false }],
    ['dawood with the white-days add-on', { mode: 'dawood', whiteDaysAddOn: true }],
    ['white days', { mode: 'whiteDays', whiteDaysAddOn: false }],
  ];

  it.each(patterns)('arms nothing and cancels what stood armed, under %s', async (_name, fasting) => {
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Extra, SUHOOR, {
      id: 'armed-athan',
      date: '2026-04-01',
      time: '05:50',
      alertType: AlertType.Sound,
    });
    Database.addOneScheduledReminderForPrayer(ScheduleType.Extra, SUHOOR, {
      id: 'armed-reminder',
      date: '2026-04-01',
      time: '05:40',
      alertType: AlertType.Silent,
    });

    const committed = await commitPrayerAlertChange(
      ScheduleType.Extra,
      SUHOOR,
      'suhoor',
      state(AlertType.Off, fasting),
      state(AlertType.Sound, { mode: 'everyDay', whiteDaysAddOn: false })
    );

    expect(committed).toBe(true);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('armed-athan');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('armed-reminder');
    expect(Database.getAllScheduledNotificationsForPrayer(ScheduleType.Extra, SUHOOR)).toEqual([]);
    expect(Database.getAllScheduledRemindersForPrayer(ScheduleType.Extra, SUHOOR)).toEqual([]);
    expect(store.get(fastingModeAtom)).toBe(fasting.mode);
    expect(store.get(fastingWhiteDaysAtom)).toBe(fasting.whiteDaysAddOn);
  });
});
