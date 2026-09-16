/**
 * An alert sheet change is all or nothing, in both directions (stores/notifications.ts, finding 81)
 *
 * When the phone takes every part of a change, the saved settings and the alarms are the new ones. When it refuses or
 * fails any part, both go back to what they were, inside the same lock acquisition. When it refuses that too, the
 * prayer is marked, and the next launch or return to the app applies its saved settings again, even though the
 * twelve-hour gate is shut.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import * as PrayerUtils from '@/shared/prayer';
import {
  type AlertMenuState,
  AlertType,
  type ISingleApiResponseTransformed,
  type ReminderInterval,
  ScheduleType,
} from '@/shared/types';
import * as Database from '@/stores/database';
import {
  commitPrayerAlertChange,
  extraPrayerAlertAtoms,
  getPrayerAlertType,
  getReminderAlertType,
  getReminderInterval,
  lastNotificationScheduleAtom,
  refreshNotifications,
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
const MINUTE = 60_000;
const INTERVAL = 15 as ReminderInterval;
const OLD_INTERVAL = 30 as ReminderInterval;
const FAJR = 0;
const ISHA = 5;

const athanIds = (name: string, type = ScheduleType.Standard) =>
  WINDOW.map((date) => prayerNotificationIdentifier(type, name, date));
const reminderIdsAt = (name: string, interval: ReminderInterval, type = ScheduleType.Standard) =>
  WINDOW.map((date) => reminderNotificationIdentifier(type, name, date, interval));

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getAllMock = jest.mocked(Notifications.getAllScheduledNotificationsAsync);

/** What the OS holds */
const osState = new Set<string>();

/** Identifiers whose cancel the phone refuses, and identifiers whose arming it refuses */
const refusedCancels = new Set<string>();
const refusedSchedules = new Set<string>();

/** Cancels the test keeps on their way until releaseHeld, so work can be enqueued behind one that is running */
const held = new Map<string, () => void>();
let holdsCancel: (identifier: string) => boolean = () => false;

const releaseHeld = () => {
  for (const land of held.values()) land();
  held.clear();
};

/** Microtasks only, so the fake clock does not hold them */
const flush = async () => {
  for (let tick = 0; tick < 100; tick++) await Promise.resolve();
};

const refusal = Object.assign(new Error('Failed to cancel notification.'), {
  code: 'ERR_NOTIFICATIONS_FAILED_TO_CANCEL',
});

/** The three settings an alert sheet closes on */
const alerts = (
  atTimeAlert: AlertType,
  reminderAlert: AlertType = AlertType.Off,
  reminderInterval: ReminderInterval = INTERVAL
): AlertMenuState => ({ atTimeAlert, reminderAlert, reminderInterval });

const OFF = alerts(AlertType.Off);

/** What the prayer's bell says: its three saved settings */
const saved = (prayerIndex: number, type = ScheduleType.Standard): AlertMenuState => ({
  atTimeAlert: getPrayerAlertType(type, prayerIndex),
  reminderAlert: getReminderAlertType(type, prayerIndex),
  reminderInterval: getReminderInterval(type, prayerIndex),
});

/** The at-time records the app holds for one prayer */
const recordsFor = (prayerIndex: number, type = ScheduleType.Standard) =>
  Database.getAllScheduledNotificationsForPrayer(type, prayerIndex)
    .map((record) => record.id)
    .sort();

/** What the OS holds for one prayer */
const armedFor = (name: string) => [...osState].filter((id) => id.includes(`_${name.toLowerCase()}_`)).sort();

