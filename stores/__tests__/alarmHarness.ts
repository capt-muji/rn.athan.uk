/**
 * An in-memory OS for the alarm tests around 00:00 and the 2026 London clock changes, armed through the real
 * notifications store
 *
 * The OS replaces and cancels by identifier, as both platforms do. A test file using this must mock '@/stores/sync'
 * and '@/stores/widget', as stores/__tests__/notifications.test.ts does, and run on Jest's fake clock.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai/vanilla';

import { DEFAULT_REMINDER_INTERVAL } from '@/shared/constants';
import { transformApiData } from '@/shared/prayer';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  extraPrayerAlertAtoms,
  extraReminderAlertAtoms,
  extraReminderIntervalAtoms,
  getPrayerArrays,
  lastNotificationScheduleAtom,
  soundPreferenceAtom,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
  standardReminderIntervalAtoms,
} from '@/stores/notifications';

/** A day's times as the provider sends them: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha */
export type Times = [string, string, string, string, string, string];

type Request = { identifier: string; trigger: { date: Date } };

/** Real London times from londonprayertimes.com for 2026: both clock changes, and 18 October's two Midnights */
const LONDON_2026: Record<string, Times> = {
  '2026-03-27': ['04:11', '05:45', '12:11', '15:33', '18:28', '19:46'],
  '2026-03-28': ['04:09', '05:42', '12:11', '15:34', '18:30', '19:48'],
  '2026-03-29': ['05:07', '06:40', '13:10', '16:35', '19:32', '20:49'],
  '2026-03-30': ['05:05', '06:38', '13:10', '16:36', '19:34', '20:51'],
  '2026-10-16': ['05:51', '07:23', '12:51', '15:31', '18:08', '19:31'],
  '2026-10-17': ['05:52', '07:25', '12:51', '15:30', '18:06', '19:29'],
  '2026-10-18': ['05:54', '07:27', '12:51', '15:28', '18:04', '19:27'],
  '2026-10-19': ['05:55', '07:28', '12:51', '15:26', '18:02', '19:25'],
  '2026-10-20': ['05:57', '07:30', '12:50', '15:25', '18:00', '19:23'],
  '2026-10-23': ['06:00', '07:35', '12:50', '15:20', '17:54', '19:19'],
  '2026-10-24': ['06:02', '07:37', '12:50', '15:18', '17:52', '19:17'],
  '2026-10-25': ['05:04', '06:39', '11:50', '14:17', '16:50', '18:17'],
  '2026-10-26': ['05:05', '06:41', '11:50', '14:15', '16:48', '18:15'],
  '2026-10-27': ['05:06', '06:42', '11:50', '14:14', '16:46', '18:13'],
};

/** The named days of the London fixture */
export const londonDays = (...dates: string[]): Record<string, Times> =>
  Object.fromEntries(
    dates.map((date) => {
      const times = LONDON_2026[date];
      if (!times) throw new Error(`${date} is not in the London fixture`);
      return [date, times];
    })
  );

/** The same times on every listed day, for the high-latitude shapes London never has */
export const sameTimesOn = (dates: string[], times: Times): Record<string, Times> =>
  Object.fromEntries(dates.map((date) => [date, times]));

/** Stores days as sync writes them, so Suhoor, Duha and Istijaba are derived by the app's own transform */
export const storeDays = (days: Record<string, Times>): void => {
  for (const [date, [fajr, sunrise, dhuhr, asr, magrib, isha]] of Object.entries(days)) {
    const [stored] = transformApiData({
      city: 'london',
      times: { [date]: { fajr, sunrise, dhuhr, asr, magrib, isha } },
    });
    Database.database.set(`prayer_${date}`, JSON.stringify(stored));
  }
};

const store = getDefaultStore();
const osState = new Set<string>();
const scheduleMock = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelMock = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const getAllMock = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

/** Every alert off, nothing stored or armed, and an OS that holds what it is given until it is cancelled */
export const resetAlarms = (): void => {
  osState.clear();
  Database.database.clearAll();
  jest.clearAllMocks();

  for (const atoms of [standardPrayerAlertAtoms, extraPrayerAlertAtoms, standardReminderAlertAtoms]) {
    for (const atom of atoms) store.set(atom, AlertType.Off);
  }
  for (const atom of extraReminderAlertAtoms) store.set(atom, AlertType.Off);
  for (const atom of [...standardReminderIntervalAtoms, ...extraReminderIntervalAtoms]) {
    store.set(atom, DEFAULT_REMINDER_INTERVAL);
  }
  store.set(lastNotificationScheduleAtom, 0);
  store.set(soundPreferenceAtom, 0);

  scheduleMock.mockImplementation(async ({ identifier }: Request) => {
    osState.add(identifier);
    return identifier;
  });
  cancelMock.mockImplementation(async (identifier: string) => {
    osState.delete(identifier);
  });
  getAllMock.mockImplementation(async () => [...osState].map((identifier) => ({ identifier })));
};

/** Switches a prayer's alert to Silent, and its reminder too when given an interval */
export const enable = (scheduleType: ScheduleType, name: string, reminderInterval?: ReminderInterval): void => {
  const index = getPrayerArrays(scheduleType).english.indexOf(name);
  if (index === -1) throw new Error(`${name} is not on the ${scheduleType} list`);

  const isStandard = scheduleType === ScheduleType.Standard;
  store.set((isStandard ? standardPrayerAlertAtoms : extraPrayerAlertAtoms)[index], AlertType.Silent);
  if (reminderInterval === undefined) return;

  store.set((isStandard ? standardReminderAlertAtoms : extraReminderAlertAtoms)[index], AlertType.Silent);
  store.set((isStandard ? standardReminderIntervalAtoms : extraReminderIntervalAtoms)[index], reminderInterval);
};

/** Every identifier handed to the OS since the last reset or forgetCalls, with the trigger it was last given */
export const triggers = (): Record<string, string> =>
  Object.fromEntries(
    scheduleMock.mock.calls.map(([call]) => {
      const request = call as Request;
      return [request.identifier, request.trigger.date.toISOString()];
    })
  );

/** Every identifier the OS was asked to cancel since the last reset or forgetCalls */
export const cancelCalls = (): string[] => cancelMock.mock.calls.map(([identifier]) => identifier as string);

/** What the OS holds now */
export const osIdentifiers = (): string[] => [...osState].sort();

/** Starts a fresh record of what the OS is asked, leaving what it holds */
export const forgetCalls = (): void => {
  scheduleMock.mockClear();
  cancelMock.mockClear();
};

/** An instant the given minutes of real time earlier */
export const minutesBefore = (instant: string, minutes: number): string =>
  new Date(Date.parse(instant) - minutes * 60_000).toISOString();
