/**
 * The launch screen: when the splash lifts, what shows while data loads or fails, the What's New and update prompts,
 * and what runs once sync has finished and once the settling window has passed
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { getDefaultStore } from 'jotai';

import { london, onPlatform, saveLondonDays, showLondonDay } from '@/__tests__/harness';
import { fetchYear } from '@/api/client';
import { runBackgroundTaskDebugSequence } from '@/device/backgroundTaskDebug';
import { initializeListeners } from '@/device/listeners';
import { checkForUpdates, openStore } from '@/device/updates';
import { mockExpoConfig, resetMockExpoConfig } from '@/shared/__mocks__/expo-constants';
import { APP_CONFIG } from '@/shared/config';
import { BACKGROUND_TASK_NAME } from '@/shared/constants';
import { FEATURE_FLAGS } from '@/shared/flags';
import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { AlertType, type ISingleApiResponseTransformed, ScheduleType } from '@/shared/types';
import * as WhatsNew from '@/shared/whatsNew';
import * as Database from '@/stores/database';
import { refreshNotifications, setPrayerAlertType } from '@/stores/notifications';
import { openOverlay } from '@/stores/overlay';
import { setSequence } from '@/stores/schedule';
import { decorationsEnabledAtom, markDecorationsLoaded, markMasjidIconLoaded } from '@/stores/ui';
import {
  CACHE_SCHEMA_VERSION,
  getInstalledVersion,
  getWhatsNewShownVersion,
  setStoredVersion,
  setWhatsNewShownVersion,
} from '@/stores/version';

import Index from '../../app/index';

// Sync downloads the year over the network, so each test decides what the download answers. Unless told, it is still
// on its way
jest.mock('@/api/client', () => ({
  fetchDay: jest.fn(() => new Promise(() => {})),
  fetchYear: jest.fn(() => new Promise(() => {})),
}));

// The update check asks the store over the network and Update opens the store, so both are observed instead of run
jest.mock('@/device/updates', () => ({
  checkForUpdates: jest.fn(() => Promise.resolve(false)),
  openStore: jest.fn(() => Promise.resolve()),
}));

// The listeners subscribe to every foreground return for the life of the process and let only the first registration
// through, so the registration is observed instead of made
jest.mock('@/device/listeners', () => ({ initializeListeners: jest.fn() }));

// The development diagnostics simulate a background-task launch eight seconds later, so their start is observed
jest.mock('@/device/backgroundTaskDebug', () => ({ runBackgroundTaskDebugSequence: jest.fn() }));

// Notification start-up catches its own failures, so a failure that escapes it is made here, once, to show the launch
// logs it instead of leaving it unhandled. Every other launch runs the real start-up
jest.mock('@/shared/notifications', () => {
  const actual = jest.requireActual('@/shared/notifications');
  return { ...actual, initializeNotifications: jest.fn(actual.initializeNotifications) };
});

// The splash is native, so lifting it is observed
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
}));

// What a release announces is the owner's editorial choice, made again every release, so the suite announces a
// release of its own
jest.mock('@/shared/whatsNew', () => ({
  ...jest.requireActual('@/shared/whatsNew'),
  __esModule: true,
  VISIBLE_WHATS_NEW: {
    version: '2.0.0',
    items: [{ title: 'Tablet support', body: 'Athan now supported on tablets', version: '2.0.0' }],
  },
}));

const RELEASE = '2.0.0';
const PREVIOUS_RELEASE = '1.27.0';
const ASR = 3;
const ASR_ALERT_ID = 'athan_standard_asr_2026-09-11';
const UPDATE_PROMPT_TITLE = /^Update Available/;

/** A frame and the macrotask after it, which is when the prompts and the overlay mount */
const FIRST_FRAME_MS = 50;

/** How long after mount the notification set-up, the diagnostics and the update check wait */
const SETTLING_WINDOW_MS = 1500;

/** 11 September 2026 at 14:00 with no day stored, as after an upgrade wipe or across a year gap */
const showEmptyLaunch = () => jest.useFakeTimers({ now: london('2026-09-11', '14:00') });

