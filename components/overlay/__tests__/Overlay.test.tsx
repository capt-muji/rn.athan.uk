/**
 * The overlay's input layer: the Close targets around the selected row, the Extras explanation, the close fade, and
 * Android's back press
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai/vanilla';
import { BackHandler, DeviceEventEmitter, Dimensions, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { showLondonDay } from '@/__tests__/harness';
import { buildCatcherRegions } from '@/components/overlay/catcherGeometry';
import { COLORS } from '@/shared/constants';
import { perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { overlayFadeSettledAtom } from '@/stores/atoms/overlay';
import { closeOverlay, openOverlay, overlayAtom } from '@/stores/overlay';
import { setMeasurementsList } from '@/stores/ui';

import Overlay from '../Overlay';
import OverlayInfoBox from '../OverlayInfoBox';

// Opening and closing are measured for the device performance runs, which read the pairing of names
jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));
// Jest resolves React Native for iOS, whose BackHandler never fires. The overlay's back handling exists for Android,
// so the hardware back press runs through React Native's own Android implementation
jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android')
);

const pressBack = () =>
  act(() => {
    DeviceEventEmitter.emit('hardwareBackPress');
  });

const DHUHR = 2;

/** Where the list sits on screen, as List measures it */
const LIST = { pageX: 16, pageY: 200, width: 379, height: 342 };

const closeTargets = (options: { includeHiddenElements?: boolean } = {}) =>
  screen.queryAllByRole('button', { name: 'Close prayer details', ...options });

