import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import logger from '@/shared/logger';
import { rescheduleAllNotifications } from '@/stores/notifications';

const BACKGROUND_TASK = 'reschedule-notifications';

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    await rescheduleAllNotifications();
    logger.info('TASK: Background task rescheduled notifications');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    logger.error('TASK: Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 12 * 60 * 60, // 12 hrs (in seconds)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    logger.info(`TASK: ${BACKGROUND_TASK} registered successfully`);
  } catch (error) {
    logger.error(`TASK: Failed to register ${BACKGROUND_TASK}`, error);
  }
}