/** The London days as a download brings them, taken out of storage again so the launch starts without them */
const takeDownloadOfStoredDays = (): ISingleApiResponseTransformed[] => {
  saveLondonDays();
  const days = Database.getAllWithPrefix('prayer_');
  Database.clearPrefix('prayer_');
  return days;
};

/** Holds the next download on its way until the returned function fails it, so a test decides when sync finishes */
const holdDownload = (): (() => void) => {
  let fail = () => {};
  jest.mocked(fetchYear).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = () => reject(new Error('Offline'));
      })
  );
  return () => fail();
};

/**
 * Monday 15 February 2027 at 14:00, inside Ramadan, with both lists built. No day of 2027 is stored, so the rows are
 * dashes; the splash reads only that a list exists
 */
const showRamadanLists = () => {
  const now = london('2027-02-15', '14:00');
  jest.useFakeTimers({ now });
  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);
};

/** Release 2.0.0 installed over release 1.27.0, which announced its own release */
const installUpdate = () => {
  mockExpoConfig.version = RELEASE;
  setStoredVersion(PREVIOUS_RELEASE);
  setWhatsNewShownVersion(PREVIOUS_RELEASE);
};

/** A later launch of release 2.0.0, which announced itself on an earlier launch */
const relaunchRelease = () => {
  mockExpoConfig.version = RELEASE;
  setStoredVersion(RELEASE);
  setWhatsNewShownVersion(RELEASE);
};

// Every launch here follows an earlier launch whose cache shape this build reads: of the installed release, unless a
// test installs an update. The upgrade check runs once per process (handleAppUpgrade in stores/version.ts), and with
// no stored version whichever launch ran first would be taken for a fresh install and wipe the stored days. The
// shape marker has no setter; handleAppUpgrade writes it under this key
beforeEach(() => {
  setStoredVersion(getInstalledVersion());
  Database.setItem('cache_schema_version', CACHE_SCHEMA_VERSION);
});

afterEach(() => {
  resetMockExpoConfig();
});

describe("What's New, Friday 11 September 2026 at 14:00, with release 2.0.0 installed", () => {
  it('announces the release on the first launch after an update', async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByText("What's New")).toBeOnTheScreen();
    expect(screen.getByText('Tablet support')).toBeOnTheScreen();
  });

  it('records the release as announced as soon as it shows', async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();

    await render(<Index />);

    expect(getWhatsNewShownVersion()).toBe(RELEASE);
  });

  it('announces nothing on a launch after the release was announced', async () => {
    showLondonDay('2026-09-11', '14:00');
    relaunchRelease();
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });

  it("closes What's New when Continue is pressed", async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();
    await render(<Index />);
    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });

  it('announces nothing on a release that has nothing to announce', async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();
    jest.replaceProperty(WhatsNew, 'VISIBLE_WHATS_NEW', null);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });

  it('announces the release on every launch of a development build with the preview switch on', async () => {
    showLondonDay('2026-09-11', '14:00');
    relaunchRelease();
    // The build inlines EXPO_PUBLIC_WHATS_NEW_PREVIEW into APP_CONFIG as it loads, which a suite cannot do again
    jest.replaceProperty(APP_CONFIG, 'whatsNewPreview', true);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByText("What's New")).toBeOnTheScreen();
  });

  it('ignores the preview switch in a release build', async () => {
    showLondonDay('2026-09-11', '14:00');
    relaunchRelease();
    jest.replaceProperty(APP_CONFIG, 'whatsNewPreview', true);
    jest.replaceProperty(globalThis as typeof globalThis & { __DEV__: boolean }, '__DEV__', false);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
    expect(screen.queryByText("What's New")).not.toBeOnTheScreen();
  });
});