describe('the overlay layer on Friday 11 September 2026 at 14:00', () => {
  it('offers a screen reader no Close target while closed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);

    await render(<Overlay />);

    expect(closeTargets()).toHaveLength(0);
  });

  // [situation, Close targets, the list as measured]
  it.each([
    ['before the list is measured', 1, null],
    ['around the row on a measured list', 4, LIST],
  ])('opens on Dhuhr with Close targets %s: %i of them', async (_situation, count, list) => {
    showLondonDay('2026-09-11', '14:00');
    if (list) setMeasurementsList(list);
    await render(<Overlay />);

    await act(() => openOverlay(ScheduleType.Standard, DHUHR));

    expect(closeTargets()).toHaveLength(count);
  });

  it('closes with a medium haptic when a Close target is pressed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));

    await fireEvent.press(closeTargets()[0]);

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    expect(closeTargets()).toHaveLength(0);
  });

  it('ignores a tap on the close layer while it fades out', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => closeOverlay());

    await fireEvent.press(closeTargets({ includeHiddenElements: true })[0]);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  // The display value is the rule itself (the retired ai/AGENTS.md (git history), Performance Design Rule 4): the layer stays displayed
  // while the fade flag is down, whatever isOn says, and drops once the fade has truly settled — the flag is the only clock, no wall
  // timer phase-locked to the JS call (which step 10 caught cutting the fade mid-travel on the 3T). The jest mock completes animations
  // on the render that starts them and act drains every settle before a test can read, so the mid-fade flex window is pinned at the
  // unit level (overlayPlacement's table) and by the rows and badge; here the drop is pinned end to end
  it('drops the layer once the fade settles, from a flag that started down', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    getDefaultStore().set(overlayFadeSettledAtom, false);
    await render(<Overlay />);
    const layer = () => screen.queryAllByTestId('overlay-layer', { includeHiddenElements: true })[0];

    await act(async () => {
      await Promise.resolve();
    });

    expect(getDefaultStore().get(overlayFadeSettledAtom)).toBe(true);
    expect(layer()).toHaveStyle({ display: 'none' });
  });

  it('returns the fade-settled flag to true when its fade completes, on open and on close', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Overlay />);
    const store = getDefaultStore();

    await act(async () => openOverlay(ScheduleType.Standard, DHUHR));
    expect(store.get(overlayFadeSettledAtom)).toBe(true);

    await act(async () => closeOverlay());
    expect(store.get(overlayFadeSettledAtom)).toBe(true);
  });

  it('drops the explanation box at the settle like the layer, from a flag that started down', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    getDefaultStore().set(overlayFadeSettledAtom, false);
    await render(
      <>
        <Overlay />
        <OverlayInfoBox type={ScheduleType.Extra} />
      </>
    );
    const placer = () => screen.queryAllByTestId('overlay-infobox', { includeHiddenElements: true })[0];

    await act(async () => {
      await Promise.resolve();
    });

    expect(placer()).toHaveStyle({ display: 'none' });
  });

  it('stays shown when it opens again after a close, whatever the flag held', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => closeOverlay());

    await act(() => openOverlay(ScheduleType.Standard, DHUHR));

    expect(closeTargets()).toHaveLength(4);
  });

  // [selected index, prayer, explanation]
  it.each([
    [0, 'Midnight', 'Halfway between Magrib and Fajr'],
    [4, 'Istijaba', '1 hour before Magrib (Fridays only)'],
  ])('explains the Extras row at index %i, %s, when the overlay opens on it', async (index, name, english) => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(
      <>
        <Overlay />
        <OverlayInfoBox type={ScheduleType.Extra} />
      </>
    );

    await act(() => openOverlay(ScheduleType.Extra, index));

    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText(english)).toBeVisible();
  });

  it('raises the explanation inks from the card surface as the box reveals', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(
      <>
        <Overlay />
        <OverlayInfoBox type={ScheduleType.Extra} />
      </>
    );
    const interpolateColor = jest.spyOn(Reanimated, 'interpolateColor');

    await act(() => openOverlay(ScheduleType.Extra, 0));

    // The reveal drives the face's fade and the inks' rise from the card's own surface; the
    // placer itself no longer fades, so nothing that holds text carries an opacity
    expect(
      interpolateColor.mock.calls.filter(
        (call) => (call[2] as unknown as readonly string[])[0] === COLORS.surface.elevated
      ).length
    ).toBeGreaterThanOrEqual(2);
    const placer = screen.queryAllByTestId('overlay-infobox', { includeHiddenElements: true })[0];
    expect(StyleSheet.flatten(placer.props.style).opacity).toBeUndefined();
  });

  // [action, open before the action, the action, the measure, the mark it measures from]
  it.each([
    ['opens', false, () => openOverlay(ScheduleType.Standard, DHUHR), 'overlay_open', 'overlay_open_start'],
    ['closes', true, () => closeOverlay(), 'overlay_close', 'overlay_close_start'],
  ])('measures the commit when it %s against its own start mark', async (_action, open, change, measure, startMark) => {
    showLondonDay('2026-09-11', '14:00');
    await render(<Overlay />);
    if (open) await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    jest.mocked(perfMeasure).mockClear();

    await act(() => change());

    expect(perfMeasure).toHaveBeenLastCalledWith(measure, startMark);
  });

  // R4.1: pageX and pageY never mirror, so each catcher keeps its measured left as a transform
  // under the layer's left-to-right containing view rather than as a swappable inset
  it('pins every Close catcher at its measured left edge through a transform, with no left key', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));

    const { width, height } = Dimensions.get('window');
    const regions = buildCatcherRegions({ windowWidth: width, windowHeight: height, list: LIST, rowIndex: DHUHR });
    const catchers = closeTargets();

    expect(catchers).toHaveLength(regions.length);
    catchers.forEach((catcher, index) => {
      const style = StyleSheet.flatten(catcher.props.style) as {
        left?: unknown;
        transform?: { translateX?: number }[];
      };
      expect(style.transform?.[0]).toEqual({ translateX: regions[index].left });
      expect(style.left).toBeUndefined();
    });
  });
});

describe("Android's back button and the overlay", () => {
  /** Whether the overlay is open, as the store holds it */
  const isOpen = () => getDefaultStore().get(overlayAtom).isOn;

  it('closes the overlay while it is open, and keeps the app from going back', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));

    await pressBack();

    expect(isOpen()).toBe(false);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('leaves the press to the app while the overlay is closed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<Overlay />);

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
  });

  it('leaves the press to the app again once the overlay has closed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    const exitApp = jest.spyOn(BackHandler, 'exitApp');
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => closeOverlay());

    await pressBack();

    expect(exitApp).toHaveBeenCalledTimes(1);
  });

  // The catchers fire a haptic because a finger touched the screen; a back press did not
  it('closes without the tap haptic, which only a press on the screen earns', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Extra, 0));
    jest.mocked(Haptics.impactAsync).mockClear();

    await pressBack();

    expect(isOpen()).toBe(false);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
