import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import logger from '@/shared/logger';
import { ScheduleType } from '@/shared/types';
import * as NotificationStore from '@/stores/notifications';

const BACKGROUND_TASK_NAME = 'REFRESH_NOTIFICATIONS';

// Define the task
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    logger.info('BACKGROUND: Starting notification refresh task');

    // Cancel all notifications for both schedules
    await Promise.all([
      NotificationStore.cancelAllScheduleNotificationsForSchedule(ScheduleType.Standard),
      NotificationStore.cancelAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    ]);

    logger.info('BACKGROUND: Cancelled all notifications');

    // Reschedule all notifications for both schedules
    await Promise.all([
      NotificationStore.addAllScheduleNotificationsForSchedule(ScheduleType.Standard),
      NotificationStore.addAllScheduleNotificationsForSchedule(ScheduleType.Extra),
    ]);

    logger.info('BACKGROUND: Rescheduled all notifications');

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    logger.error('BACKGROUND: Failed to refresh notifications:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      logger.info('BACKGROUND: Task already registered');
      return;
    }

    // Register task to run every 12 hours
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 12 * 60 * 60, // 12 hours in seconds
      stopOnTerminate: false, // Android only: task will continue to run after app is terminated
      startOnBoot: true, // Android only: task will run after device reboot
    });

    logger.info('BACKGROUND: Task registered successfully');
  } catch (error) {
    logger.error('BACKGROUND: Failed to register task:', error);
  }
};