/** An alarm an earlier pass armed and recorded */
const armedEarlier = (
  prayerIndex: number,
  name: string,
  ids: string[],
  record: typeof Database.addOneScheduledNotificationForPrayer,
  type = ScheduleType.Standard
) => {
  ids.forEach((id, position) => {
    record(type, prayerIndex, {
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
  refusedCancels.clear();
  refusedSchedules.clear();
  held.clear();
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

  for (const atom of [...standardPrayerAlertAtoms, ...standardReminderAlertAtoms, ...extraPrayerAlertAtoms]) {
    store.set(atom, AlertType.Off);
  }
  // Stamped just now, so only a prayer marked to be put right can make a refresh do anything
  store.set(lastNotificationScheduleAtom, NOW);

  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    if (refusedSchedules.has(identifier)) throw new Error('Failed to schedule notification.');
    osState.add(identifier);
    return identifier;
  });
  cancelMock.mockImplementation((identifier: string) => {
    if (refusedCancels.has(identifier)) return Promise.reject(refusal);
    if (!holdsCancel(identifier)) {
      osState.delete(identifier);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      held.set(identifier, () => {
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

describe('a change the phone takes', () => {
  // every combination an alert sheet can close on, with what it must leave armed
  it.each([
    { atTime: AlertType.Off, reminder: AlertType.Off, armed: () => [] },
    { atTime: AlertType.Off, reminder: AlertType.Silent, armed: () => [] },
    { atTime: AlertType.Off, reminder: AlertType.Sound, armed: () => [] },
    { atTime: AlertType.Silent, reminder: AlertType.Off, armed: () => athanIds('Isha') },
    {
      atTime: AlertType.Silent,
      reminder: AlertType.Silent,
      armed: () => [...athanIds('Isha'), ...reminderIdsAt('Isha', INTERVAL)],
    },
    {
      atTime: AlertType.Silent,
      reminder: AlertType.Sound,
      armed: () => [...athanIds('Isha'), ...reminderIdsAt('Isha', INTERVAL)],
    },
    { atTime: AlertType.Sound, reminder: AlertType.Off, armed: () => athanIds('Isha') },
    {
      atTime: AlertType.Sound,
      reminder: AlertType.Silent,
      armed: () => [...athanIds('Isha'), ...reminderIdsAt('Isha', INTERVAL)],
    },
    {
      atTime: AlertType.Sound,
      reminder: AlertType.Sound,
      armed: () => [...athanIds('Isha'), ...reminderIdsAt('Isha', INTERVAL)],
    },
  ])(
    'saves at-time $atTime with reminder $reminder, and arms exactly what that means',
    async ({ atTime, reminder, armed }) => {
      const next = alerts(atTime, reminder);

      await expect(commitPrayerAlertChange(ScheduleType.Standard, ISHA, 'Isha', 'العشاء', next, OFF)).resolves.toBe(
        true
      );

      // All three are saved as the sheet closed on them. A reminder saved beside an Off athan arms nothing and comes
      // back with the athan; the sheet itself never offers that pair, because turning the athan off there clears the
      // reminder switch too
      expect(saved(ISHA)).toEqual(next);
      expect(armedFor('Isha')).toEqual(armed().sort());
    }
  );

  it('arms an Extras prayer from its own list', async () => {
    const next = alerts(AlertType.Silent);

    await expect(commitPrayerAlertChange(ScheduleType.Extra, 3, 'Last Third', 'الثلث الأخير', next, OFF)).resolves.toBe(
      true
    );

    expect(saved(3, ScheduleType.Extra)).toEqual(next);
    expect(armedFor('last third').length).toBeGreaterThan(0);
  });
});

describe('a change the phone refuses', () => {
  it('puts the bell and the alarms back when a cancel is refused on the way off', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(athanIds('Fajr')[0]);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      OFF,
      alerts(AlertType.Sound)
    );

    expect(result).toBe(false);
    // The bell is back on, and the alarms are back with it: both days armed again, not one
    expect(saved(FAJR)).toEqual(alerts(AlertType.Sound));
    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr')].sort());
  });

  it('puts the bell back and cancels what did arm when an arm is refused on the way on', async () => {
    refusedSchedules.add(athanIds('Fajr')[1]);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      alerts(AlertType.Sound),
      OFF
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(OFF);
    expect(armedFor('Fajr')).toEqual([]);
  });

  it('puts the whole interval change back when the old reminder will not cancel', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', reminderIdsAt('Fajr', OLD_INTERVAL), Database.addOneScheduledReminderForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    store.set(standardReminderAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(reminderIdsAt('Fajr', OLD_INTERVAL)[0]);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      alerts(AlertType.Sound, AlertType.Sound, INTERVAL),
      alerts(AlertType.Sound, AlertType.Sound, OLD_INTERVAL)
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(alerts(AlertType.Sound, AlertType.Sound, OLD_INTERVAL));
    // The reminder the phone would not cancel is the one the saved interval now asks for again
    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr'), ...reminderIdsAt('Fajr', OLD_INTERVAL)].sort());
  });

  it('puts the bell and the reminders back when a reminder cancel is refused on the way off', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', reminderIdsAt('Fajr', INTERVAL), Database.addOneScheduledReminderForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    store.set(standardReminderAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(reminderIdsAt('Fajr', INTERVAL)[0]);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      OFF,
      alerts(AlertType.Sound, AlertType.Sound)
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(alerts(AlertType.Sound, AlertType.Sound));
    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr'), ...reminderIdsAt('Fajr', INTERVAL)].sort());
  });

  it('puts the change back when a stored day cannot be read', async () => {
    const readRow = PrayerUtils.getPrayerForDate;
    jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
      if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
      return readRow(type, name, date);
    });

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      alerts(AlertType.Sound),
      OFF
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(OFF);
  });
});

describe('a refusal that can no longer fire', () => {
  it('does not undo the change, and drops the spent record with the rest', async () => {
    const yesterday = '2026-08-28';
    const spent = prayerNotificationIdentifier(ScheduleType.Standard, 'Fajr', yesterday);
    // An alarm filed under yesterday has already had its moment, whichever list it is on
    Database.addOneScheduledNotificationForPrayer(ScheduleType.Standard, FAJR, {
      id: spent,
      date: yesterday,
      time: '12:00',
      englishName: 'Fajr',
      arabicName: '',
      alertType: AlertType.Sound,
    });
    osState.add(spent);
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(spent);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      OFF,
      alerts(AlertType.Sound)
    );

    expect(result).toBe(true);
    expect(saved(FAJR)).toEqual(OFF);
    expect(recordsFor(FAJR)).toEqual([]);
  });
});

describe('a day whose stored row cannot be read', () => {
  it('keeps that day its record, so its alarm can still be found', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Silent);
    const readRow = PrayerUtils.getPrayerForDate;
    jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
      if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
      return readRow(type, name, date);
    });

    await expect(
      commitPrayerAlertChange(
        ScheduleType.Standard,
        FAJR,
        'Fajr',
        'الفجر',
        alerts(AlertType.Sound),
        alerts(AlertType.Silent)
      )
    ).resolves.toBe(false);

    // Tomorrow's alarm is still armed, and its record is still there: with no record, only the sweep could find it
    expect(osState.has(athanIds('Fajr')[1])).toBe(true);
    expect(recordsFor(FAJR)).toContain(athanIds('Fajr')[1]);
  });
});

