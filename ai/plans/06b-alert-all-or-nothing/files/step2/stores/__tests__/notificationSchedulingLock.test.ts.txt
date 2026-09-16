/**
 * The scheduling lock while one piece of an operation fails (stores/notifications.ts)
 *
 * Scheduling operations run one at a time, in the order they were asked for. When one piece of an operation fails,
 * the operation still waits for every other piece it started before the next operation runs. Ending early would leave
 * arming and cancelling still landing beside the next operation, which can leave a prayer switched Off with an alarm
 * armed, or switched on with an alarm cancelled.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import logger from '@/shared/logger';
import * as PrayerUtils from '@/shared/prayer';
import { AlertType, type ISingleApiResponseTransformed, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import {
  commitPrayerAlertChange,
  lastNotificationScheduleAtom,
  refreshNotifications,
  setReminderInterval,
  standardPrayerAlertAtoms,
  standardReminderAlertAtoms,
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

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const TODAY = '2026-08-29';
const TOMORROW = '2026-08-30';
const WINDOW = [TODAY, TOMORROW];
const INTERVAL = 15 as ReminderInterval;
const FAJR = 0;
const DHUHR = 2;

/** The three settings an alert sheet closes on */
const alerts = (atTimeAlert: AlertType, reminderAlert: AlertType = AlertType.Off) => ({
  atTimeAlert,
  reminderAlert,
  reminderInterval: INTERVAL,
});

/** Every alert of a prayer switched off */
const OFF = alerts(AlertType.Off);

const athanIds = (name: string) =>
  WINDOW.map((date) => prayerNotificationIdentifier(ScheduleType.Standard, name, date));
const reminderIds = (name: string) =>
  WINDOW.map((date) => reminderNotificationIdentifier(ScheduleType.Standard, name, date, INTERVAL));

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

/** What the OS holds, keyed by identifier, with the platforms' replace and cancel semantics */
const osState = new Set<string>();

/** Arming and cancelling the test keeps on its way, each with what lets it land */
const held = new Map<string, () => void>();

/** Identifiers whose cancel the OS refuses */
const refusedCancels = new Set<string>();

/** Which arming and which cancelling the test keeps on its way until releaseHeld */
let holdsSchedule: (identifier: string) => boolean;
let holdsCancel: (identifier: string) => boolean;

const refusal = new Error('Notification could not be cancelled');

const releaseHeld = () => {
  for (const land of held.values()) land();
  held.clear();
};

/** Microtasks only, so the fake clock does not hold them */
const flush = async () => {
  for (let tick = 0; tick < 100; tick++) await Promise.resolve();
};

/** What the OS holds for one prayer, athan and reminders */
const armedFor = (name: string) => [...osState].filter((id) => id.includes(`_${name.toLowerCase()}_`)).sort();

/** An earlier reschedule's alarms for a prayer, recorded and held by the OS */
const armedEarlier = (
  index: number,
  name: string,
  ids: string[],
  record: typeof Database.addOneScheduledNotificationForPrayer
) => {
  ids.forEach((id, position) => {
    record(ScheduleType.Standard, index, {
      id,
      date: WINDOW[position],
      time: '12:00',
      englishName: name,
      arabicName: '',
      alertType: AlertType.Silent,
    });
    osState.add(id);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  held.clear();
  refusedCancels.clear();
  holdsSchedule = () => false;
  holdsCancel = () => false;
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

  for (const atom of [...standardPrayerAlertAtoms, ...standardReminderAlertAtoms]) store.set(atom, AlertType.Off);
  setReminderInterval(ScheduleType.Standard, FAJR, INTERVAL);
  setReminderInterval(ScheduleType.Standard, DHUHR, INTERVAL);
  store.set(lastNotificationScheduleAtom, 0);

  scheduleMock.mockImplementation((request) => {
    const identifier = (request as { identifier: string }).identifier;
    if (!holdsSchedule(identifier)) {
      osState.add(identifier);
      return Promise.resolve(identifier);
    }
    return new Promise((resolve) => {
      held.set(`schedule ${identifier}`, () => {
        osState.add(identifier);
        resolve(identifier);
      });
    });
  });
  cancelMock.mockImplementation((identifier: string) => {
    if (refusedCancels.has(identifier)) return Promise.reject(refusal);
    if (!holdsCancel(identifier)) {
      osState.delete(identifier);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      held.set(`cancel ${identifier}`, () => {
        osState.delete(identifier);
        resolve();
      });
    });
  });
  getAllMock.mockImplementation(
    async () => [...osState].map((identifier) => ({ identifier })) as Notifications.NotificationRequest[]
  );
});

