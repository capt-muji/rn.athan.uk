/**
 * updateAndroidChannel in device/notifications.ts, which runs when the user picks an athan
 *
 * An Android channel's sound and importance are fixed once the channel exists. This call and the
 * schedule-time createAthanAndroidChannel both create `athan_N_v4`, and whichever runs first decides
 * the channel for good, so the two must ask for exactly the same channel.
 */

import { AndroidAudioUsage, AndroidImportance, setNotificationChannelAsync } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { openDndAccessSettings, updateAndroidChannel } from '@/device/notifications';
import { createAthanAndroidChannel } from '@/shared/notifications';

const SOUND_INDICES = [0, 1, 4, 15, 31];

beforeEach(() => {
  (setNotificationChannelAsync as jest.Mock).mockClear();
});

afterEach(() => {
  Platform.OS = 'ios';
});

describe('updateAndroidChannel on Android', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it.each(SOUND_INDICES)('creates the channel for sound index %i with its own athan file', async (index) => {
    await updateAndroidChannel(index);

    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(`athan_${index + 1}_v4`, {
      name: `Athan ${index + 1}`,
      sound: `athan${index + 1}.mp3`,
      importance: AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      bypassDnd: true,
      audioAttributes: {
        usage: AndroidAudioUsage.ALARM,
        flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
      },
    });
  });

  // Each index is created by the schedule-time path only once per process, so every index here is fresh
  it.each(SOUND_INDICES)('asks for the same channel createAthanAndroidChannel does, for index %i', async (index) => {
    await updateAndroidChannel(index);
    await createAthanAndroidChannel(index);

    const [fromSelection, fromSchedule] = (setNotificationChannelAsync as jest.Mock).mock.calls;
    expect(fromSchedule).toBeDefined();
    expect(fromSelection).toEqual(fromSchedule);
  });
});

describe('updateAndroidChannel on iOS', () => {
  it('creates no channel, since the sound travels on each notification', async () => {
    await updateAndroidChannel(4);

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe('openDndAccessSettings', () => {
  beforeEach(() => {
    (Linking.sendIntent as jest.Mock).mockClear();
    (Linking.sendIntent as jest.Mock).mockResolvedValue(undefined);
  });

  it('opens the Do Not Disturb access screen on Android', async () => {
    Platform.OS = 'android';

    await expect(openDndAccessSettings()).resolves.toBe(true);
    expect(Linking.sendIntent).toHaveBeenCalledWith('android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS');
  });

  it('answers false when the phone has no such screen, rather than throwing', async () => {
    Platform.OS = 'android';
    (Linking.sendIntent as jest.Mock).mockRejectedValue(new Error('no activity found'));

    await expect(openDndAccessSettings()).resolves.toBe(false);
  });

  it('does nothing on iOS, which has no Do Not Disturb access to grant', async () => {
    await expect(openDndAccessSettings()).resolves.toBe(false);
    expect(Linking.sendIntent).not.toHaveBeenCalled();
  });
});
