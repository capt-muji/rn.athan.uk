/**
 * A prayer whose alert is off while the OS refuses to cancel an alarm it still holds (stores/notifications.ts)
 *
 * A reschedule clears an off prayer through `clearAllScheduledNotificationForPrayer`, which cancels every recorded
 * alarm and then deletes the record of each cancel the phone accepted. A refused cancel is answered, not thrown: its
 * record is kept, because that record is the only way back to an alarm the phone still holds (with no records at all
 * the sweep refuses to cancel anything the OS holds, since after an app update that is exactly what it must not do),
 * and the prayer is marked to be put right. The next launch or return to the app then redoes that prayer alone, even
 * though the twelve-hour gate is shut, and asks for the cancel again.
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
const MINUTE = 60_000;

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

  // The refused alarm is modelled as still armed, one of two Android shapes: the delegate may instead have
  // disarmed it and kept it listed
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

  it('finishes the refresh, keeps only the refused record, and asks again on the next return to the app', async () => {
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(osState.has(FAJR[0])).toBe(true);
    expect(osState.has(FAJR[1])).toBe(false);
    // Only the alarm the phone still holds keeps its record; the one it cancelled loses its own
    expect(fajrRecords()).toEqual([FAJR[0]]);
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);

    // One minute on, the twelve-hour gate is shut, so only a prayer marked to be put right makes this do anything
    jest.setSystemTime(NOW + MINUTE);
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect([...osState].sort()).toEqual([...armedAfter].sort());
    expect(fajrRecords()).toEqual([]);
    // Putting one prayer right is not a full pass, so it does not close the gate for the next twelve hours
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
  });

  it('stops asking once the phone has taken the cancel', async () => {
    await expect(refreshNotifications()).resolves.toBeUndefined();
    jest.setSystemTime(NOW + MINUTE);
    await expect(refreshNotifications()).resolves.toBeUndefined();

    jest.setSystemTime(NOW + 2 * MINUTE);
    cancelMock.mockClear();
    scheduleMock.mockClear();
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(cancelMock).not.toHaveBeenCalled();
    expect(scheduleMock).not.toHaveBeenCalled();
  });
});
