/**
 * Background task debug instrumentation
 *
 * Dev/experiment-only diagnostics for the notification-refresh background
 * task (ISSUES.md #8). Runs once per cold launch: snapshots the task state
 * (registration, persisted options, system status, pending notifications),
 * then — in DEBUG builds only — simulates a system trigger so the full
 * execution chain (BGTaskScheduler handler → TaskService → JS task →
 * reschedule → native resubmit) is observable without waiting for the OS.
 *
 * Enabled in __DEV__ builds or when EXPO_PUBLIC_BG_DEBUG=1 (Release-config
 * validation builds get the snapshot without the simulate call, which the
 * native module hard-crashes on outside DEBUG). No-op in production.
 */
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_TASK_NAME } from '@/shared/constants';
import logger from '@/shared/logger';

/** Delay before the simulated trigger fires (lets app boot settle) */
const TRIGGER_DELAY_MS = 8000;

/** Delay after the trigger before the post-run snapshot */
const POST_RUN_DELAY_MS = 5000;

const isDebugEnabled = () => __DEV__ || process.env.EXPO_PUBLIC_BG_DEBUG === '1';

/**
 * Extracts the fire date from a notification trigger, if it is a date trigger
 *
 * @param trigger Notification trigger from a scheduled notification request
 * @returns Epoch milliseconds, or null for non-date/null triggers
 */
const getTriggerDate = (trigger: Notifications.NotificationTrigger): number | null => {
  if (typeof trigger !== 'object' || trigger === null) return null;

  const date = (trigger as { date?: number | Date }).date;
  return date !== undefined ? new Date(date).getTime() : null;
};

/**
 * Logs a full snapshot of background task + notification state
 *
 * @param label Label identifying the snapshot moment (e.g. 'launch', 'post-trigger')
 */
export const logBackgroundTaskDiagnostics = async (label: string) => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    const taskEntry = registeredTasks.find((task) => task.taskName === BACKGROUND_TASK_NAME);
    const status = await BackgroundTask.getStatusAsync();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const triggerDates = scheduled
      .map((request) => getTriggerDate(request.trigger))
      .filter((date): date is number => date !== null);
    const earliestPending = triggerDates.length > 0 ? new Date(Math.min(...triggerDates)).toISOString() : null;

    logger.info(`BACKGROUND_TASK_DEBUG: ${label}`, {
      taskName: BACKGROUND_TASK_NAME,
      isRegistered,
      persistedOptions: taskEntry?.options ?? null,
      systemStatus: status,
      pendingNotifications: scheduled.length,
      earliestPendingTrigger: earliestPending,
    });
  } catch (error) {
    logger.error('BACKGROUND_TASK_DEBUG: Diagnostics failed:', error);
  }
};

/**
 * Simulates the system firing the background task (DEBUG builds only)
 *
 * Delegates to BackgroundTask.triggerTaskWorkerForTestingAsync, which calls
 * the private _simulateLaunchForTaskWithIdentifier: selector on
 * BGTaskScheduler. If no task request is pending, the Xcode/syslog console
 * shows "No task request with identifier com.expo.modules.backgroundtask.processing
 * has been scheduled" — itself a useful diagnostic.
 */
export const simulateBackgroundTaskTrigger = async () => {
  logger.info('BACKGROUND_TASK_DEBUG: Simulating system trigger');
  try {
    await BackgroundTask.triggerTaskWorkerForTestingAsync();
    logger.info('BACKGROUND_TASK_DEBUG: Trigger call completed');
  } catch (error) {
    logger.error('BACKGROUND_TASK_DEBUG: Trigger call failed:', error);
  }
};

/**
 * Arms the per-launch debug sequence (self-gating)
 *
 * Snapshot at launch → simulated trigger after boot settles → post-run
 * snapshot. The simulate step is __DEV__-only; EXPO_PUBLIC_BG_DEBUG Release
 * builds get snapshots alone.
 */
export const runBackgroundTaskDebugSequence = () => {
  if (!isDebugEnabled()) return;

  logger.info('BACKGROUND_TASK_DEBUG: Sequence armed', {
    triggerDelayMs: TRIGGER_DELAY_MS,
    canSimulate: __DEV__,
  });
  void logBackgroundTaskDiagnostics('launch snapshot');

  if (!__DEV__) return;

  setTimeout(() => {
    void simulateBackgroundTaskTrigger();
    setTimeout(() => {
      void logBackgroundTaskDiagnostics('post-trigger snapshot');
    }, POST_RUN_DELAY_MS);
  }, TRIGGER_DELAY_MS);
};