describe('two changes to the same prayer, one behind the other', () => {
  it('lets the newer change stand, and does not put the older one back over it', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', reminderIdsAt('Fajr', OLD_INTERVAL), Database.addOneScheduledReminderForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Silent);
    store.set(standardReminderAlertAtoms[FAJR], AlertType.Silent);
    refusedCancels.add(athanIds('Fajr')[0]);
    const older = alerts(AlertType.Silent, AlertType.Silent, OLD_INTERVAL);
    const newer = alerts(AlertType.Sound, AlertType.Sound, INTERVAL);

    // The user switches Fajr off, then reopens the sheet and picks Sound before the first change has run
    const first = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', OFF, older);
    const second = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', newer, OFF);

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);

    // The older change's undo would have written its own settings back over the newer ones, and the newer reminders
    // would then have been armed at the older interval, because the schedulers read the interval from its atom
    expect(saved(FAJR)).toEqual(newer);
    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr'), ...reminderIdsAt('Fajr', INTERVAL)].sort());
  });

  it('lets the second put itself back, although the first finished cleanly', async () => {
    // Both sheets close before either change runs, so the first change finishes holding a mark the second has already
    // replaced. Clearing it there would leave the second change believing another one owns the prayer, and it would
    // then leave the bell saying Off with an alarm still armed
    const first = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', alerts(AlertType.Silent), OFF);
    const second = commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', OFF, alerts(AlertType.Silent));
    refusedCancels.add(athanIds('Fajr')[1]);

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(false);

    expect(saved(FAJR)).toEqual(alerts(AlertType.Silent));
    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr')].sort());
  });
});

