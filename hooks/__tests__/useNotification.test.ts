/**
 * Unit tests for hooks/useNotification.ts
 *
 * Tests the showSettingsDialog helper function that prompts users
 * to enable notifications in system settings.
 */

import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

interface AlertMock {
  alert: jest.Mock;
  _lastButtons: AlertButton[] | undefined;
  _pressButton: (text: string) => Promise<void>;
}

// Cast Alert to our mock type for test access
const alertMock = Alert as unknown as AlertMock;

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// =============================================================================
// showSettingsDialog TESTS
// =============================================================================

describe('showSettingsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Alert mock state
    alertMock._lastButtons = undefined;
  });

  // Import the module after mocks are set up
  // We need to test the behavior through the useNotification hook
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useNotification } = require('../useNotification');

  describe('Alert dialog behavior', () => {
    it('shows alert with correct title and message', async () => {
      // Mock permissions as denied
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { ensurePermissions } = useNotification();

      // Start the permission check (don't await yet)
      const permissionPromise = ensurePermissions();

      // Wait for Alert to be called
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Notifications',
        'Prayer time notifications are disabled. Would you like to enable them in settings?',
        expect.any(Array)
      );

      // Simulate cancel to resolve the promise
      await alertMock._pressButton('Cancel');
      await permissionPromise;
    });

    it('has Cancel and Open Settings buttons', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { ensurePermissions } = useNotification();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const buttons = alertMock._lastButtons;

      expect(buttons).toHaveLength(2);
      expect(buttons?.[0]?.text).toBe('Cancel');
      expect(buttons?.[1]?.text).toBe('Open Settings');

      await alertMock._pressButton('Cancel');
      await permissionPromise;
    });

    it('returns false when Cancel is pressed', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { ensurePermissions } = useNotification();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await alertMock._pressButton('Cancel');

      const result = await permissionPromise;
      expect(result).toBe(false);
    });

    it('opens iOS settings when Open Settings is pressed on iOS', async () => {
      (Notifications.getPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'granted' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useNotification: useNotificationFresh } = require('../useNotification');
      const { ensurePermissions } = useNotificationFresh();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await alertMock._pressButton('Open Settings');

      await permissionPromise;

      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('returns true when permission granted after returning from settings', async () => {
      (Notifications.getPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'granted' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useNotification: useNotificationFresh } = require('../useNotification');
      const { ensurePermissions } = useNotificationFresh();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await alertMock._pressButton('Open Settings');

      const result = await permissionPromise;
      expect(result).toBe(true);
    });

    it('returns false when permission still denied after returning from settings', async () => {
      (Notifications.getPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useNotification: useNotificationFresh } = require('../useNotification');
      const { ensurePermissions } = useNotificationFresh();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await alertMock._pressButton('Open Settings');

      const result = await permissionPromise;
      expect(result).toBe(false);
    });
  });

  describe('permission flow', () => {
    it('returns true immediately if permission already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { ensurePermissions } = useNotification();
      const result = await ensurePermissions();

      expect(result).toBe(true);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('returns true if permission granted on first request', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { ensurePermissions } = useNotification();
      const result = await ensurePermissions();

      expect(result).toBe(true);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('shows settings dialog only after request is denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { ensurePermissions } = useNotification();
      const permissionPromise = ensurePermissions();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled();

      await alertMock._pressButton('Cancel');
      await permissionPromise;
    });
  });
});
