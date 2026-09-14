/**
 * Unit tests for the foreground presentation set by hooks/useNotification.ts
 *
 * A prayer notification that arrives while the app is open must still play its Athan and show like any other. The
 * module registers that with expo-notifications as it loads, before any screen calls the hook.
 */

import * as Notifications from 'expo-notifications';

import '../useNotification';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@/stores/notifications', () => ({}));
jest.mock('@/device/notifications', () => ({}));

describe('foreground notifications', () => {
  it('play their sound, set the badge, and show a banner and a list entry', async () => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const [handler] = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0];

    await expect(handler.handleNotification({})).resolves.toEqual({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    });
  });
});
