/**
 * Reminder triggers when a London clock change falls between a reminder and its row
 *
 * A reminder fires its interval of real time before the row's own instant. Counted back on the clock face instead,
 * October's repeated hour would put it an hour early. Every expected trigger is UTC arithmetic on the row's instant,
 * checked separately against zoneinfo.
 */

import { scheduleNotificationAsync } from 'expo-notifications';

import { addOneScheduledReminderForPrayer } from '@/device/notifications';
import { AlertType, type ReadablePrayer, type ReminderInterval, ScheduleType } from '@/shared/types';

type Request = { identifier: string; trigger: { date: Date } };

const lastThird = (datetime: string, time: string, listDay: string): ReadablePrayer => ({
  type: ScheduleType.Extra,
  english: 'Last Third',
  arabic: 'آخر ثلث',
  datetime: new Date(datetime),
  time,
  belongsToDate: listDay,
});

// The 25 October 2026 list's real Last Third, at the second 01:00 (GMT): every reminder falls in the first pass of 01:xx
const OCTOBER_25 = lastThird('2026-10-25T01:00:00.000Z', '01:00', '2026-10-25');

// 02:10 BST, just after March's jump. Clock-face arithmetic lands in the skipped hour, which resolves to these same
// instants, so only October's rows can tell it from real time; these pin the interval where the clock jumps
const MARCH_29 = lastThird('2026-03-29T01:10:00.000Z', '02:10', '2026-03-29');

describe('a reminder across a 2026 London clock change', () => {
  beforeEach(() => {
    (scheduleNotificationAsync as jest.Mock).mockClear();
  });

  it.each<{ row: ReadablePrayer; interval: ReminderInterval; trigger: string }>([
    { row: OCTOBER_25, interval: 5, trigger: '2026-10-25T00:55:00.000Z' },
    { row: OCTOBER_25, interval: 10, trigger: '2026-10-25T00:50:00.000Z' },
    { row: OCTOBER_25, interval: 15, trigger: '2026-10-25T00:45:00.000Z' },
    { row: OCTOBER_25, interval: 20, trigger: '2026-10-25T00:40:00.000Z' },
    { row: OCTOBER_25, interval: 25, trigger: '2026-10-25T00:35:00.000Z' },
    { row: OCTOBER_25, interval: 30, trigger: '2026-10-25T00:30:00.000Z' },
    { row: MARCH_29, interval: 5, trigger: '2026-03-29T01:05:00.000Z' },
    { row: MARCH_29, interval: 10, trigger: '2026-03-29T01:00:00.000Z' },
    { row: MARCH_29, interval: 15, trigger: '2026-03-29T00:55:00.000Z' },
    { row: MARCH_29, interval: 20, trigger: '2026-03-29T00:50:00.000Z' },
    { row: MARCH_29, interval: 25, trigger: '2026-03-29T00:45:00.000Z' },
    { row: MARCH_29, interval: 30, trigger: '2026-03-29T00:40:00.000Z' },
  ])(
    'fires the $interval-minute reminder for the $row.belongsToDate Last Third at $trigger, its interval of real time before the row',
    async ({ row, interval, trigger }) => {
      await addOneScheduledReminderForPrayer(ScheduleType.Extra, row.belongsToDate, row, interval, AlertType.Silent);

      const requests = (scheduleNotificationAsync as jest.Mock).mock.calls.map(([request]) => request as Request);
      expect(requests.map((request) => [request.identifier, request.trigger.date.toISOString()])).toEqual([
        [`reminder_extra_last third_${row.belongsToDate}_${interval}`, trigger],
      ]);
    }
  );
});
