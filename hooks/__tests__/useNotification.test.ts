/**
 * Unit tests for hooks/useNotification.ts
 *
 * Tests the notification hook including:
 * - showSettingsDialog helper
 * - handleAlertChange for all AlertType variations
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
const mockClearAllScheduledNotificationForPrayer = jest.fn();
const mockAddMultipleScheduleNotificationsForPrayer = jest.fn();
const mockSetPrayerAlertType = jest.fn();
const mockSetReminderAlertType = jest.fn();
const mockSetReminderInterval = jest.fn();
const mockClearAllScheduledRemindersForPrayer = jest.fn();
const mockAddMultipleScheduleRemindersForPrayer = jest.fn();

jest.mock('@/stores/notifications', () => ({
  clearAllScheduledNotificationForPrayer: (...args: unknown[]) => mockClearAllScheduledNotificationForPrayer(...args),
  addMultipleScheduleNotificationsForPrayer: (...args: unknown[]) =>
    mockAddMultipleScheduleNotificationsForPrayer(...args),
  setPrayerAlertType: (...args: unknown[]) => mockSetPrayerAlertType(...args),
  setReminderAlertType: (...args: unknown[]) => mockSetReminderAlertType(...args),
  setReminderInterval: (...args: unknown[]) => mockSetReminderInterval(...args),
  clearAllScheduledRemindersForPrayer: (...args: unknown[]) => mockClearAllScheduledRemindersForPrayer(...args),
  addMultipleScheduleRemindersForPrayer: (...args: unknown[]) => mockAddMultipleScheduleRemindersForPrayer(...args),
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
// handleAlertChange TESTS
// =============================================================================

describe('handleAlertChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertMock._lastButtons = undefined;
    mockClearAllScheduledNotificationForPrayer.mockResolvedValue(undefined);
    mockAddMultipleScheduleNotificationsForPrayer.mockResolvedValue(undefined);
  });

  describe('AlertType.Off', () => {
    it('clears notifications without checking permissions', async () => {
      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Off);

      expect(result).toBe(true);
      expect(mockClearAllScheduledNotificationForPrayer).toHaveBeenCalledWith(ScheduleType.Standard, 0);
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('works for Extra schedule type', async () => {
      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Extra, 2, 'Midnight', 'نصف الليل', AlertType.Off);

      expect(result).toBe(true);
      expect(mockClearAllScheduledNotificationForPrayer).toHaveBeenCalledWith(ScheduleType.Extra, 2);
    });
  });

  describe('AlertType.Silent', () => {
    it('schedules silent notifications when permissions granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Standard, 1, 'Sunrise', 'الشروق', AlertType.Silent);

      expect(result).toBe(true);
      expect(mockAddMultipleScheduleNotificationsForPrayer).toHaveBeenCalledWith(
        ScheduleType.Standard,
        1,
        'Sunrise',
        'الشروق',
        AlertType.Silent
      );
    });

    it('returns false when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const { handleAlertChange } = getUseNotification()();
      const changePromise = handleAlertChange(ScheduleType.Standard, 1, 'Sunrise', 'الشروق', AlertType.Silent);

      // Wait for alert to show
      await new Promise((resolve) => setTimeout(resolve, 10));
      await alertMock._pressButton('Cancel');

      const result = await changePromise;

      expect(result).toBe(false);
      expect(mockAddMultipleScheduleNotificationsForPrayer).not.toHaveBeenCalled();
    });
  });

  describe('AlertType.Sound', () => {
    it('schedules sound notifications when permissions granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Sound);

      expect(result).toBe(true);
      expect(mockAddMultipleScheduleNotificationsForPrayer).toHaveBeenCalledWith(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        AlertType.Sound
      );
    });

    it('requests permissions when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Sound);

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns false on scheduling error', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      mockAddMultipleScheduleNotificationsForPrayer.mockRejectedValue(new Error('Scheduling failed'));

      const { handleAlertChange } = getUseNotification()();

      const result = await handleAlertChange(ScheduleType.Standard, 0, 'Fajr', 'الفجر', AlertType.Sound);

      expect(result).toBe(false);
    });
  });
});

// =============================================================================
// commitAlertMenuChanges TESTS
// =============================================================================

describe('commitAlertMenuChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertMock._lastButtons = undefined;
    mockClearAllScheduledNotificationForPrayer.mockResolvedValue(undefined);
    mockClearAllScheduledRemindersForPrayer.mockResolvedValue(undefined);
    mockAddMultipleScheduleNotificationsForPrayer.mockResolvedValue(undefined);
    mockAddMultipleScheduleRemindersForPrayer.mockResolvedValue(undefined);
    mockSetPrayerAlertType.mockImplementation(() => {});
    mockSetReminderAlertType.mockImplementation(() => {});
    mockSetReminderInterval.mockImplementation(() => {});
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  const createState = (
    atTime: AlertType = AlertType.Off,
    reminder: AlertType = AlertType.Off,
    interval: 5 | 10 | 15 | 20 | 25 | 30 = 15
  ): AlertMenuState => ({
    atTimeAlert: atTime,
    reminderAlert: reminder,
    reminderInterval: interval,
  });

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
      expect(mockAddMultipleScheduleNotificationsForPrayer).not.toHaveBeenCalled();
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
      expect(mockAddMultipleScheduleNotificationsForPrayer).toHaveBeenCalled();
    });

    it('disables at-time alert (Sound -> Off)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound);
      const current = createState(AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockClearAllScheduledNotificationForPrayer).toHaveBeenCalled();
    });

    it('changes at-time alert type (Silent -> Sound)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Silent);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetPrayerAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Sound);
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
      expect(mockAddMultipleScheduleRemindersForPrayer).toHaveBeenCalled();
    });

    it('disables reminder (Sound -> Off)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound);
      const current = createState(AlertType.Sound, AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetReminderAlertType).toHaveBeenCalledWith(ScheduleType.Standard, 0, AlertType.Off);
      expect(mockClearAllScheduledRemindersForPrayer).toHaveBeenCalled();
    });

    it('changes reminder interval (15 -> 30)', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound, 15);
      const current = createState(AlertType.Sound, AlertType.Sound, 30);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(mockSetReminderInterval).toHaveBeenCalledWith(ScheduleType.Standard, 0, 30);
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
      mockSetPrayerAlertType.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(false);
    });
  });
});
