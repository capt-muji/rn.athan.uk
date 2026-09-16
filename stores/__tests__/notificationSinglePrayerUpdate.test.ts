/**
 * Committing one prayer's alert sheet: `commitPrayerAlertChange` (stores/notifications.ts)
 *
 * The sheet saves the at-time alert, the reminder alert and the interval, then calls this. A reminder is armed only
 * while both the at-time alert and the reminder are on, counting back the saved interval from the prayer's own
 * instant on every day still to come. With either off, every reminder that prayer had is cancelled, since a reminder
 * with no athan behind it is one the user did not ask for. Times go through the app's own transform, and every
 * expected instant is worked out by hand from London's clock: BST is UTC+1 in late August.
 */

import * as Notifications from 'expo-notifications';

import { prayerNotificationIdentifier, reminderNotificationIdentifier } from '@/device/notifications';
import { EXTRAS_ARABIC, EXTRAS_ENGLISH, PRAYERS_ARABIC, PRAYERS_ENGLISH } from '@/shared/constants';
import { transformApiData } from '@/shared/prayer';
import { AlertType, type ReminderInterval, ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { commitPrayerAlertChange, setReminderInterval } from '@/stores/notifications';

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

// 09:00 BST on Saturday 29 August 2026
const NOW = new Date('2026-08-29T08:00:00.000Z');
const TODAY = '2026-08-29';
const TOMORROW = '2026-08-30';

// London-shaped late-August times: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha
const DAYS: Record<string, string[]> = {
  [TODAY]: ['04:23', '06:10', '13:05', '16:50', '19:55', '21:20'],
  [TOMORROW]: ['04:25', '06:11', '13:05', '16:49', '19:53', '21:18'],
};

const INTERVAL = 15 as ReminderInterval;

/** The three settings an alert sheet closes on */
const alerts = (atTimeAlert: AlertType, reminderAlert: AlertType = AlertType.Off) => ({
  atTimeAlert,
  reminderAlert,
  reminderInterval: INTERVAL,
});

/** Every alert of a prayer switched off */
const OFF = alerts(AlertType.Off);

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);

const osState = new Set<string>();

type Request = { identifier: string; trigger: { date: Date } };

/** Every identifier handed to the OS, with the trigger it was last given */
const triggers = () =>
  Object.fromEntries(
    scheduleMock.mock.calls.map(([call]) => {
      const request = call as unknown as Request;
      return [request.identifier, request.trigger.date.toISOString()];
    })
  );

/** Asr on Standard, and Duha on Extras, whose instant is Sunrise plus 20 minutes */
const PRAYERS = [
  {
    type: ScheduleType.Standard,
    name: 'Asr',
    index: PRAYERS_ENGLISH.indexOf('Asr'),
    arabic: PRAYERS_ARABIC[PRAYERS_ENGLISH.indexOf('Asr')],
    // 16:50 and 16:49 BST, reminders 15 minutes earlier
    armed: {
      [prayerNotificationIdentifier(ScheduleType.Standard, 'Asr', TODAY)]: '2026-08-29T15:50:00.000Z',
      [reminderNotificationIdentifier(ScheduleType.Standard, 'Asr', TODAY, INTERVAL)]: '2026-08-29T15:35:00.000Z',
      [prayerNotificationIdentifier(ScheduleType.Standard, 'Asr', TOMORROW)]: '2026-08-30T15:49:00.000Z',
      [reminderNotificationIdentifier(ScheduleType.Standard, 'Asr', TOMORROW, INTERVAL)]: '2026-08-30T15:34:00.000Z',
    },
  },
  {
    type: ScheduleType.Extra,
    name: 'Duha',
    index: EXTRAS_ENGLISH.indexOf('Duha'),
    arabic: EXTRAS_ARABIC[EXTRAS_ENGLISH.indexOf('Duha')],
    // Today's 06:30 BST has passed at 09:00; tomorrow's is 06:31 BST, its reminder 06:16 BST
    armed: {
      [prayerNotificationIdentifier(ScheduleType.Extra, 'Duha', TOMORROW)]: '2026-08-30T05:31:00.000Z',
      [reminderNotificationIdentifier(ScheduleType.Extra, 'Duha', TOMORROW, INTERVAL)]: '2026-08-30T05:16:00.000Z',
    },
  },
];

