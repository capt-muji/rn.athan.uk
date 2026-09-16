/**
 * Unit tests for the permission fallbacks in hooks/useNotification.ts
 *
 * When notifications are refused, the settings dialog opens the app's own settings page on both platforms and reads the
 * permission again once the app is back in the foreground, because the native call answers as soon as Settings opens.
 * A dialog closed without a button, a Settings screen that cannot open, or a permission API that throws counts as a
 * refusal: no alert is saved that could never go off, and the caller is never left waiting for an answer.
 */

import * as Notifications from 'expo-notifications';
import { Alert, AppState, type AppStateStatus, Linking, Platform } from 'react-native';

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
const listenToAppState = AppState.addEventListener as jest.Mock;
const platform = Platform as { OS: string };
const shippedOS = platform.OS;

/** Lets the permission reads settle so the dialog is up */
const settle = () => new Promise((resolve) => setImmediate(resolve));

/** Reports app state changes to every listener the dialog added, in order, as the platform does */
const reportAppStates = (...states: AppStateStatus[]) => {
  for (const [, listener] of listenToAppState.mock.calls) {
    for (const state of states) listener(state);
  }
};

/** What a promise has answered so far, read without waiting for it */
const answerSoFar = async <T>(promise: Promise<T>): Promise<{ answered: boolean; value?: T }> => {
  let result: { answered: boolean; value?: T } = { answered: false };
  promise.then((value) => {
    result = { answered: true, value };
  });
  await settle();
  return result;
};

/** Notifications refused on the first read and at the prompt, so the settings dialog comes up */
const refuseUntilSettings = () => {
  getPermissions.mockResolvedValueOnce({ status: 'denied' });
  requestPermissions.mockResolvedValue({ status: 'denied' });
};

beforeEach(() => {
  jest.clearAllMocks();
  getPermissions.mockReset();
  requestPermissions.mockReset();
});

afterEach(() => {
  platform.OS = shippedOS;
});

describe('the settings dialog', () => {
  it.each(['ios', 'android'])(
    "on %s, opens the app's own settings page and answers with the permission read once the app is back",
    async (os) => {
      platform.OS = os;
      refuseUntilSettings();
      getPermissions.mockResolvedValueOnce({ status: 'granted' });
      const answer = useNotification().ensurePermissions();
      await settle();

      const pressed = alertDialog._pressButton('Open Settings');
      await settle();
      reportAppStates('background', 'active');
      await pressed;

      expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
      expect(getPermissions).toHaveBeenCalledTimes(2);
      expect((Linking.openSettings as jest.Mock).mock.calls).toEqual([[]]);
      expect(Linking.sendIntent).not.toHaveBeenCalled();
    }
  );

  // the state the app reports on leaving for Settings: Android reports background, iOS inactive first
  it.each<AppStateStatus>(['background', 'inactive'])(
    'reads the permission only once the app has gone %s for Settings and come back',
    async (away) => {
      refuseUntilSettings();
      getPermissions.mockResolvedValueOnce({ status: 'granted' });
      const answer = useNotification().ensurePermissions();
      await settle();
      const pressed = alertDialog._pressButton('Open Settings');
      await settle();

      const whileInSettings = { reads: getPermissions.mock.calls.length, ...(await answerSoFar(answer)) };
      reportAppStates(away, 'active');
      await pressed;

      expect(whileInSettings).toEqual({ reads: 1, answered: false });
      expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
    }
  );

  it('does not take the app reporting active before it has left for Settings as the return', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    const answer = useNotification().ensurePermissions();
    await settle();
    alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('active');

    expect(await answerSoFar(answer)).toEqual({ answered: false });
    expect(getPermissions).toHaveBeenCalledTimes(1);
  });

  it('reads the return even when the app has left and come back before Settings answers that it opened', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    (Linking.openSettings as jest.Mock).mockImplementationOnce(async () => {
      reportAppStates('inactive', 'background', 'active');
    });
    const answer = useNotification().ensurePermissions();
    await settle();

    await alertDialog._pressButton('Open Settings');

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: true });
  });

  it('answers no when Android closes the dialog without a button', async () => {
    refuseUntilSettings();
    const answer = useNotification().ensurePermissions();
    await settle();

    const [, , , options] = alertDialog.alert.mock.calls[0];
    options.onDismiss();

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
  });

  it('stops listening to app state changes once the app is back', async () => {
    refuseUntilSettings();
    getPermissions.mockResolvedValueOnce({ status: 'granted' });
    const answer = useNotification().ensurePermissions();
    await settle();
    const pressed = alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('background', 'active');
    await pressed;
    await answer;

    expect(listenToAppState.mock.results[0].value.remove).toHaveBeenCalledTimes(1);
  });

  // the platform, and the message its native call rejects with
  it.each([
    ['ios', 'Unable to open app settings'],
    ['android', 'Could not open the Settings'],
  ])(
    'on %s, answers no and stops listening when Settings cannot open, without reading the permission again',
    async (os, message) => {
      platform.OS = os;
      refuseUntilSettings();
      (Linking.openSettings as jest.Mock).mockRejectedValueOnce(new Error(message));
      const answer = useNotification().ensurePermissions();
      await settle();

      await alertDialog._pressButton('Open Settings');

      expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
      expect(getPermissions).toHaveBeenCalledTimes(1);
      expect(listenToAppState.mock.results[0].value.remove).toHaveBeenCalledTimes(1);
    }
  );

  it('answers no when the permission cannot be read once the app is back', async () => {
    refuseUntilSettings();
    getPermissions.mockRejectedValueOnce(new Error('unavailable'));
    const answer = useNotification().ensurePermissions();
    await settle();
    const pressed = alertDialog._pressButton('Open Settings');
    await settle();

    reportAppStates('background', 'active');
    await pressed;

    expect(await answerSoFar(answer)).toEqual({ answered: true, value: false });
  });
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
