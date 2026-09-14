/**
 * A prayer whose alert is off while the OS refuses to cancel an alarm it still holds (stores/notifications.ts)
 *
 * A reschedule clears an off prayer through `clearAllScheduledNotificationForPrayer`, which cancels every recorded
 * alarm and deletes the records only once all of those cancels have landed. When one is refused the reschedule
 * rejects, so the gate stays open, and the records stay, so the next refresh cancels that alarm again. The records
 * are the only way back to it when no other alert is on: with no records at all the sweep refuses to cancel anything
 * the OS holds, since after an app update that is exactly what it must not do.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier } from '@/device/notifications';
import { AlertType, type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { lastNotificationScheduleAtom, refreshNotifications, standardPrayerAlertAtoms } from '@/stores/notifications';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn(async () => undefined) }));

jest.mock('@/stores/sync', () => ({ sync: jest.fn(async () => undefined), getArmedDayChanges: jest.fn(() => 0) }));

// =============================================================================
// FIXTURES
// =============================================================================

const store = getDefaultStore();

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const WINDOW = ['2026-08-29', '2026-08-30'];
const HOUR = 3_600_000;

const FAJR = WINDOW.map((date) => prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', date));
const DHUHR = WINDOW.map((date) => prayerNotificationIdentifier(ScheduleType.Standard, 'Dhuhr', date));

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

const osState = new Set<string>();

const refusal = new Error('Notification could not be cancelled');

const fajrRecords = () =>
  Database.getAllScheduledNotificationsForPrayer(ScheduleType.Standard, 0)
    .map((record) => record.id)
    .sort();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  Database.database.clearAll();

  for (const date of WINDOW) {
    const day: ISingleApiResponseTransformed = {
      date,
      fajr: '12:00',
      sunrise: '12:00',
      dhuhr: '12:00',
      asr: '12:00',
      magrib: '12:00',
      isha: '12:00',
      suhoor: '12:00',
      duha: '12:00',
      istijaba: '12:00',
    };
    Database.database.set(`prayer_${date}`, JSON.stringify(day));
  }

  for (const atom of standardPrayerAlertAtoms) store.set(atom, AlertType.Off);
  store.set(lastNotificationScheduleAtom, 0);

  // Fajr was armed on both days and has since been switched off by a commit that did not finish
  WINDOW.forEach((date, position) => {
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, {
      id: FAJR[position],
      date,
      time: '12:00',
      englishName: 'Fajr',
      arabicName: 'الفجر',
      alertType: AlertType.Sound,
    });
    osState.add(FAJR[position]);
  });

  let refused = false;
  cancelMock.mockImplementation(async (identifier: string) => {
    if (identifier === FAJR[0] && !refused) {
      refused = true;
      throw refusal;
    }
    osState.delete(identifier);
  });
  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    osState.add(identifier);
    return identifier;
  });
  getAllMock.mockImplementation(
    async () => [...osState].map((identifier) => ({ identifier })) as Notifications.NotificationRequest[]
  );
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  scheduleMock.mockImplementation(
    async (request) => (request as { identifier?: string })?.identifier ?? 'mock-notification-id'
  );
  cancelMock.mockResolvedValue(undefined);
  getAllMock.mockResolvedValue([]);
});

// =============================================================================
// TESTS
// =============================================================================

describe.each([
  { others: 'with Dhuhr still on', dhuhr: AlertType.Sound, armedAfter: DHUHR },
  { others: 'with every other alert off', dhuhr: AlertType.Off, armedAfter: [] },
])('an off Fajr whose first cancel the OS refuses, $others', ({ dhuhr, armedAfter }) => {
  beforeEach(() => {
    store.set(standardPrayerAlertAtoms[2], dhuhr);
  });

  it('rejects the refresh with its records kept and the gate open, and the next refresh cancels the alarm', async () => {
    await expect(refreshNotifications()).rejects.toBe(refusal);

    expect(osState.has(FAJR[0])).toBe(true);
    expect(osState.has(FAJR[1])).toBe(false);
    expect(fajrRecords()).toEqual([...FAJR].sort());
    expect(store.get(lastNotificationScheduleAtom)).toBe(0);

    jest.setSystemTime(NOW + HOUR);
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect([...osState].sort()).toEqual([...armedAfter].sort());
    expect(fajrRecords()).toEqual([]);
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW + HOUR);
  });
});
