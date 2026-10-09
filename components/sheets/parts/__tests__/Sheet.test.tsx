/**
 * The bottom sheet every sheet is built on: what it shows, what it tells the app as the sheet library opens and closes
 * it, and Android's back button
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { BackHandler, DeviceEventEmitter, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onPlatform } from '@/__tests__/harness';
import { perfMark, perfMeasure } from '@/shared/perf';

import Sheet from '../Sheet';

// Timings are recorded only in a measurement build (EXPO_PUBLIC_PERF_MONITOR), so which ones the sheet takes is observed
jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));
// Jest resolves React Native for iOS, whose BackHandler never fires. The sheet's back handling exists for Android, so
// the hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const TITLE = 'Settings';

/** The settings sheet holding one row, unless a test says otherwise */
const settingsSheet = (props: Partial<ComponentProps<typeof Sheet>> = {}) => (
  <Sheet setRef={jest.fn()} title={TITLE} subtitle='Set your preferences' icon={<Text>icon</Text>} {...props}>
    <Text>Show seconds</Text>
  </Sheet>
);

/**
 * What the sheet library reports as it moves the sheet. Its published mock never moves, so the suite reports for it:
 * fireEvent finds the sheet's own callbacks from anything drawn inside it
 */
const libraryReports = (event: 'animate' | 'change' | 'dismiss', ...args: (number | null)[]) =>
  fireEvent(screen.getByText(TITLE), event, ...args);

/** A press of Android's hardware back button */
const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

/** The scroll views the sheet's content sits in */
const scrollViews = () => screen.container.queryAll((node) => node.type === 'RCTScrollView');

describe('a sheet as it mounts', () => {
  it('shows the content it is given', async () => {
    await render(settingsSheet());

    expect(screen.getByText('Show seconds')).toBeOnTheScreen();
  });

  it('hands the app its modal on mount, and takes it back on unmount', async () => {
    const setRef = jest.fn();
    await render(settingsSheet({ setRef }));

    await screen.unmount();

    expect(setRef).toHaveBeenCalledTimes(2);
    expect(setRef).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ present: expect.any(Function), dismiss: expect.any(Function) })
    );
    expect(setRef).toHaveBeenNthCalledWith(2, null);
  });

  it('asks the library for a sheet at 70% that a downward swipe closes, unless told otherwise', async () => {
    const setRef = jest.fn();

    await render(settingsSheet({ setRef }));

    expect(setRef.mock.calls[0][0].props).toMatchObject({
      snapPoints: ['70%'],
      enableDynamicSizing: false,
      enablePanDownToClose: true,
    });
  });

  it('asks the library for the snap points and the stacking it is given', async () => {
    const setRef = jest.fn();

    await render(settingsSheet({ setRef, snapPoints: ['80%'], stackBehavior: 'push' }));

    expect(setRef.mock.calls[0][0].props).toMatchObject({ snapPoints: ['80%'], stackBehavior: 'push' });
  });

  it('asks the library for no snap points when the sheet is sized to its content', async () => {
    const setRef = jest.fn();

    await render(settingsSheet({ setRef, snapPoints: ['80%'], enableDynamicSizing: true }));

    expect(setRef.mock.calls[0][0].props).toMatchObject({ snapPoints: undefined, enableDynamicSizing: true });
  });

  it('lets its content scroll', async () => {
    await render(settingsSheet());

    expect(scrollViews()).toHaveLength(1);
  });

  it('lays out a sheet that is not scrollable with no scroll view', async () => {
    await render(settingsSheet({ scrollable: false }));

    expect(scrollViews()).toHaveLength(0);
  });

  // The alert sheet is the one that does not scroll. The published mock of its fixed content view draws only the
  // children, so the space is read from the content view the sheet hands the library, for both layouts alike.
  // Columns: whether the sheet scrolls, the prop of its content view that carries the space below the content
  it.each([
    [true, 'contentContainerStyle'],
    [false, 'style'],
  ])(
    'leaves room below its content for the home indicator on iOS and none on Android, scrollable %s, in %s',
    async (scrollable, spaceProp) => {
      const homeIndicator = 34;
      const metrics = {
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: homeIndicator, left: 0 },
      };
      const setRef = jest.fn();
      const sheet = () => (
        <SafeAreaProvider initialMetrics={metrics}>{settingsSheet({ setRef, scrollable })}</SafeAreaProvider>
      );
      const spaceBelowContent = () =>
        StyleSheet.flatten(setRef.mock.calls[0][0].props.children.props[spaceProp])?.paddingBottom;
      await render(sheet());
      const onIos = spaceBelowContent();

      onPlatform('android');
      await screen.rerender(sheet());
      const onAndroid = spaceBelowContent();

      expect(onIos - onAndroid).toBe(homeIndicator);
    }
  );
});

