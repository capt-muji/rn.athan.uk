// Mock for expo-notifications
export const AndroidNotificationPriority = {
  MIN: 'min',
  LOW: 'low',
  DEFAULT: 'default',
  HIGH: 'high',
  MAX: 'max',
};

export const AndroidImportance = {
  UNKNOWN: 0,
  UNSPECIFIED: -1000,
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
export const deleteNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
/**
 * Echoes the identifier it was given, because the real SDK does: scheduleNotificationAsync.js
 * hands `request.identifier ?? uuid.v4()` to the native scheduler and returns its result.
 *
 * That echo is load-bearing, not incidental. Production stores the resolved value as the
 * record id (device/notifications.ts) and the reconciliation sweep diffs stored ids against
 * OS identifiers (stores/notifications.ts), so a mock resolving a constant collapses every
 * record for a prayer onto one MMKV key — the key embeds the id — and hides any drift
 * between the success path, which records the resolved id, and the failure path, which
 * records the deterministic identifier. The constant stands in for the SDK's uuid only when
 * no identifier is supplied, which production never does.
 */
export const scheduleNotificationAsync = jest.fn(
  async (request?: { identifier?: string }) => request?.identifier ?? 'mock-notification-id'
);
export const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
export const cancelAllScheduledNotificationsAsync = jest.fn().mockResolvedValue(undefined);
export const getAllScheduledNotificationsAsync = jest.fn().mockResolvedValue([]);
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });

export const SchedulableTriggerInputTypes = {
  DATE: 'date',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  YEARLY: 'yearly',
  CALENDAR: 'calendar',
  LOCATION: 'location',
  UNKNOWN: 'unknown',
} as const;

export interface NotificationContentInput {
  title?: string;
  body?: string;
  sound?: string | boolean;
  color?: string;
  autoDismiss?: boolean;
  sticky?: boolean;
  priority?: string;
  interruptionLevel?: string;
}
