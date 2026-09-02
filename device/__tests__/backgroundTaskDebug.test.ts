/**
 * Unit tests for device/backgroundTaskDebug.ts (ISSUES.md #8 instrumentation)
 *
 * The debug module must never affect production behavior: the snapshot
 * sequence no-ops unless enabled, and — critically — the simulate call is
 * __DEV__-only because the native module hard-crashes (fatalError) on
 * Release builds.
 */
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import logger from '@/shared/logger';

import {
  logBackgroundTaskDiagnostics,
  runBackgroundTaskDebugSequence,
  simulateBackgroundTaskTrigger,
} from '../backgroundTaskDebug';

const mockTrigger = BackgroundTask.triggerTaskWorkerForTestingAsync as jest.Mock;
const mockGetStatus = BackgroundTask.getStatusAsync as jest.Mock;
const mockGetRegisteredTasks = TaskManager.getRegisteredTasksAsync as jest.Mock;
const mockGetScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

const setDev = (value: boolean) => {
  (globalThis as Record<string, unknown>).__DEV__ = value;
};

describe('logBackgroundTaskDiagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStatus.mockResolvedValue(BackgroundTask.BackgroundTaskStatus.Available);
  });

  it('logs registration, persisted options, status and pending notification count', async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);
    mockGetRegisteredTasks.mockResolvedValue([
      { taskName: 'NOTIFICATION_REFRESH_TASK', taskType: 'backgroundTask', options: { minimumInterval: 15 } },
    ]);
    mockGetScheduled.mockResolvedValue([
      { identifier: 'a', content: {}, trigger: { date: 2000 } },
      { identifier: 'b', content: {}, trigger: { date: 1000 } },
    ]);

    await logBackgroundTaskDiagnostics('test snapshot');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('test snapshot'),
      expect.objectContaining({
        isRegistered: true,
        persistedOptions: { minimumInterval: 15 },
        pendingNotifications: 2,
      })
    );
  });

  it('reports the earliest pending trigger as an ISO date', async () => {
    mockGetRegisteredTasks.mockResolvedValue([]);
    mockGetScheduled.mockResolvedValue([{ identifier: 'a', content: {}, trigger: { date: 5000 } }]);

    await logBackgroundTaskDiagnostics('earliest');

    expect(logger.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ earliestPendingTrigger: new Date(5000).toISOString() })
    );
  });

  it('reports null earliest trigger when nothing is date-scheduled', async () => {
    mockGetRegisteredTasks.mockResolvedValue([]);
    mockGetScheduled.mockResolvedValue([
      { identifier: 'a', content: {}, trigger: null },
      { identifier: 'b', content: {}, trigger: { repeats: true } },
    ]);

    await logBackgroundTaskDiagnostics('no dates');

    expect(logger.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ earliestPendingTrigger: null, pendingNotifications: 2 })
    );
  });

  it('swallow errors instead of throwing (diagnostics must never crash the app)', async () => {
    mockGetRegisteredTasks.mockRejectedValue(new Error('task manager unavailable'));

    await expect(logBackgroundTaskDiagnostics('failure')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('simulateBackgroundTaskTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to triggerTaskWorkerForTestingAsync', async () => {
    mockTrigger.mockResolvedValue(undefined);

    await simulateBackgroundTaskTrigger();

    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  it('catches rejections — a failed simulation must never crash the app', async () => {
    mockTrigger.mockRejectedValue(new Error('No task request scheduled'));

    await expect(simulateBackgroundTaskTrigger()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('runBackgroundTaskDebugSequence gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetStatus.mockResolvedValue(BackgroundTask.BackgroundTaskStatus.Available);
    mockGetRegisteredTasks.mockResolvedValue([]);
    mockGetScheduled.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.EXPO_PUBLIC_BG_DEBUG;
    setDev(true);
  });

  it('no-ops entirely when disabled (no __DEV__, no env flag)', () => {
    setDev(false);
    delete process.env.EXPO_PUBLIC_BG_DEBUG;

    runBackgroundTaskDebugSequence();

    expect(logger.info).not.toHaveBeenCalled();
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('logs snapshots but NEVER simulates when env-enabled outside __DEV__ (release-crash guard)', async () => {
    setDev(false);
    process.env.EXPO_PUBLIC_BG_DEBUG = '1';

    runBackgroundTaskDebugSequence();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(logger.info).toHaveBeenCalledWith('BACKGROUND_TASK_DEBUG: Sequence armed', expect.anything());
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('arms the full sequence in __DEV__: trigger at 8s, post-run snapshot at +5s', async () => {
    setDev(true);
    mockTrigger.mockResolvedValue(undefined);

    runBackgroundTaskDebugSequence();

    await jest.advanceTimersByTimeAsync(8000);
    expect(mockTrigger).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);
    const messages = (logger.info as jest.Mock).mock.calls.map((call) => call[0]);
    expect(messages).toContain('BACKGROUND_TASK_DEBUG: launch snapshot');
    expect(messages).toContain('BACKGROUND_TASK_DEBUG: post-trigger snapshot');
  });
});