/** A reminder the prayer had before this commit, recorded and armed */
const seedReminder = (type: ScheduleType, name: string, index: number, date: string) => {
  const id = reminderNotificationIdentifier(type, name, date, INTERVAL);
  Database.addOneScheduledReminderForPrayer(type, index, {
    id,
    date,
    time: '12:00',
    englishName: name,
    arabicName: '',
    alertType: AlertType.Silent,
  });
  osState.add(id);
  return id;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  osState.clear();
  Database.database.clearAll();

  for (const [date, [fajr, sunrise, dhuhr, asr, magrib, isha]] of Object.entries(DAYS)) {
    const [stored] = transformApiData({
      city: 'london',
      times: { [date]: { fajr, sunrise, dhuhr, asr, magrib, isha } },
    });
    Database.database.set(`prayer_${date}`, JSON.stringify(stored));
  }

  scheduleMock.mockImplementation(async (request) => {
    const identifier = (request as { identifier: string }).identifier;
    osState.add(identifier);
    return identifier;
  });
  cancelMock.mockImplementation(async (identifier: string) => {
    osState.delete(identifier);
  });
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  scheduleMock.mockImplementation(
    async (request) => (request as { identifier?: string })?.identifier ?? 'mock-notification-id'
  );
  cancelMock.mockResolvedValue(undefined);
});

// =============================================================================
// TESTS
// =============================================================================

describe.each(PRAYERS)('committing $type $name', ({ type, name, index, arabic, armed }) => {
  const athanIds = Object.keys(armed).filter((id) => id.startsWith('athan_'));
  const reminderIds = Object.keys(armed).filter((id) => id.startsWith('reminder_'));

  /** What is filed for this prayer, as [id, alert type], sorted by id */
  const filed = (records: { id: string; alertType: AlertType }[]) =>
    records.map(({ id, alertType }) => [id, alertType]).sort(([a], [b]) => String(a).localeCompare(String(b)));

  const withType = (ids: string[], alertType: AlertType) => filed(ids.map((id) => ({ id, alertType })));

  /**
   * The records a later Off commit or sweep reads: under this prayer's schedule and index, and nowhere else on
   * that schedule, since a record filed under another prayer leaves this one's alarm with nothing to cancel it
   */
  const expectFiled = (athans: (string | AlertType)[][], reminders: (string | AlertType)[][]) => {
    expect(filed(Database.getAllScheduledNotificationsForPrayer(type, index))).toEqual(athans);
    expect(filed(Database.getAllScheduledRemindersForPrayer(type, index))).toEqual(reminders);
    expect(filed(Database.getAllScheduledNotificationsForSchedule(type))).toEqual(athans);
    expect(filed(Database.getAllScheduledRemindersForSchedule(type))).toEqual(reminders);
  };

  beforeEach(() => {
    setReminderInterval(type, index, INTERVAL);
  });

  it('arms the prayer at its instant and its reminder the saved interval before, on every day still to come', async () => {
    await commitPrayerAlertChange(type, index, name, arabic, alerts(AlertType.Silent, AlertType.Sound), OFF);

    expect(triggers()).toEqual(armed);
    expect([...osState].sort()).toEqual(Object.keys(armed).sort());
    // Each with its own alert type: the athan Silent and its reminder Sound
    expectFiled(withType(athanIds, AlertType.Silent), withType(reminderIds, AlertType.Sound));
  });

  it('arms nothing while the at-time alert is off, whatever the reminder says, and cancels the reminders it had', async () => {
    const earlier = [seedReminder(type, name, index, TODAY), seedReminder(type, name, index, TOMORROW)];

    await commitPrayerAlertChange(type, index, name, arabic, alerts(AlertType.Off, AlertType.Sound), OFF);

    expect(scheduleMock).not.toHaveBeenCalled();
    expect(cancelMock.mock.calls.map(([id]) => id).sort()).toEqual(earlier.sort());
    expect([...osState]).toEqual([]);
    expectFiled([], []);
  });

  it('arms the at-time alert alone and cancels the reminders it had when the reminder is off', async () => {
    seedReminder(type, name, index, TODAY);
    seedReminder(type, name, index, TOMORROW);

    await commitPrayerAlertChange(type, index, name, arabic, alerts(AlertType.Sound, AlertType.Off), OFF);

    const athansOnly = Object.fromEntries(Object.entries(armed).filter(([id]) => id.startsWith('athan_')));
    expect(triggers()).toEqual(athansOnly);
    expect([...osState].sort()).toEqual(Object.keys(athansOnly).sort());
    expectFiled(withType(athanIds, AlertType.Sound), []);
  });
});