afterEach(() => {
  jest.restoreAllMocks();
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

describe('an operation queued behind one that fails part way', () => {
  it('runs only once every prayer the failing refresh is arming has landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    store.set(standardPrayerAlertAtoms[DHUHR], AlertType.Silent);
    holdsSchedule = (id) => athanIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    const commit = commitPrayerAlertChange(ScheduleType.Standard, DHUHR, 'Dhuhr', '', OFF, alerts(AlertType.Silent));
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    // A refused cancel no longer rejects the refresh: it marks the prayer. What the lock still guarantees is that the
    // commit ran only after every piece of the refresh had landed, which is what the empty Dhuhr proves
    expect({ refreshed: refreshed.status, committed, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'fulfilled',
      committed: { status: 'fulfilled', value: true },
      dhuhr: [],
    });
  });

  it('runs only once the reminders the failing refresh is arming, in another part of it, have landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    store.set(standardPrayerAlertAtoms[DHUHR], AlertType.Silent);
    store.set(standardReminderAlertAtoms[DHUHR], AlertType.Silent);
    holdsSchedule = (id) => reminderIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    const commit = commitPrayerAlertChange(ScheduleType.Standard, DHUHR, 'Dhuhr', '', OFF, alerts(AlertType.Silent));
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'fulfilled',
      committed: { status: 'fulfilled', value: true },
      dhuhr: [],
    });
  });

  it('runs only once every cancel the failing refresh sent for the same prayer has landed', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    holdsCancel = (id) => id === athanIds('Fajr')[1];
    const refresh = refreshNotifications();
    await flush();

    const commit = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', '', alerts(AlertType.Silent), OFF);
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed, fajr: armedFor('Fajr') }).toEqual({
      refreshed: 'fulfilled',
      committed: { status: 'fulfilled', value: true },
      fajr: athanIds('Fajr'),
    });
  });

  it("runs only once the failing commit's reminder cancels have landed", async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', reminderIds('Fajr'), Database.addOneScheduledReminderForPrayer);
    refusedCancels.add(athanIds('Fajr')[0]);
    holdsCancel = (id) => id === reminderIds('Fajr')[1];
    const turnOff = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', '', OFF, alerts(AlertType.Silent));
    await flush();

    const turnOn = commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      '',
      alerts(AlertType.Silent, AlertType.Silent),
      OFF
    );
    await flush();
    releaseHeld();
    const [off, on] = await Promise.allSettled([turnOff, turnOn]);

    // The phone refused one of the Off commit's cancels, so it answers false. Its undo is skipped because the second
    // commit already owns the prayer, which is what leaves the second commit's own setting standing
    expect({ off, on, fajr: armedFor('Fajr') }).toEqual({
      off: { status: 'fulfilled', value: false },
      on: { status: 'fulfilled', value: true },
      fajr: [...athanIds('Fajr'), ...reminderIds('Fajr')].sort(),
    });
  });

  it("runs only once another prayer's reminders have armed, when one prayer's reminder day throws", async () => {
    for (const index of [FAJR, DHUHR]) {
      store.set(standardPrayerAlertAtoms[index], AlertType.Silent);
      store.set(standardReminderAlertAtoms[index], AlertType.Silent);
    }
    const readRow = PrayerUtils.getPrayerForDate;
    jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
      if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
      return readRow(type, name, date);
    });
    holdsSchedule = (id) => reminderIds('Dhuhr').includes(id);
    const refresh = refreshNotifications();
    await flush();

    const commit = commitPrayerAlertChange(ScheduleType.Standard, DHUHR, 'Dhuhr', '', OFF, alerts(AlertType.Silent));
    await flush();
    releaseHeld();
    const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

    expect({ refreshed: refreshed.status, committed: committed.status, dhuhr: armedFor('Dhuhr') }).toEqual({
      refreshed: 'rejected',
      committed: 'fulfilled',
      dhuhr: [],
    });
  });

  // the path whose day fails, the Fajr reminder alert that switches that path on, and the day the refresh is arming
  it.each([
    { path: 'athan', reminder: AlertType.Off, holding: athanIds('Fajr')[0] },
    { path: 'reminder', reminder: AlertType.Silent, holding: reminderIds('Fajr')[0] },
  ])(
    'runs only once the other day of a failing refresh has armed, when one $path day throws',
    async ({ reminder, holding }) => {
      store.set(standardPrayerAlertAtoms[FAJR], AlertType.Silent);
      store.set(standardReminderAlertAtoms[FAJR], reminder);
      const readRow = PrayerUtils.getPrayerForDate;
      jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
        if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
        return readRow(type, name, date);
      });
      holdsSchedule = (id) => id === holding;
      const refresh = refreshNotifications();
      await flush();

      const commit = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', '', OFF, alerts(AlertType.Silent));
      await flush();
      releaseHeld();
      const [refreshed, committed] = await Promise.allSettled([refresh, commit]);

      expect({ refreshed: refreshed.status, committed: committed.status, fajr: armedFor('Fajr') }).toEqual({
        refreshed: 'rejected',
        committed: 'fulfilled',
        fajr: [],
      });
    }
  );
});

describe('a call into the notification system that never answers', () => {
  it('gives up on listing the pending notifications after fifteen seconds', async () => {
    // The sweep reads the list inside the lock, so a list that never answers would hold the queue for the rest of the
    // process
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Silent);
    getAllMock.mockImplementation(() => new Promise(() => undefined));
    const refresh = refreshNotifications();
    const failed = expect(refresh).rejects.toThrow('listing the pending notifications did not answer in 15000 ms');

    await jest.advanceTimersByTimeAsync(15_000);

    await failed;
  });
});

describe('an operation that fails before its own work begins', () => {
  it('leaves the queue able to run the next operation', async () => {
    // The lock writes its own log line before the try that the operation runs in, so a logger that throws takes the
    // whole queue down with it: every later operation's callback is skipped and nothing is ever armed again
    const info = logger.info as jest.Mock;
    info.mockImplementation((message: string) => {
      if (message === 'NOTIFICATION: Starting refreshNotifications') throw new Error('Log sink unavailable');
    });
    const refresh = refreshNotifications();
    const failed = expect(refresh).rejects.toThrow('Log sink unavailable');
    await flush();
    info.mockImplementation(() => undefined);

    await commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', '', alerts(AlertType.Silent), OFF);

    await failed;
    expect(armedFor('Fajr')).toEqual(athanIds('Fajr').sort());
  });
});
