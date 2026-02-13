/**
 * Unit tests for hooks/useNotification.ts
 *
 * Tests the notification hook including:
 * - showSettingsDialog helper
 * - commitAlertMenuChanges with deferred commit pattern
 * - checkInitialPermissions
 * - ensurePermissions flow
 */

import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

import { AlertMenuState, AlertType, ScheduleType } from '@/shared/types';

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

// Logger is mocked via moduleNameMapper in jest.config.js

// Mock NotificationStore functions
const mockSetPrayerAlertType = jest.fn();
const mockSetReminderAlertType = jest.fn();
const mockSetReminderInterval = jest.fn();
const mockUpdatePrayerNotifications = jest.fn();

jest.mock('@/stores/notifications', () => ({
  setPrayerAlertType: (...args: unknown[]) => mockSetPrayerAlertType(...args),
  setReminderAlertType: (...args: unknown[]) => mockSetReminderAlertType(...args),
  setReminderInterval: (...args: unknown[]) => mockSetReminderInterval(...args),
  updatePrayerNotifications: (...args: unknown[]) => mockUpdatePrayerNotifications(...args),
}));

// Helper to get fresh useNotification module with mocks properly applied
const getUseNotification = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../useNotification').useNotification;
};

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

// =============================================================================
// checkInitialPermissions TESTS
// =============================================================================

describe('checkInitialPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertMock._lastButtons = undefined;
  });

  it('returns true when permissions already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const { checkInitialPermissions } = getUseNotification()();
    const result = await checkInitialPermissions();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permissions when not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const { checkInitialPermissions } = getUseNotification()();
    const result = await checkInitialPermissions();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('returns false when permission request is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { checkInitialPermissions } = getUseNotification()();
    const result = await checkInitialPermissions();

    expect(result).toBe(false);
  });

  it('returns false on error', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Permission error'));

    const { checkInitialPermissions } = getUseNotification()();
    const result = await checkInitialPermissions();

    expect(result).toBe(false);
  });
});

// =============================================================================
// commitAlertMenuChanges TESTS
// =============================================================================