describe('the launch splash, Friday 11 September 2026 at 14:00', () => {
  it('lifts the splash on the first frame of a launch with no stored days', async () => {
    showEmptyLaunch();

    await render(<Index />);

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('shows neither lists nor the error screen while a launch with no stored days waits for its download', async () => {
    showEmptyLaunch();

    await render(<Index />);

    expect(screen.queryByText('London, UK')).not.toBeOnTheScreen();
    expect(screen.queryByText('Something went wrong.')).not.toBeOnTheScreen();
  });

  it('shows the lists once the download on a launch with no stored days has landed', async () => {
    showEmptyLaunch();
    jest.mocked(fetchYear).mockResolvedValueOnce(takeDownloadOfStoredDays());

    await render(<Index />);

    expect(await screen.findByRole('button', { name: 'Isha notification: off' })).toBeOnTheScreen();
  });

  it('shows the error screen when a launch with no stored days cannot download them', async () => {
    showEmptyLaunch();
    jest.mocked(fetchYear).mockRejectedValueOnce(new Error('Offline'));

    await render(<Index />);

    expect(await screen.findByText('Something went wrong.')).toBeOnTheScreen();
  });

  it('holds the splash over stored lists until the Masjid icon has loaded', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('lifts the splash over stored lists once the Masjid icon has loaded', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => markMasjidIconLoaded());

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});

describe('the launch splash in Ramadan, Monday 15 February 2027 at 14:00', () => {
  it('holds the splash until the decorations have loaded', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('lifts the splash once the decorations have loaded', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    await render(<Index />);

    await act(() => markDecorationsLoaded());

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('lifts the splash without waiting for decorations that are turned off', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    // The Settings toggle writes this preference through its atom, and the store has no setter for it
    getDefaultStore().set(decorationsEnabledAtom, false);

    await render(<Index />);

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  // No day of 2027 is stored, so the failed download leaves nothing usable and sync fails
  it('lifts the splash onto the error screen, without waiting for decorations that screen never draws', async () => {
    showRamadanLists();
    markMasjidIconLoaded();
    jest.mocked(fetchYear).mockRejectedValueOnce(new Error('Offline'));

    await render(<Index />);

    expect(await screen.findByText('Something went wrong.')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('holds the splash over the error screen until its Masjid icon has loaded, then lifts it', async () => {
    showRamadanLists();
    jest.mocked(fetchYear).mockRejectedValueOnce(new Error('Offline'));
    await render(<Index />);
    await screen.findByText('Something went wrong.');
    const beforeIcon = jest.mocked(SplashScreen.hideAsync).mock.calls.length;

    await act(() => markMasjidIconLoaded());

    expect({ beforeIcon, afterIcon: jest.mocked(SplashScreen.hideAsync).mock.calls.length }).toEqual({
      beforeIcon: 0,
      afterIcon: 1,
    });
  });
});

describe('alerts and the settling window, Friday 11 September 2026 at 14:00', () => {
  it("names the build's feature flags in the log at launch", async () => {
    showLondonDay('2026-09-11', '14:00');

    await render(<Index />);

    expect(logger.info).toHaveBeenCalledWith('APP: feature flags resolved', FEATURE_FLAGS);
  });

  it('registers the foreground listeners at mount with the notification permission check', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);
    const [checkPermissions] = jest.mocked(initializeListeners).mock.calls[0];

    await checkPermissions();

    expect(initializeListeners).toHaveBeenCalledTimes(1);
    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('does not arm saved alerts while the download is still on its way', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, ASR, AlertType.Sound);

    await render(<Index />);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('arms saved alerts once sync has finished', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, ASR, AlertType.Sound);
    const failDownload = holdDownload();
    await render(<Index />);

    await act(() => failDownload());

    await waitFor(() =>
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: ASR_ALERT_ID })
      )
    );
  });

  it('logs a refresh that fails once sync has finished', async () => {
    showLondonDay('2026-09-11', '14:00');
    const error = new Error('Notification service unavailable');
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockRejectedValueOnce(error);
    const failDownload = holdDownload();
    await render(<Index />);

    await act(() => failDownload());

    await waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith('Failed to refresh notifications after sync:', error)
    );
  });

  it('runs none of the settling-window work within its first 1.5 seconds', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS - 1));

    expect(runBackgroundTaskDebugSequence).not.toHaveBeenCalled();
    expect(checkForUpdates).not.toHaveBeenCalled();
  });

  it('runs the development diagnostics once 1.5 seconds have passed', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(runBackgroundTaskDebugSequence).toHaveBeenCalledTimes(1);
  });

  it('registers the background refresh once 1.5 seconds have passed', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await waitFor(() =>
      expect(BackgroundTask.registerTaskAsync).toHaveBeenCalledWith(BACKGROUND_TASK_NAME, expect.anything())
    );
  });

  // A rejection nothing handles fails the test that left it: Jest reports it against the test
  it('logs a notification start-up that fails, and leaves no rejection unhandled', async () => {
    showLondonDay('2026-09-11', '14:00');
    const error = new Error('Notification channels unavailable');
    jest.mocked(initializeNotifications).mockRejectedValueOnce(error);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(logger.error).toHaveBeenCalledWith('Failed to initialize notifications:', error);
  });

  it('re-arms alerts on an Android launch even when they were armed within the last 12 hours', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, ASR, AlertType.Sound);
    await refreshNotifications();
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    onPlatform('android');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await waitFor(() => expect(BackgroundTask.registerTaskAsync).toHaveBeenCalled());
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: ASR_ALERT_ID })
    );
  });

  it('leaves alerts armed within the last 12 hours alone on an iOS launch', async () => {
    showLondonDay('2026-09-11', '14:00');
    setPrayerAlertType(ScheduleType.Standard, ASR, AlertType.Sound);
    await refreshNotifications();
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await waitFor(() => expect(BackgroundTask.registerTaskAsync).toHaveBeenCalled());
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('the overlay layer, Friday 11 September 2026 at 14:00', () => {
  it('leaves an open overlay without its close control on the first frame', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, ASR);

    await render(<Index />);

    expect(screen.queryByRole('button', { name: 'Close prayer details' })).not.toBeOnTheScreen();
  });

  it('mounts the overlay once the first frame has passed, so an open overlay can be closed', async () => {
    showLondonDay('2026-09-11', '14:00');
    openOverlay(ScheduleType.Standard, ASR);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByRole('button', { name: 'Close prayer details' })).toBeOnTheScreen();
  });
});

