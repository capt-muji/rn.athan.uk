import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import logger from '@/shared/logger';

const BACKGROUND_TASK = 'reschedule-notifications';

export const deregisterBackgroundFetchAsync = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (!isRegistered) {
      logger.info(`TASK: ${BACKGROUND_TASK} is not registered`);
      return;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK);
    logger.info(`TASK: ${BACKGROUND_TASK} deregistered successfully`);
  } catch (error) {
    logger.error(`TASK: Failed to deregister ${BACKGROUND_TASK}`, error);
  }
};
