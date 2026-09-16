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
import { Alert, AppState, Linking } from 'react-native';

import { type AlertMenuState, AlertType, ScheduleType } from '@/shared/types';

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

/** The app leaving for Settings and coming back, reported to every app state listener the dialog added */
const returnFromSettings = () => {
  for (const [, listener] of (AppState.addEventListener as jest.Mock).mock.calls) {
    listener('background');
    listener('active');
  }
};

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
const mockCommitPrayerAlertChange = jest.fn();
const mockGetSoundPreference = jest.fn();
const mockSetSoundPreference = jest.fn();
const mockRescheduleAllNotifications = jest.fn();

jest.mock('@/stores/notifications', () => ({
  commitPrayerAlertChange: (...args: unknown[]) => mockCommitPrayerAlertChange(...args),
  getSoundPreference: (...args: unknown[]) => mockGetSoundPreference(...args),
  setSoundPreference: (...args: unknown[]) => mockSetSoundPreference(...args),
  rescheduleAllNotifications: (...args: unknown[]) => mockRescheduleAllNotifications(...args),
}));

const mockUpdateAndroidChannel = jest.fn();

jest.mock('@/device/notifications', () => ({
  updateAndroidChannel: (...args: unknown[]) => mockUpdateAndroidChannel(...args),
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
        expect.any(Array),
        { onDismiss: expect.any(Function) }
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

      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

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

      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

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

      const pressed = alertMock._pressButton('Open Settings');
      await new Promise((resolve) => setTimeout(resolve, 10));
      returnFromSettings();
      await pressed;

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
    mockCommitPrayerAlertChange.mockResolvedValue(true);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

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

  /**
   * What the hook is for: it hands BOTH states to the store, unchanged, and answers what the store answers.
   * The store writes the preferences, does the work, and puts both back when the phone refuses any part of it, all
   * inside one lock acquisition (stores/__tests__/notificationAlertCommit.test.ts).
   */
  const expectHandedToTheStore = (
    current: AlertMenuState,
    original: AlertMenuState,
    scheduleType: ScheduleType,
    prayerIndex: number,
    englishName: string,
    arabicName: string
  ) => {
    expect(mockCommitPrayerAlertChange).toHaveBeenCalledWith(
      scheduleType,
      prayerIndex,
      englishName,
      arabicName,
      current,
      original
    );
  };

  describe('nothing changed', () => {
    it('answers yes without asking the store to do anything', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const state = createState(AlertType.Sound, AlertType.Silent, 15);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', state, { ...state });

      expect(result).toBe(true);
      expect(mockCommitPrayerAlertChange).not.toHaveBeenCalled();
    });
  });

  describe('something changed', () => {
    // the part of the sheet the user moved, the settings it was opened with, and the settings it closed on
    it.each([
      { changed: 'the athan', original: createState(AlertType.Silent), current: createState(AlertType.Sound) },
      {
        changed: 'the reminder',
        original: createState(AlertType.Sound, AlertType.Off),
        current: createState(AlertType.Sound, AlertType.Silent),
      },
      {
        changed: 'only the reminder interval',
        original: createState(AlertType.Sound, AlertType.Sound, 15),
        current: createState(AlertType.Sound, AlertType.Sound, 30),
      },
    ])('hands $changed to the store, both states unchanged', async ({ original, current }) => {
      const { commitAlertMenuChanges } = getUseNotification()();

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 4, 'Magrib', 'المغرب', original, current);

      expect(result).toBe(true);
      expectHandedToTheStore(current, original, ScheduleType.Standard, 4, 'Magrib', 'المغرب');
    });

    it('answers no, unchanged, when the store could not make the change stick', async () => {
      mockCommitPrayerAlertChange.mockResolvedValue(false);
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Off);
      const current = createState(AlertType.Sound);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(false);
    });
  });

  describe('permission', () => {
    // what the sheet was closed on, and whether the app has to ask for permission before it can be saved
    it.each([
      { closedOn: 'an athan and no reminder', current: createState(AlertType.Sound, AlertType.Off) },
      { closedOn: 'a reminder and no athan', current: createState(AlertType.Off, AlertType.Silent) },
    ])('saves nothing when the user closes the dialog on $closedOn', async ({ current }) => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      alertMock.alert.mockImplementation((_t: string, _m: string, buttons: AlertButton[]) => {
        buttons[0].onPress?.();
      });
      const { commitAlertMenuChanges } = getUseNotification()();

      const result = await commitAlertMenuChanges(
        ScheduleType.Standard,
        0,
        'Fajr',
        'الفجر',
        createState(AlertType.Silent, AlertType.Silent),
        current
      );

      expect(result).toBe(false);
      expect(mockCommitPrayerAlertChange).not.toHaveBeenCalled();
    });

    it('never asks when the sheet is closed with everything off', async () => {
      const { commitAlertMenuChanges } = getUseNotification()();
      const original = createState(AlertType.Sound, AlertType.Sound);
      const current = createState(AlertType.Off, AlertType.Off);

      const result = await commitAlertMenuChanges(ScheduleType.Standard, 0, 'Fajr', 'الفجر', original, current);

      expect(result).toBe(true);
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
      expectHandedToTheStore(current, original, ScheduleType.Standard, 0, 'Fajr', 'الفجر');
    });
  });

  // Every combination the sheet can close on, on both lists: the hook must change none of them on the way through
  describe('every combination reaches the store as it stands', () => {
    ALERT_TYPES.forEach((atTimeAlert) => {
      ALERT_TYPES.forEach((reminderAlert) => {
        const combination = `at-time ${ALERT_TYPE_NAMES[atTimeAlert]}, reminder ${ALERT_TYPE_NAMES[reminderAlert]}`;

        it.each([
          { list: 'Standard', scheduleType: ScheduleType.Standard, index: 5, english: 'Isha', arabic: 'العشاء' },
          { list: 'Extra', scheduleType: ScheduleType.Extra, index: 3, english: 'Last Third', arabic: 'الثلث الأخير' },
        ])(`$list, ${combination}`, async ({ scheduleType, index, english, arabic }) => {
          const { commitAlertMenuChanges } = getUseNotification()();
          // Sound, Sound and 30 as the opening state, so every combination below is a real change
          const original = createState(AlertType.Sound, AlertType.Sound, 30);
          const current = createState(atTimeAlert, reminderAlert, 20);

          await commitAlertMenuChanges(scheduleType, index, english, arabic, original, current);

          expectHandedToTheStore(current, original, scheduleType, index, english, arabic);
        });
      });
    });
  });
});

