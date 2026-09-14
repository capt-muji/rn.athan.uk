/**
 * Unit tests for the permission fallbacks in hooks/useNotification.ts
 *
 * When notifications are refused, the settings dialog sends each platform to its own notification settings; and a
 * permission API that throws counts as a refusal, so no alert is saved that could never go off.
 */

import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

import { AlertType, ScheduleType } from '@/shared/types';

import { useNotification } from '../useNotification';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockSetPrayerAlertType = jest.fn();
const mockUpdatePrayerNotifications = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@/stores/notifications', () => ({
  setPrayerAlertType: (...args: unknown[]) => mockSetPrayerAlertType(...args),
  setReminderAlertType: jest.fn(),
  setReminderInterval: jest.fn(),
  updatePrayerNotifications: (...args: unknown[]) => mockUpdatePrayerNotifications(...args),
}));

jest.mock('@/device/notifications', () => ({}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const alertDialog = Alert as unknown as { alert: jest.Mock; _pressButton: (text: string) => Promise<void> };
const platform = Platform as { OS: string };
const shippedOS = platform.OS;

/** Lets the permission reads settle so the dialog is up */
const settle = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
  getPermissions.mockReset();
  requestPermissions.mockReset();
});

afterEach(() => {
  platform.OS = shippedOS;
});

describe('the settings dialog', () => {
  it.each<[string, unknown[][], unknown[][]]>([
    ['ios', [[]], []],
    ['android', [], [['android.settings.APP_NOTIFICATION_SETTINGS']]],
  ])(
    "on %s, opens that platform's notification settings and answers with the permission found on return",
    async (os, openSettingsCalls, sendIntentCalls) => {
      platform.OS = os;
      getPermissions.mockResolvedValueOnce({ status: 'denied' }).mockResolvedValueOnce({ status: 'granted' });
      requestPermissions.mockResolvedValue({ status: 'denied' });

      const answer = useNotification().ensurePermissions();
      await settle();
      await alertDialog._pressButton('Open Settings');

      await expect(answer).resolves.toBe(true);
      expect((Linking.openSettings as jest.Mock).mock.calls).toEqual(openSettingsCalls);
      expect((Linking.sendIntent as jest.Mock).mock.calls).toEqual(sendIntentCalls);
    }
  );
});

describe('a permission API that throws', () => {
  it.each<[string, () => void]>([
    ['reading the status', () => getPermissions.mockRejectedValue(new Error('unavailable'))],
    [
      'asking for permission',
      () => {
        getPermissions.mockResolvedValue({ status: 'denied' });
        requestPermissions.mockRejectedValue(new Error('unavailable'));
      },
    ],
  ])('while %s counts as a refusal, without offering Settings', async (_, arrange) => {
    arrange();

    await expect(useNotification().ensurePermissions()).resolves.toBe(false);
    expect(alertDialog.alert).not.toHaveBeenCalled();
  });

  it('leaves an alert being turned on unsaved and unscheduled', async () => {
    getPermissions.mockRejectedValue(new Error('unavailable'));

    const committed = await useNotification().commitAlertMenuChanges(
      ScheduleType.Standard,
      0,
      'Fajr',
      'الفجر',
      { atTimeAlert: AlertType.Off, reminderAlert: AlertType.Off, reminderInterval: 15 },
      { atTimeAlert: AlertType.Sound, reminderAlert: AlertType.Off, reminderInterval: 15 }
    );

    expect(committed).toBe(false);
    expect(mockSetPrayerAlertType).not.toHaveBeenCalled();
    expect(mockUpdatePrayerNotifications).not.toHaveBeenCalled();
  });
});
