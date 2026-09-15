/**
 * The root layout: what it sets up as it loads, the route and sheets it mounts, and the screen a route that threw shows
 */

import { act, render, screen } from '@testing-library/react-native';

import { BACKGROUND_TASK_NAME } from '@/shared/constants';
import logger from '@/shared/logger';

import Layout, { ErrorBoundary } from '../../app/_layout';

// The route tree needs Expo Router's navigation container, so the route is stood in for by a line of text
jest.mock('expo-router', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return { Slot: () => createElement(Text, null, 'The route') };
});

// The splash is native, so holding it is observed
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
}));

// Starting sync downloads a year of prayer times, so the start is observed instead of run
jest.mock('@/stores/sync', () => ({ ...jest.requireActual('@/stores/sync'), triggerSyncLoadable: jest.fn() }));

/** A frame and the macrotask after it, which is when the sheets mount */
const FIRST_FRAME_MS = 50;

interface LoadedModules {
  audio: typeof import('expo-audio');
  logger: typeof logger;
  reactNative: typeof import('react-native');
  reanimated: typeof import('react-native-reanimated');
  splash: typeof import('expo-splash-screen');
  sync: typeof import('@/stores/sync');
  taskManager: typeof import('expo-task-manager');
}

/**
 * Loads the layout in a fresh module registry, as a launch does, once `prepare` has set up that registry's modules
 *
 * The set-up runs as the module loads. The file's own import has already run it, and every test clears those calls
 */
const loadLayout = (prepare: (modules: LoadedModules) => void = () => {}): LoadedModules => {
  let modules!: LoadedModules;
  jest.isolateModules(() => {
    modules = {
      audio: require('expo-audio'),
      logger: require('@/shared/logger').default,
      reactNative: require('react-native'),
      reanimated: require('react-native-reanimated'),
      splash: require('expo-splash-screen'),
      sync: require('@/stores/sync'),
      taskManager: require('expo-task-manager'),
    };
    prepare(modules);
    require('../../app/_layout');
  });
  return modules;
};

describe('the root layout as it loads', () => {
  it('holds the splash', () => {
    const { splash } = loadLayout();

    expect(splash.preventAutoHideAsync).toHaveBeenCalledTimes(1);
  });

  it('does not start sync while it loads', () => {
    jest.useFakeTimers();

    const { sync } = loadLayout();

    expect(sync.triggerSyncLoadable).not.toHaveBeenCalled();
  });

  it('starts sync on the turn after it loads', () => {
    jest.useFakeTimers();
    const { sync } = loadLayout();

    jest.advanceTimersByTime(0);

    expect(sync.triggerSyncLoadable).toHaveBeenCalledTimes(1);
  });

  it('makes sound previews audible with the ring switch on silent', () => {
    const { audio } = loadLayout();

    expect(audio.setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });

  it('logs, rather than throws, when the audio mode cannot be set', async () => {
    const error = new Error('Audio session unavailable');
    const modules = loadLayout(({ audio }) => {
      jest.mocked(audio.setAudioModeAsync).mockImplementationOnce(() => Promise.reject(error));
    });

    await new Promise(setImmediate);

    expect(modules.logger.warn).toHaveBeenCalledWith('AUDIO: Failed to set audio mode', { error });
  });

  it('defines the background task, so a launch the system starts in the background can find it', () => {
    const { taskManager } = loadLayout();

    expect(taskManager.defineTask).toHaveBeenCalledWith(BACKGROUND_TASK_NAME, expect.any(Function));
  });

  it('hides require-cycle warnings from the development console', () => {
    const { reactNative } = loadLayout((modules) => {
      jest.spyOn(modules.reactNative.LogBox, 'ignoreLogs');
    });

    expect(reactNative.LogBox.ignoreLogs).toHaveBeenCalledWith(['Require cycle']);
  });

  it("turns off Reanimated's strict mode warnings", () => {
    const { reanimated } = loadLayout((modules) => {
      jest.spyOn(modules.reanimated, 'configureReanimatedLogger');
    });

    expect(reanimated.configureReanimatedLogger).toHaveBeenCalledWith({
      level: reanimated.ReanimatedLogLevel.warn,
      strict: false,
    });
  });
});

describe('the root layout on screen', () => {
  it('shows the route on the first frame, before the sheets mount', async () => {
    jest.useFakeTimers();

    await render(<Layout />);

    expect(screen.getByText('The route')).toBeOnTheScreen();
    expect(screen.queryByText('Set your preferences')).not.toBeOnTheScreen();
  });

  it('mounts the Settings, Athan and alert sheets once the first frame has passed', async () => {
    jest.useFakeTimers();
    await render(<Layout />);

    await act(() => jest.advanceTimersByTime(FIRST_FRAME_MS));

    expect(screen.getByText('Set your preferences')).toBeOnTheScreen();
    expect(screen.getByText('Select Athan')).toBeOnTheScreen();
    // The alert sheet has no prayer until a bell opens it, so its subtitle is all it shows beside the Athan sheet's
    expect(screen.getAllByText('Close to save')).toHaveLength(2);
  });

  it('shows the error screen in place of a route that threw', async () => {
    await render(<ErrorBoundary error={new Error('Unreadable value')} retry={() => Promise.resolve()} />);

    expect(screen.getByText('Something went wrong.')).toBeOnTheScreen();
  });

  it('logs the message of the error a route threw', async () => {
    await render(<ErrorBoundary error={new Error('Unreadable value')} retry={() => Promise.resolve()} />);

    expect(logger.error).toHaveBeenCalledWith('APP: Render threw, falling back to the error screen', {
      error: 'Unreadable value',
    });
  });
});