describe('the update prompt, Friday 11 September 2026 at 14:00', () => {
  it('offers the update once 1.5 seconds have passed and the store has a newer version', async () => {
    showLondonDay('2026-09-11', '14:00');
    jest.mocked(checkForUpdates).mockResolvedValueOnce(true);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(await screen.findByText(UPDATE_PROMPT_TITLE)).toBeOnTheScreen();
  });

  it('offers nothing when the store has no newer version', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(checkForUpdates).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(UPDATE_PROMPT_TITLE)).not.toBeOnTheScreen();
  });

  it('closes the update prompt when Later is pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    jest.mocked(checkForUpdates).mockResolvedValueOnce(true);
    await render(<Index />);
    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await fireEvent.press(await screen.findByText('Later'));

    expect(screen.queryByText(UPDATE_PROMPT_TITLE)).not.toBeOnTheScreen();
    expect(openStore).not.toHaveBeenCalled();
  });

  it('opens the store and closes the prompt when Update is pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    jest.mocked(checkForUpdates).mockResolvedValueOnce(true);
    await render(<Index />);
    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await fireEvent.press(await screen.findByText('Update'));

    expect(openStore).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(UPDATE_PROMPT_TITLE)).not.toBeOnTheScreen();
  });

  it("holds the update prompt back while What's New is showing", async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();
    jest.mocked(checkForUpdates).mockResolvedValueOnce(true);
    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await waitFor(() => expect(checkForUpdates).toHaveBeenCalledTimes(1));
    expect(screen.getByText("What's New")).toBeOnTheScreen();
    expect(screen.queryByText(UPDATE_PROMPT_TITLE)).not.toBeOnTheScreen();
  });

  it("offers the update once What's New is closed", async () => {
    showLondonDay('2026-09-11', '14:00');
    installUpdate();
    jest.mocked(checkForUpdates).mockResolvedValueOnce(true);
    await render(<Index />);
    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(UPDATE_PROMPT_TITLE)).toBeOnTheScreen();
  });
});
