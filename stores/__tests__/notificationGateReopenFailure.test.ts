/**
 * Reopening the twelve-hour gate after a call ran out of time, when the write itself fails (stores/notifications.ts)
 *
 * A call the app gave up on can still land afterwards and arm an alarm it has no record of, so the gate is reopened to
 * put a full reschedule and its sweep on the next foreground. Failing to reopen it costs only that one reschedule, so
 * it is logged and the operation carries on: taking the scheduling queue down with it would cost every later change.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import logger from '@/shared/logger';
import { AlertType, type ISingleApiResponseTransformed } from '@/shared/types';
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

// The atom factories stay real: two atoms over one key hold different values (stores/storage.ts, THE RULE)
const mockResetStoredAtom = jest.fn();
jest.mock('@/stores/storage', () => ({
  ...jest.requireActual('@/stores/storage'),
  resetStoredAtom: (...args: unknown[]) => mockResetStoredAtom(...args),
}));

const store = getDefaultStore();

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const WINDOW = ['2026-08-29', '2026-08-30'];
const GATE_KEY = 'preference_last_notification_schedule_check';

const failure = new Error('MMKV is not writable');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
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

  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.useRealTimers();
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([]);
});

describe('a call that ran out of time, when the gate cannot be reopened', () => {
  it('reports it and lets the failure of the call itself reach the caller', async () => {
    mockResetStoredAtom.mockImplementation(() => {
      throw failure;
    });
    const refresh = refreshNotifications();
    const timedOut = expect(refresh).rejects.toThrow('listing the pending notifications did not answer in 15000 ms');

    await jest.advanceTimersByTimeAsync(15_000);

    await timedOut;
    expect(mockResetStoredAtom).toHaveBeenCalledWith(expect.anything(), GATE_KEY);
    expect(logger.warn).toHaveBeenCalledWith(
      'NOTIFICATION: Failed to reopen the refresh gate after a call ran out of time',
      { error: failure }
    );
  });
});
