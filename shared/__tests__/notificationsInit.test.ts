/**
 * initializeNotifications in shared/notifications.ts, past the permission branch notifications.test.ts
 * covers
 *
 * - The background refresh task is registered when permission is granted, and never when it is not
 * - On Android, the legacy wav channels are deleted and both at-time channels exist before the refresh
 *   schedules into them: Android rings a generic fallback tone for a notification on a missing channel
 * - A legacy channel that fails to delete stops neither the other deletions nor the start-up after them
 *
 * The module keeps once-per-process channel flags, so every test loads it into a fresh registry
 */

type Loaded = {
  initializeNotifications: typeof import('../notifications').initializeNotifications;
  platform: { OS: string };
  setChannel: jest.Mock;
  deleteChannel: jest.Mock;
};

const loadFresh = (os: 'ios' | 'android'): Loaded => {
  jest.resetModules();
  const platform = (require('react-native') as { Platform: { OS: string } }).Platform;
  platform.OS = os;
  const notifications = require('expo-notifications') as {
    setNotificationChannelAsync: jest.Mock;
    deleteNotificationChannelAsync: jest.Mock;
  };

  return {
    initializeNotifications: (require('../notifications') as typeof import('../notifications')).initializeNotifications,
    platform,
    setChannel: notifications.setNotificationChannelAsync,
    deleteChannel: notifications.deleteNotificationChannelAsync,
  };
};

const LEGACY_CHANNEL_IDS = ['reminder', ...Array.from({ length: 16 }, (_, i) => `athan_${i + 1}`)];

let loaded: Loaded | null = null;

afterEach(() => {
  if (loaded) loaded.platform.OS = 'ios';
  loaded = null;
});

// =============================================================================
// BACKGROUND TASK REGISTRATION
// =============================================================================

describe('initializeNotifications background task registration', () => {
  it.each(['ios', 'android'] as const)('registers the background task once permission is granted (%s)', async (os) => {
    loaded = loadFresh(os);
    const refreshFn = jest.fn().mockResolvedValue(undefined);
    const registerBackgroundTaskFn = jest.fn().mockResolvedValue(undefined);

    await loaded.initializeNotifications(jest.fn().mockResolvedValue(true), refreshFn, registerBackgroundTaskFn);

    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(registerBackgroundTaskFn).toHaveBeenCalledTimes(1);
  });

  it.each(['ios', 'android'] as const)('registers no background task when permission is denied (%s)', async (os) => {
    loaded = loadFresh(os);
    const registerBackgroundTaskFn = jest.fn().mockResolvedValue(undefined);

    await loaded.initializeNotifications(
      jest.fn().mockResolvedValue(false),
      jest.fn().mockResolvedValue(undefined),
      registerBackgroundTaskFn
    );

    expect(registerBackgroundTaskFn).not.toHaveBeenCalled();
  });
});

// =============================================================================
// ANDROID CHANNELS BEFORE THE FIRST REFRESH
// =============================================================================

describe('initializeNotifications on Android', () => {
  it('deletes the legacy channels and creates both at-time channels before the refresh runs', async () => {
    const current = loadFresh('android');
    loaded = current;
    const seenAtRefresh: { created: string[]; deleted: string[] } = { created: [], deleted: [] };
    const refreshFn = jest.fn(async () => {
      seenAtRefresh.created = current.setChannel.mock.calls.map((call) => call[0] as string);
      seenAtRefresh.deleted = current.deleteChannel.mock.calls.map((call) => call[0] as string);
    });

    await current.initializeNotifications(jest.fn().mockResolvedValue(true), refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(seenAtRefresh.created).toEqual(expect.arrayContaining(['athan_1_v2', 'extras_at_time']));
    expect([...seenAtRefresh.deleted].sort()).toEqual([...LEGACY_CHANNEL_IDS].sort());
  });

  it.each(['reminder', 'athan_1', 'athan_9', 'athan_16'])(
    'still refreshes, and still asks for every other deletion, when deleting %s fails',
    async (failingId) => {
      const current = loadFresh('android');
      loaded = current;
      current.deleteChannel.mockImplementation(async (channelId: string) => {
        if (channelId === failingId) throw new Error('channel delete failed');
      });
      const refreshFn = jest.fn().mockResolvedValue(undefined);

      await current.initializeNotifications(jest.fn().mockResolvedValue(true), refreshFn);

      expect(current.deleteChannel.mock.calls.map((call) => call[0]).sort()).toEqual([...LEGACY_CHANNEL_IDS].sort());
      expect(current.setChannel.mock.calls.map((call) => call[0])).toEqual(
        expect.arrayContaining(['athan_1_v2', 'extras_at_time'])
      );
      expect(refreshFn).toHaveBeenCalledTimes(1);
    }
  );
});