describe('commitAlertMenuChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertMock._lastButtons = undefined;
    mockUpdatePrayerNotifications.mockResolvedValue(undefined);
    mockSetPrayerAlertType.mockImplementation(() => {});
    mockSetReminderAlertType.mockImplementation(() => {});
    mockSetReminderInterval.mockImplementation(() => {});
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  // Shared constants for combination matrix tests
  const ALERT_TYPES = [AlertType.Off, AlertType.Silent, AlertType.Sound] as const;
  const ALERT_TYPE_NAMES: Record<AlertType, string> = {
    [AlertType.Off]: 'Off',
    [AlertType.Silent]: 'Silent',
    [AlertType.Sound]: 'Sound',
  };

  const createState = (
    atTime: AlertType = AlertType.Off,
    reminder: AlertType = AlertType.Off,
    interval: 5 | 10 | 15 | 20 | 25 | 30 = 15
  ): AlertMenuState => ({
    atTimeAlert: atTime,
    reminderAlert: reminder,
    reminderInterval: interval,
  });

  const expectCorrectScheduling = (
    atTimeAlert: AlertType,
    reminderAlert: AlertType,
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string
  ) => {
    if (atTimeAlert === AlertType.Off && reminderAlert === AlertType.Off) {
      expect(mockUpdatePrayerNotifications).not.toHaveBeenCalled();
    } else {
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        scheduleType,
        prayerIndex,
        englishName,
        arabicName,
        atTimeAlert,
        reminderAlert
      );
    }
  };

  describe('no changes detected', () => {
    it('returns true without scheduling when no changes', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const state = createState(AlertType.Sound, AlertType.Silent, 15);

      const result = await commitAlertMenuChanges(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        state, // original
        state // current (same)
      );

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).not.toHaveBeenCalled();
      expect(mockUpdatePrayerNotifications).not.toHaveBeenCalled();
    });
  });

  describe('at-time alert changes', () => {
    it('enables at-time alert (Off -> Sound)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Sound);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound,
        AlertType.Off
      );
    });

    it('disables at-time alert (Sound -> Off)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound);
      const current = createState(AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Off,
        AlertType.Off
      );
    });

    it('changes at-time alert type (Silent -> Sound)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Silent);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Sound);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound,
        AlertType.Off
      );
    });
  });

  describe('reminder changes', () => {
    it('enables reminder (Off -> Sound)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Off);
      const current = createState(AlertType.Sound, AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Sound);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound,
        AlertType.Sound
      );
    });

    it('disables reminder (Sound -> Off)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound);
      const current = createState(AlertType.Sound, AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound,
        AlertType.Off
      );
    });

    it('changes reminder interval (15 -> 30)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound, 15);
      const current = createState(AlertType.Sound, AlertType.Sound, 30);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 0, 30);
      expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound,
        AlertType.Sound
      );
    });
  });

  describe('permission handling', () => {
    it('requests permissions when enabling notifications', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const commitPromise = commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      // Wait for alert to show
      await new Promise((resolve) => setTimeout(resolve, 10));
      await alertMock._pressButton('Cancel');

      const result = await commitPromise;

      expect(result).toBe(false);
      expect(mockSetPrayerAlertType).not.toHaveBeenCalled();
    });

    it('skips permission check when disabling all notifications', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound);
      const current = createState(AlertType.Off, AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns false on error', async () => {
      mockUpdatePrayerNotifications.mockRejectedValue(new Error('Scheduling error'));

      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(false);
    });

    it('rolls back preferences when scheduling fails', async () => {
      mockUpdatePrayerNotifications.mockRejectedValue(new Error('Scheduling error'));

      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off, AlertType.Off, 15);
      const current = createState(AlertType.Sound, AlertType.Sound, 30);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(false);

      // Preferences are first set to new values, then rolled back to original
      // Last call should be the rollback to original values
      expect(mockSetPrayerAlertType).toHaveBeenLastCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockSetReminderAlertType).toHaveBeenLastCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockSetReminderInterval).toHaveBeenLastCalledWith(ScheduleType.Standard, 0, 15);
    });
  });

  // ===========================================================================
  // COMPREHENSIVE COMBINATION MATRIX
  // Tests all 9 combinations of at-time (Off, Silent, Sound) × reminder (Off, Silent, Sound)
  // ===========================================================================

  describe('all at-time × reminder combinations', () => {
    ALERT_TYPES.forEach((atTimeAlert) => {
      ALERT_TYPES.forEach((reminderAlert) => {
        const atTimeName = ALERT_TYPE_NAMES[atTimeAlert];
        const reminderName = ALERT_TYPE_NAMES[reminderAlert];

        describe(`at-time=${atTimeName}, reminder=${reminderName}`, () => {
          it('schedules correct notifications', async () => {
            const { commitAlertMenuChanges } = getUseNotification()();
            const original = createState(AlertType.Off, AlertType.Off);
            const current = createState(atTimeAlert, reminderAlert);

            const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

            expect(result).toBe(true);
            expectCorrectScheduling(atTimeAlert, reminderAlert, ScheduleType.Standard, 0, 'Fajr', 'الفجر');
          });

          it('persists correct preferences', async () => {
            const { commitAlertMenuChanges } = getUseNotification()();
            const original = createState(AlertType.Off, AlertType.Off);
            const current = createState(atTimeAlert, reminderAlert, 20);

            await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

            expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, atTimeAlert);
            expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, reminderAlert);
            expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 0, 20);
          });

          it('calls updatePrayerNotifications with correct args', async () => {
            const { commitAlertMenuChanges } = getUseNotification()();
            // Use Sound/Sound with interval 30 as original so there's always a change
            const original = createState(AlertType.Sound, AlertType.Sound, 30);
            const current = createState(atTimeAlert, reminderAlert, 15);

            await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

            expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
              ScheduleType.Standard,
              0,
              'Fajr',
              'الفجر',
              atTimeAlert,
              reminderAlert
            );
          });
        });
      });
    });
  });

  // ===========================================================================
  // STATE TRANSITION TESTS
  // Tests changing FROM one state TO another
  // ===========================================================================

  describe('state transitions', () => {
    describe('enabling both at-time and reminder simultaneously', () => {
      it('schedules both when going from Off/Off to Sound/Sound', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Off, AlertType.Off);
        const current = createState(AlertType.Sound, AlertType.Sound);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Sound
        );
      });

      it('schedules both when going from Off/Off to Silent/Silent', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Off, AlertType.Off);
        const current = createState(AlertType.Silent, AlertType.Silent);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Silent,
          AlertType.Silent
        );
      });

      it('saves interval before scheduling when enabling both with custom interval', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        // User's exact scenario: Off/Off with default interval -> Silent/Silent with 5 min
        const original = createState(AlertType.Off, AlertType.Off, 15);
        const current = createState(AlertType.Silent, AlertType.Silent, 5);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 3, 'Asr', 'العصر', original, current);

        expect(result).toBe(true);
        // Interval must be saved BEFORE scheduling so getReminderInterval reads correct value
        expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 3, 5);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          3,
          'Asr',
          'العصر',
          AlertType.Silent,
          AlertType.Silent
        );
      });
    });

    describe('disabling both at-time and reminder simultaneously', () => {
      it('clears both when going from Sound/Sound to Off/Off', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound);
        const current = createState(AlertType.Off, AlertType.Off);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Off,
          AlertType.Off
        );
      });
    });

    describe('changing types while keeping enabled', () => {
      it('reschedules when changing at-time from Silent to Sound', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Silent, AlertType.Silent);
        const current = createState(AlertType.Sound, AlertType.Silent);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Silent
        );
      });

      it('reschedules when changing reminder from Silent to Sound', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Silent);
        const current = createState(AlertType.Sound, AlertType.Sound);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Sound
        );
      });

      it('reschedules when changing at-time from Sound to Silent', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Off);
        const current = createState(AlertType.Silent, AlertType.Off);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Silent,
          AlertType.Off
        );
      });

      it('reschedules when changing reminder from Sound to Silent', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound);
        const current = createState(AlertType.Sound, AlertType.Silent);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Silent
        );
      });
    });

    describe('interval-only changes', () => {
      it('reschedules reminders when only interval changes (15 -> 30)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound, 15);
        const current = createState(AlertType.Sound, AlertType.Sound, 30);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 0, 30);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Sound
        );
      });

      it('reschedules reminders when only interval changes with Silent types (5 -> 20)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Silent, AlertType.Silent, 5);
        const current = createState(AlertType.Silent, AlertType.Silent, 20);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 0, 20);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Silent,
          AlertType.Silent
        );
      });

      it('reschedules when interval changes even with mixed types (Sound/Silent, 10 -> 25)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Silent, 10);
        const current = createState(AlertType.Sound, AlertType.Silent, 25);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Sound,
          AlertType.Silent
        );
      });
    });

    describe('disabling at-time also disables reminder scheduling', () => {
      it('does not schedule reminder when disabling at-time (Sound/Sound -> Off/Sound)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound);
        const current = createState(AlertType.Off, AlertType.Sound);

        const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Standard,
          0,
          'Fajr',
          'الفجر',
          AlertType.Off,
          AlertType.Sound
        );
        // Preferences are still saved
        expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Off);
        expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Sound);
      });
    });
  });

  // ===========================================================================
  // EXTRA SCHEDULE TYPE TESTS - ALL 9 COMBINATIONS
  // ===========================================================================

  describe('Extra schedule type - all combinations', () => {
    ALERT_TYPES.forEach((atTimeAlert) => {
      ALERT_TYPES.forEach((reminderAlert) => {
        const atTimeName = ALERT_TYPE_NAMES[atTimeAlert];
        const reminderName = ALERT_TYPE_NAMES[reminderAlert];
        const isNoChange = atTimeAlert === AlertType.Off && reminderAlert === AlertType.Off;

        it(`Extra: at-time=${atTimeName}, reminder=${reminderName}`, async () => {
          const { commitAlertMenuChanges } = getUseNotification()();
          // Use Sound/Sound/30 as original to ensure change detection triggers
          // (except for Off/Off which we test separately as a no-op)
          const original = isNoChange
            ? createState(AlertType.Off, AlertType.Off)
            : createState(AlertType.Sound, AlertType.Sound, 30);
          const current = createState(atTimeAlert, reminderAlert, 15);

          const result = await commitAlertMenuChanges(
            ScheduleType.Extra,
            2,
            'Midnight',
            'نصف الليل',
            original,
            current
          );

          expect(result).toBe(true);

          if (isNoChange) {
            // Off/Off -> Off/Off: no changes, early return
            expect(mockUpdatePrayerNotifications).not.toHaveBeenCalled();
            expect(mockSetPrayerAlertType).not.toHaveBeenCalled();
            return;
          }

          expectCorrectScheduling(atTimeAlert, reminderAlert, ScheduleType.Extra, 2, 'Midnight', 'نصف الليل');

          // Verify preferences are saved
          expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Extra, 2, atTimeAlert);
          expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Extra, 2, reminderAlert);
        });
      });
    });

    describe('Extra schedule state transitions', () => {
      it('Extra: enables both (Off/Off -> Sound/Sound)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Off, AlertType.Off);
        const current = createState(AlertType.Sound, AlertType.Sound);

        const result = await commitAlertMenuChanges(
          ScheduleType.Extra,
          1,
          'Last Third',
          'الثلث الأخير',
          original,
          current
        );

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Extra,
          1,
          'Last Third',
          'الثلث الأخير',
          AlertType.Sound,
          AlertType.Sound
        );
      });

      it('Extra: disables both (Sound/Sound -> Off/Off)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound);
        const current = createState(AlertType.Off, AlertType.Off);

        const result = await commitAlertMenuChanges(ScheduleType.Extra, 0, 'Suhoor', 'السحور', original, current);

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Extra,
          0,
          'Suhoor',
          'السحور',
          AlertType.Off,
          AlertType.Off
        );
      });

      it('Extra: interval change (15 -> 30)', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound, 15);
        const current = createState(AlertType.Sound, AlertType.Sound, 30);

        const result = await commitAlertMenuChanges(ScheduleType.Extra, 2, 'Midnight', 'نصف الليل', original, current);

        expect(result).toBe(true);
        expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Extra, 2, 30);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Extra,
          2,
          'Midnight',
          'نصف الليل',
          AlertType.Sound,
          AlertType.Sound
        );
      });

      it('Extra: disabling at-time keeps reminder preference but does not schedule', async () => {
        const { commitAlertMenuChanges } = getUseNotification()();
        const original = createState(AlertType.Sound, AlertType.Sound);
        const current = createState(AlertType.Off, AlertType.Sound);

        const result = await commitAlertMenuChanges(
          ScheduleType.Extra,
          1,
          'Last Third',
          'الثلث الأخير',
          original,
          current
        );

        expect(result).toBe(true);
        expect(mockUpdatePrayerNotifications).toHaveBeenCalledWith(
          ScheduleType.Extra,
          1,
          'Last Third',
          'الثلث الأخير',
          AlertType.Off,
          AlertType.Sound
        );
        // Preferences still saved
        expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Extra, 1, AlertType.Off);
        expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Extra, 1, AlertType.Sound);
      });
    });
  });
});
