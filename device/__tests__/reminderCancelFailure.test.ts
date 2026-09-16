/**
 * clearAllScheduledRemindersForPrayer in device/notifications.ts when a cancel fails
 *
 * Only Android can refuse a cancel (it rejects with ERR_NOTIFICATIONS_FAILED_TO_CANCEL; iOS removes the
 * request and never rejects). One refused reminder must not leave the prayer's other reminders armed,
 * and must not reject: it is ANSWERED instead, so the caller can delete the records of the cancels that
 * landed and keep the record of the one that did not. The failure is logged with the identifier that failed.
 */

import { cancelScheduledNotificationAsync } from 'expo-notifications';

import { clearAllScheduledRemindersForPrayer } from '@/device/notifications';
import logger from '@/shared/logger';
import { AlertType, ScheduleType } from '@/shared/types';

const mockGetReminders = jest.fn();

jest.mock('@/stores/database', () => ({
  getAllScheduledRemindersForPrayer: (...args: unknown[]) => mockGetReminders(...args),
}));

const IDS = [
  'reminder_extra_suhoor_2026-10-24_15',
  'reminder_extra_suhoor_2026-10-25_15',
  'reminder_extra_suhoor_2026-10-26_15',
];

const record = (id: string) => ({
  id,
  date: id.slice(22, 32),
  time: '05:04',
  englishName: 'Suhoor',
  arabicName: 'السحور',
  alertType: AlertType.Silent,
});

/** The rejection expo-notifications' Android NotificationScheduler gives for a cancel that fails */
const androidCancelFailure = () =>
  Object.assign(new Error('Failed to cancel notification.'), { code: 'ERR_NOTIFICATIONS_FAILED_TO_CANCEL' });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetReminders.mockReturnValue(IDS.map(record));
});

afterEach(() => {
  (cancelScheduledNotificationAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
});

describe('clearAllScheduledRemindersForPrayer', () => {
  it.each([
    { label: 'the first', failing: [IDS[0]] },
    { label: 'the middle', failing: [IDS[1]] },
    { label: 'the last', failing: [IDS[2]] },
    { label: 'every', failing: IDS },
  ])(
    'asks the OS to cancel every reminder and answers with the refused one when $label cancel fails',
    async ({ failing }) => {
      const errors = new Map(failing.map((id) => [id, androidCancelFailure()]));
      (cancelScheduledNotificationAsync as jest.Mock).mockImplementation(async (id: string) => {
        const error = errors.get(id);
        if (error) throw error;
      });

      await expect(clearAllScheduledRemindersForPrayer(ScheduleType.Extra, 2)).resolves.toEqual(failing);

      expect(mockGetReminders).toHaveBeenCalledWith(ScheduleType.Extra, 2);
      expect((cancelScheduledNotificationAsync as jest.Mock).mock.calls.map((call) => call[0])).toEqual(IDS);
      expect(logger.warn).toHaveBeenCalledTimes(failing.length);
      for (const id of failing) {
        expect(logger.warn).toHaveBeenCalledWith('REMINDER SYSTEM: Failed to cancel reminder:', {
          id,
          error: errors.get(id),
        });
      }
    }
  );
});
