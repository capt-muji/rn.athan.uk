/**
 * The athan commit (stores/notifications.ts)
 *
 * Choosing an athan is all or nothing, the selection included (owner, 2026-09-27): either the phone plays the chosen
 * athan everywhere, or it is left on the one it already had, and the stored athan always names what the alarms
 * carry. So the write, the channel, the re-arm and the undo all happen inside ONE scheduling lock acquisition. Done
 * outside it, the undo let anything queued behind the commit arm with the athan being thrown away.
 */

import * as Notifications from 'expo-notifications';
import { getDefaultStore } from 'jotai';

import { AlertType, type ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';

jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  isProd: () => false,
  isPreview: () => false,
  isTest: () => true,
}));

jest.mock('@/stores/widget', () => ({ refreshPrayerWidgets: jest.fn(async () => undefined) }));

jest.mock('@/stores/sync', () => ({ sync: jest.fn(async () => undefined), getArmedDayChanges: jest.fn(() => 0) }));

import {
  commitSoundSelection,
  getSoundPreference,
  lastNotificationScheduleAtom,
  refreshNotifications,
  setSoundPreference,
  standardPrayerAlertAtoms,
} from '@/stores/notifications';

// =============================================================================
// FIXTURES
// =============================================================================

const store = getDefaultStore();

// 09:00 BST on Saturday 29 August 2026, with every time of today and tomorrow at 12:00 BST. The day is a CONSTANT
// and the clock is pinned before anything reads it: a day taken from the real clock and fed a fixed time agree only
// in the morning, which is ISSUES #41
const NOW = Date.parse('2026-08-29T08:00:00.000Z');
const WINDOW = ['2026-08-29', '2026-08-30'];

const PREVIOUS_SOUND = 2;
const NEW_SOUND = 6;

const FAJR = 0;

/** A channel updater that records the athan it was asked for, and refuses the ones named */
const channelUpdater = (refuse: number[] = []) => {
  const asked: number[] = [];

  const updateChannel = async (sound: number) => {
    asked.push(sound);
    if (refuse.includes(sound)) throw new Error(`the phone refused the channel for athan ${sound}`);
  };

  return { asked, updateChannel };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.clearAllMocks();
  Database.database.clearAll();

  for (const date of WINDOW) {
    const day: ISingleApiResponseTransformed = {
      date,
      fajr: '12:00',
      sunrise: '12:00',
      dhuhr: '12:00',
      asr: '12:00',
      magrib: '12:00',
      isha: '12:00',
      suhoor: '12:00',
      duha: '12:00',
      istijaba: '12:00',
    };
    Database.database.set(`prayer_${date}`, JSON.stringify(day));
  }

  for (const atom of standardPrayerAlertAtoms) store.set(atom, AlertType.Off);
  store.set(standardPrayerAlertAtoms[FAJR], AlertType.Sound);
  store.set(lastNotificationScheduleAtom, 0);
  setSoundPreference(PREVIOUS_SOUND);

  jest
    .mocked(Notifications.scheduleNotificationAsync)
    .mockImplementation(async (request) => (request as { identifier?: string })?.identifier ?? 'mock-notification-id');
  jest.mocked(Notifications.cancelScheduledNotificationAsync).mockResolvedValue(undefined);
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// =============================================================================
// TESTS
// =============================================================================

describe('commitSoundSelection', () => {
  it('stores the chosen athan when every part of the change lands', async () => {
    const { updateChannel } = channelUpdater();

    const committed = await commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel);

    expect(committed).toBe(true);
    expect(getSoundPreference()).toBe(NEW_SOUND);
  });

  it('creates the channel for the chosen athan before it arms anything', async () => {
    const { asked, updateChannel } = channelUpdater();

    const committed = await commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel);

    expect(committed).toBe(true);
    expect(asked).toEqual([NEW_SOUND]);
  });

  it('puts the athan back AND re-arms on it when the channel refuses', async () => {
    const { asked, updateChannel } = channelUpdater([NEW_SOUND]);

    const committed = await commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel);

    expect(committed).toBe(false);
    expect(getSoundPreference()).toBe(PREVIOUS_SOUND);
    // The undo re-arms rather than only rewriting the preference, which is the whole of the owner's ruling
    expect(asked).toEqual([NEW_SOUND, PREVIOUS_SOUND]);
  });

  it('never lets a queued pass see the athan it is about to throw away', async () => {
    const { updateChannel } = channelUpdater([NEW_SOUND]);
    const seenByQueuedPass: number[] = [];

    const commit = commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel);
    const queued = refreshNotifications().then(() => seenByQueuedPass.push(getSoundPreference()));

    await Promise.all([commit, queued]);

    expect(seenByQueuedPass).toEqual([PREVIOUS_SOUND]);
  });

  it('stores the athan the user can see even when putting it back also fails', async () => {
    const { updateChannel } = channelUpdater([NEW_SOUND, PREVIOUS_SOUND]);

    const committed = await commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel);

    expect(committed).toBe(false);
    expect(getSoundPreference()).toBe(PREVIOUS_SOUND);
  });
});
