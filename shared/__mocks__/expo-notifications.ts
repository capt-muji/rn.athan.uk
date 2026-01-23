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

export const setNotificationChannelAsync = async () => {};
export const scheduleNotificationAsync = async () => 'mock-notification-id';
export const cancelScheduledNotificationAsync = async () => {};
export const getAllScheduledNotificationsAsync = async () => [];
export const getPermissionsAsync = async () => ({ status: 'granted' });
export const requestPermissionsAsync = async () => ({ status: 'granted' });

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
