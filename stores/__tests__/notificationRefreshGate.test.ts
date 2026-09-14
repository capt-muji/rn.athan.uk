/**
 * The 12-hour notification refresh gate, and a reschedule that fails part way (stores/notifications.ts)
 *
 * Every foreground asks `refreshNotifications`, so the gate is what stops a full reschedule on each resume. When
 * it is still closed nothing may be scheduled, cancelled or stamped. When a reschedule throws, the caller must
 * hear it (the background task reports a failed run to the OS), the gate must stay open so the next foreground
 * tries again, and the scheduling queue must still run what comes after it: a jammed queue would leave every
 * later refresh, and so every alarm after it, waiting forever.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier } from '@/device/notifications';
import logger from '@/shared/logger';
import { AlertType, type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  lastNotificationScheduleAtom,
  refreshNotifications,
  rescheduleAllNotificationsFromBackground,
  shouldRescheduleNotifications,
  standardPrayerAlertAtoms,
} from '@/stores/notifications';

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

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST, three hours ahead
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const TODAY = '2026-08-29';
const TOMORROW = '2026-08-30';
const HOUR = 3_600_000;

const FAJR_TODAY = prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', TODAY);
const FAJR_TOMORROW = prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', TOMORROW);

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

/** What the OS holds, keyed by identifier, with the platforms' replace and cancel semantics */
const osState = new Set<string>();

const storeDay = (date: string) => {
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
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  Database.database.clearAll();

  storeDay(TODAY);
  storeDay(TOMORROW);
  store.set(standardPrayerAlertAtoms[0], AlertType.Sound);

  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    osState.add(identifier);
    return identifier;
  });
  cancelMock.mockImplementation(async (identifier: string) => {
    osState.delete(identifier);
  });
  getAllMock.mockImplementation(
    async () => [...osState].map((identifier) => ({ identifier })) as Notifications.NotificationRequest[]
  );
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  // Back to the shared mock's defaults for any suite that shares this worker
  scheduleMock.mockImplementation(
    async (request) => (request as { identifier?: string })?.identifier ?? 'mock-notification-id'
  );
  cancelMock.mockResolvedValue(undefined);
  getAllMock.mockResolvedValue([]);
});

// =============================================================================
// THE GATE
// =============================================================================

describe('refreshNotifications behind the 12-hour gate', () => {
  it.each([
    { since: 'no time at all', ms: 0, runs: false },
    { since: '1 hour', ms: HOUR, runs: false },
    { since: '1 millisecond short of 12 hours', ms: 12 * HOUR - 1, runs: false },
    { since: 'exactly 12 hours', ms: 12 * HOUR, runs: true },
    { since: '13 hours', ms: 13 * HOUR, runs: true },
  ])('with the last reschedule $since ago, runs: $runs', async ({ ms, runs }) => {
    const stamped = NOW - ms;
    store.set(lastNotificationScheduleAtom, stamped);

    await refreshNotifications();

    if (runs) {
      expect([...osState].sort()).toEqual([FAJR_TODAY, FAJR_TOMORROW]);
      expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
    } else {
      expect(scheduleMock).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
      expect(getAllMock).not.toHaveBeenCalled();
      expect(store.get(lastNotificationScheduleAtom)).toBe(stamped);
      expect(logger.info).toHaveBeenCalledWith('NOTIFICATION: Skipping reschedule, last schedule was within 12 hours');
    }
  });

  it('leaves what the OS already holds untouched while the gate is closed, even for a prayer turned off since', async () => {
    // Recorded as the reschedule that armed it left it, so a refresh that did run would cancel it
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, 0, {
      id: FAJR_TODAY,
      date: TODAY,
      time: '12:00',
      englishName: 'Fajr',
      arabicName: 'الفجر',
      alertType: AlertType.Sound,
    });
    osState.add(FAJR_TODAY);
    store.set(standardPrayerAlertAtoms[0], AlertType.Off);
    store.set(lastNotificationScheduleAtom, NOW - HOUR);

    await refreshNotifications();

    // Turning a prayer off cancels through its own path at once; the gate is only for the periodic refresh
    expect([...osState]).toEqual([FAJR_TODAY]);
  });
});

// =============================================================================
// A RESCHEDULE THAT THROWS
// =============================================================================

describe('when the reschedule throws part way', () => {
  const failure = new Error('OS query failed');

  it('rejects a foreground refresh with that error, leaves the gate open, and lets the next refresh run and stamp', async () => {
    const stamped = NOW - 13 * HOUR;
    store.set(lastNotificationScheduleAtom, stamped);
    getAllMock.mockRejectedValueOnce(failure);

    await expect(refreshNotifications()).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith('NOTIFICATION: Failed to refresh notifications:', failure);
    expect(store.get(lastNotificationScheduleAtom)).toBe(stamped);
    expect(shouldRescheduleNotifications()).toBe(true);

    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect([...osState].sort()).toEqual([FAJR_TODAY, FAJR_TOMORROW]);
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
  });

  it('rejects the background reschedule with that error, leaves the gate open, and lets a foreground refresh run and stamp', async () => {
    store.set(lastNotificationScheduleAtom, 0);
    getAllMock.mockRejectedValueOnce(failure);

    await expect(rescheduleAllNotificationsFromBackground()).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith('BACKGROUND_TASK: Failed to reschedule from background:', failure);
    expect(store.get(lastNotificationScheduleAtom)).toBe(0);

    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect([...osState].sort()).toEqual([FAJR_TODAY, FAJR_TOMORROW]);
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
  });

  it('runs a background reschedule already queued behind a refresh that fails', async () => {
    store.set(lastNotificationScheduleAtom, 0);
    getAllMock.mockRejectedValueOnce(failure);

    // The refresh takes its place in the queue at once; the background task waits for its sync first
    const [failing, queued] = await Promise.allSettled([
      refreshNotifications(),
      rescheduleAllNotificationsFromBackground(),
    ]);

    expect(failing).toEqual({ status: 'rejected', reason: failure });
    expect(queued).toEqual({ status: 'fulfilled', value: undefined });
    expect([...osState].sort()).toEqual([FAJR_TODAY, FAJR_TOMORROW]);
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
  });
});