describe('a sheet as the library opens and closes it', () => {
  it('gives one light haptic when a dismiss completes', async () => {
    await render(settingsSheet());

    await libraryReports('dismiss');

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('gives no haptic as it starts to close or settles closed, before the dismiss completes', async () => {
    await render(settingsSheet({ onDismiss: jest.fn() }));

    await libraryReports('animate', 0, -1);
    await libraryReports('change', -1);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('tells the screen when a dismiss completes', async () => {
    const onDismiss = jest.fn();
    await render(settingsSheet({ onDismiss }));

    await libraryReports('dismiss');

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('tells the screen as it starts to move', async () => {
    const onAnimate = jest.fn();
    await render(settingsSheet({ onAnimate }));

    await libraryReports('animate', 0, -1);

    expect(onAnimate).toHaveBeenCalledTimes(1);
  });

  it('runs its first-open work once, the first time it settles open', async () => {
    const onFirstPresent = jest.fn();
    await render(settingsSheet({ onFirstPresent }));

    await libraryReports('change', 0);
    await libraryReports('change', -1);
    await libraryReports('change', 0);

    expect(onFirstPresent).toHaveBeenCalledTimes(1);
  });

  it('does not count settling at a later snap point as its first open', async () => {
    const onFirstPresent = jest.fn();
    await render(settingsSheet({ snapPoints: ['50%', '90%'], onFirstPresent }));

    await libraryReports('change', 1);

    expect(onFirstPresent).not.toHaveBeenCalled();
  });
});

describe('the settings sheet in a measurement build', () => {
  // Columns: the snap point the library starts moving the sheet to, the mark taken
  it.each([
    [0, 'sheet_settings_animate'],
    [-1, 'sheet_settings_close_start'],
    [null, 'sheet_settings_close_start'],
  ])('marks a move towards %s as %s', async (toIndex, mark) => {
    await render(settingsSheet({ perfName: 'sheet_settings' }));

    await libraryReports('animate', 0, toIndex);

    expect(perfMark).toHaveBeenCalledTimes(1);
    expect(perfMark).toHaveBeenCalledWith(mark);
  });

  it('marks nothing when the sheet moves between open snap points', async () => {
    await render(settingsSheet({ perfName: 'sheet_settings', snapPoints: ['50%', '90%'] }));

    await libraryReports('animate', 0, 1);

    expect(perfMark).not.toHaveBeenCalled();
  });

  it('measures the open from the present and from the animation start once it settles open', async () => {
    await render(settingsSheet({ perfName: 'sheet_settings' }));

    await libraryReports('change', 0);

    expect(jest.mocked(perfMeasure).mock.calls).toEqual([
      ['sheet_settings_open', 'sheet_settings_present'],
      ['sheet_settings_open_anim', 'sheet_settings_animate'],
    ]);
  });

  it('measures the close from its start once it settles closed', async () => {
    await render(settingsSheet({ perfName: 'sheet_settings' }));

    await libraryReports('change', -1);

    expect(jest.mocked(perfMeasure).mock.calls).toEqual([['sheet_settings_close', 'sheet_settings_close_start']]);
  });
});

describe('a sheet with no perf name', () => {
  it('takes no timings as it opens and closes', async () => {
    await render(settingsSheet());

    await libraryReports('animate', -1, 0);
    await libraryReports('change', 0);
    await libraryReports('animate', 0, -1);
    await libraryReports('change', -1);

    expect(perfMark).not.toHaveBeenCalled();
    expect(perfMeasure).not.toHaveBeenCalled();
  });
});

describe("Android's back button and a sheet", () => {
  it('closes the sheet while it is open, and keeps the app from going back', async () => {
    const setRef = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(settingsSheet({ setRef }));
    const dismiss = jest.spyOn(setRef.mock.calls[0][0], 'dismiss');
    await libraryReports('change', 0);

    await pressBack();

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('leaves the press to the app while the sheet has not opened', async () => {
    const setRef = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(settingsSheet({ setRef }));
    const dismiss = jest.spyOn(setRef.mock.calls[0][0], 'dismiss');

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('leaves the press to the app again once the sheet has closed', async () => {
    const setRef = jest.fn();
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(settingsSheet({ setRef }));
    const dismiss = jest.spyOn(setRef.mock.calls[0][0], 'dismiss');
    await libraryReports('change', 0);
    await libraryReports('change', -1);

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
