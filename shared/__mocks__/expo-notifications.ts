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
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock-notification-id');
export const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
export const cancelAllScheduledNotificationsAsync = jest.fn().mockResolvedValue(undefined);
export const getAllScheduledNotificationsAsync = jest.fn().mockResolvedValue([]);
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });

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
