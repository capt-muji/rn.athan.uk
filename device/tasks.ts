/**
 * Background Tasks
 *
 * IMPORTANT: This file must be imported at the very top of the app entry point
 * (_layout.tsx) BEFORE any other imports. This ensures tasks are defined
 * in the global scope and available even when the OS wakes the app.
 *
 * Task registration happens later in initializeNotifications().
 */
import { formatISO } from 'date-fns';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_TASK_NAME } from '@/shared/constants';
import logger from '@/shared/logger';

/**
 * Define the background task at module level (global scope)
 *
 * This MUST execute before the app renders so the task is available
 * when the OS triggers it, even if the app was killed.
 */
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  const taskStartTime = Date.now();
  logger.info('BACKGROUND_TASK: Task started', {
    taskName: BACKGROUND_TASK_NAME,
    startTime: formatISO(taskStartTime),
  });

  try {
    // Import dynamically to avoid circular dependencies
    // The notifications module will be loaded by the time the OS runs this task
    const { rescheduleAllNotificationsFromBackground } = await import('@/stores/notifications');
    await rescheduleAllNotificationsFromBackground();

    const taskEndTime = Date.now();
    const durationMs = taskEndTime - taskStartTime;

    logger.info('BACKGROUND_TASK: Task completed successfully', {
      taskName: BACKGROUND_TASK_NAME,
      durationMs,
      endTime: formatISO(taskEndTime),
    });

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    const taskEndTime = Date.now();
    const durationMs = taskEndTime - taskStartTime;

    logger.error('BACKGROUND_TASK: Task failed', {
      taskName: BACKGROUND_TASK_NAME,
      error,
      durationMs,
      endTime: formatISO(taskEndTime),
    });

    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

logger.info('BACKGROUND_TASK: Task defined in global scope', { taskName: BACKGROUND_TASK_NAME });