// =============================================================================
// commitSoundSelection TESTS
// =============================================================================

/**
 * The Athan commit is an optimistic write: the channel update and the
 * reschedule both read the stored preference while they run, so the preference
 * has to be persisted first and rolled back if either rejects. Without the
 * rollback, Settings shows an Athan the OS will not play until the periodic
 * refresh heals it, up to NOTIFICATION_REFRESH_HOURS later.
 */
describe('commitSoundSelection', () => {
  const PREVIOUS_SOUND = 2;
  const NEW_SOUND = 6;

  beforeEach(() => {
    jest.clearAllMocks();
    alertMock._lastButtons = undefined;
    mockGetSoundPreference.mockReturnValue(PREVIOUS_SOUND);
    mockSetSoundPreference.mockImplementation(() => {});
    mockUpdateAndroidChannel.mockResolvedValue('athan-channel');
    mockRescheduleAllNotifications.mockResolvedValue(undefined);
  });

  describe('success', () => {
    it('persists the selection before it schedules, and reports success', async () => {
      const { commitSoundSelection } = getUseNotification()();

      const result = await commitSoundSelection(NEW_SOUND);

      expect(result).toBe(true);
      expect(mockSetSoundPreference).toHaveBeenCalledWith(NEW_SOUND);
      expect(mockUpdateAndroidChannel).toHaveBeenCalledWith(NEW_SOUND);
      expect(mockRescheduleAllNotifications).toHaveBeenCalled();

      // The scheduler reads the preference mid-flight, so the write must precede it
      expect(mockSetSoundPreference.mock.invocationCallOrder[0]).toBeLessThan(
        mockUpdateAndroidChannel.mock.invocationCallOrder[0]
      );
      expect(mockUpdateAndroidChannel.mock.invocationCallOrder[0]).toBeLessThan(
        mockRescheduleAllNotifications.mock.invocationCallOrder[0]
      );
    });

    it('leaves the committed selection in place', async () => {
      const { commitSoundSelection } = getUseNotification()();

      await commitSoundSelection(NEW_SOUND);

      expect(mockSetSoundPreference).toHaveBeenCalledTimes(1);
      expect(mockSetSoundPreference).toHaveBeenLastCalledWith(NEW_SOUND);
    });
  });

  describe('rollback', () => {
    it('restores the previous selection when the reschedule rejects', async () => {
      mockRescheduleAllNotifications.mockRejectedValue(new Error('Scheduling error'));

      const { commitSoundSelection } = getUseNotification()();
      const result = await commitSoundSelection(NEW_SOUND);

      expect(result).toBe(false);
      expect(mockSetSoundPreference).toHaveBeenCalledWith(NEW_SOUND);
      expect(mockSetSoundPreference).toHaveBeenLastCalledWith(PREVIOUS_SOUND);
    });

    it('restores the previous selection when the Android channel update rejects', async () => {
      mockUpdateAndroidChannel.mockRejectedValue(new Error('Channel error'));

      const { commitSoundSelection } = getUseNotification()();
      const result = await commitSoundSelection(NEW_SOUND);

      expect(result).toBe(false);
      expect(mockSetSoundPreference).toHaveBeenLastCalledWith(PREVIOUS_SOUND);
      // The reschedule is never reached, so nothing is written with the new sound
      expect(mockRescheduleAllNotifications).not.toHaveBeenCalled();
    });

    it('rolls back to the value read before the write, not to a hardcoded default', async () => {
      mockGetSoundPreference.mockReturnValue(11);
      mockRescheduleAllNotifications.mockRejectedValue(new Error('Scheduling error'));

      const { commitSoundSelection } = getUseNotification()();
      await commitSoundSelection(NEW_SOUND);

      expect(mockSetSoundPreference).toHaveBeenLastCalledWith(11);
    });

    it('never lets the rejection escape, because onDismiss is called un-awaited', async () => {
      mockRescheduleAllNotifications.mockRejectedValue(new Error('Scheduling error'));

      const { commitSoundSelection } = getUseNotification()();

      await expect(commitSoundSelection(NEW_SOUND)).resolves.toBe(false);
    });
  });
});
