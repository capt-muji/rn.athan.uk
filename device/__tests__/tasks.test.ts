/**
 * Unit tests for device/tasks.ts — the background task body (ISSUES.md #8)
 *
 * The task is the entire background execution path: OS → TaskService → this
 * executor → rescheduleAllNotificationsFromBackground. These tests pin the
 * contract the OS relies on: correct task name, Success on completion,
 * Failed on error, and never throwing across the native bridge.
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BACKGROUND_TASK_NAME } from '@/shared/constants';

jest.mock('@/stores/notifications', () => ({
  rescheduleAllNotificationsFromBackground: jest.fn(),
}));

const mockReschedule = require('@/stores/notifications').rescheduleAllNotificationsFromBackground as jest.Mock;

// Import AFTER the jest.mock declaration (babel hoists imports above factories)
import '@/device/tasks';

const getRegisteredExecutor = () => {
  const calls = (TaskManager.defineTask as jest.Mock).mock.calls;
  const registration = calls.find(([name]) => name === BACKGROUND_TASK_NAME);
  return registration?.[1] as () => Promise<number>;
};

describe('background task definition (device/tasks.ts)', () => {
  beforeEach(() => {
    // NOTE: do NOT clearAllMocks — defineTask's recording happens once at module
    // load (the import above); clearing it erases the registration under test
    mockReschedule.mockReset();
  });

  it('defines the task under BACKGROUND_TASK_NAME at module scope', () => {
    expect(TaskManager.defineTask).toHaveBeenCalledWith(BACKGROUND_TASK_NAME, expect.any(Function));
  });

  it('defines the task exactly once per module load', () => {
    const calls = (TaskManager.defineTask as jest.Mock).mock.calls.filter(([name]) => name === BACKGROUND_TASK_NAME);
    expect(calls).toHaveLength(1);
  });

  it('runs the background reschedule when the OS triggers the task', async () => {
    mockReschedule.mockResolvedValue(undefined);
    const executor = getRegisteredExecutor();

    const result = await executor();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(mockReschedule).toHaveBeenCalledTimes(1);
  });

  it('returns Failed when the reschedule rejects', async () => {
    mockReschedule.mockRejectedValue(new Error('MMKV read failed'));
    const executor = getRegisteredExecutor();

    const result = await executor();

    expect(result).toBe(BackgroundTask.BackgroundTaskResult.Failed);
  });

  it('never throws across the bridge even for non-Error rejections', async () => {
    mockReschedule.mockRejectedValue('string rejection');
    const executor = getRegisteredExecutor();

    await expect(executor()).resolves.toBe(BackgroundTask.BackgroundTaskResult.Failed);
  });

  it('returns Success again on a subsequent run after a failure', async () => {
    const executor = getRegisteredExecutor();

    mockReschedule.mockRejectedValueOnce(new Error('transient'));
    await executor();

    mockReschedule.mockResolvedValueOnce(undefined);
    const second = await executor();

    expect(second).toBe(BackgroundTask.BackgroundTaskResult.Success);
    expect(mockReschedule).toHaveBeenCalledTimes(2);
  });
});