describe('a prayer marked while a pass for other prayers is waiting its turn', () => {
  it('keeps its mark, so its own change can still be put back', async () => {
    // Dhuhr's commit holds the queue. The refresh behind it read the marked prayers before Isha was marked, so the
    // pass never looks at Isha: treating a prayer it did not look at as put right would clear Isha's mark, and Isha's
    // own commit would then believe another change owned the prayer and leave the bell saying Off
    const DHUHR = 2;
    armedEarlier(DHUHR, 'Dhuhr', athanIds('Dhuhr'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(ISHA, 'Isha', athanIds('Isha'), Database.addOneScheduledNotificationForPrayer);
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    for (const index of [FAJR, DHUHR, ISHA]) store.set(standardPrayerAlertAtoms[index], AlertType.Sound);
    // Fajr was left marked by an earlier change the phone would not take, and will not take now either
    refusedCancels.add(athanIds('Fajr')[0]);
    refusedSchedules.add(athanIds('Fajr')[1]);
    await commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', OFF, alerts(AlertType.Sound));

    holdsCancel = (identifier) => identifier === athanIds('Dhuhr')[0];
    const dhuhr = commitPrayerAlertChange(ScheduleType.Standard, DHUHR, 'Dhuhr', 'الظهر', OFF, alerts(AlertType.Sound));
    await flush();
    const repair = refreshNotifications();
    await flush();
    refusedCancels.add(athanIds('Isha')[0]);
    const isha = commitPrayerAlertChange(ScheduleType.Standard, ISHA, 'Isha', 'العشاء', OFF, alerts(AlertType.Sound));
    await flush();
    releaseHeld();

    await expect(dhuhr).resolves.toBe(true);
    await expect(repair).resolves.toBeUndefined();
    await expect(isha).resolves.toBe(false);

    expect(saved(ISHA)).toEqual(alerts(AlertType.Sound));
  });
});

describe('a change the phone refuses to put back', () => {
  it('leaves the bell as it was when putting the alarms back fails outright', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(athanIds('Fajr')[0]);
    const readRow = PrayerUtils.getPrayerForDate;
    // Readable while the change is cancelling, unreadable when the undo tries to arm tomorrow again
    jest.spyOn(PrayerUtils, 'getPrayerForDate').mockImplementation((type, name, date) => {
      if (name === 'Fajr' && date === TOMORROW) throw new Error('Stored day could not be read');
      return readRow(type, name, date);
    });

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      OFF,
      alerts(AlertType.Sound)
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(alerts(AlertType.Sound));
  });

  it('leaves the bell as it was and asks again on the next return to the app', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    // Today's alarm will not cancel, and tomorrow's will not arm again, so neither the change nor its undo can land
    refusedCancels.add(athanIds('Fajr')[0]);
    refusedSchedules.add(athanIds('Fajr')[1]);

    const result = await commitPrayerAlertChange(
      ScheduleType.Standard,
      FAJR,
      'Fajr',
      'الفجر',
      OFF,
      alerts(AlertType.Sound)
    );

    expect(result).toBe(false);
    expect(saved(FAJR)).toEqual(alerts(AlertType.Sound));
    expect(armedFor('Fajr')).toEqual([athanIds('Fajr')[0]]);

    // The phone starts taking them again, and the next return to the app puts the prayer right, although the
    // twelve-hour gate is shut
    refusedCancels.clear();
    refusedSchedules.clear();
    jest.setSystemTime(NOW + MINUTE);
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(armedFor('Fajr')).toEqual([...athanIds('Fajr')].sort());
    // Putting one prayer right is not a full pass, so it does not close the gate for the next twelve hours
    expect(store.get(lastNotificationScheduleAtom)).toBe(NOW);
  });

  it('puts an Extras prayer right too, from its own list', async () => {
    const DUHA = 3;
    const duhaIds = athanIds('Duha', ScheduleType.Extra);
    armedEarlier(DUHA, 'Duha', duhaIds, Database.addOneScheduledNotificationForPrayer, ScheduleType.Extra);
    store.set(extraPrayerAlertAtoms[DUHA], AlertType.Sound);
    refusedCancels.add(duhaIds[0]);
    refusedSchedules.add(duhaIds[1]);

    await expect(
      commitPrayerAlertChange(ScheduleType.Extra, DUHA, 'Duha', 'الضحى', OFF, alerts(AlertType.Sound))
    ).resolves.toBe(false);

    refusedCancels.clear();
    refusedSchedules.clear();
    jest.setSystemTime(NOW + MINUTE);
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(saved(DUHA, ScheduleType.Extra)).toEqual(alerts(AlertType.Sound));
    expect(armedFor('Duha')).toEqual([...duhaIds].sort());
  });

  it('stops asking once the prayer is right', async () => {
    armedEarlier(FAJR, 'Fajr', athanIds('Fajr'), Database.addOneScheduledNotificationForPrayer);
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
    refusedCancels.add(athanIds('Fajr')[0]);
    refusedSchedules.add(athanIds('Fajr')[1]);
    await commitPrayerAlertChange(ScheduleType.Standard, FAJR, 'Fajr', 'الفجر', OFF, alerts(AlertType.Sound));
    refusedCancels.clear();
    refusedSchedules.clear();
    jest.setSystemTime(NOW + MINUTE);
    await refreshNotifications();

    jest.setSystemTime(NOW + 2 * MINUTE);
    scheduleMock.mockClear();
    cancelMock.mockClear();
    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(scheduleMock).not.toHaveBeenCalled();
    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('leaves the alarms alone while no prayer needs putting right', async () => {
    store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);

    await expect(refreshNotifications()).resolves.toBeUndefined();

    expect(scheduleMock).not.toHaveBeenCalled();
    expect(cancelMock).not.toHaveBeenCalled();
  });
});
