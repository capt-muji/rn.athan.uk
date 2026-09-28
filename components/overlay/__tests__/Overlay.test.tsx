/**
 * The overlay's input layer: the Close targets around the selected row, the Extras explanation, the close fade, and
 * Android's back press
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { getDefaultStore } from 'jotai/vanilla';
import { BackHandler, DeviceEventEmitter, View } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { ANIMATION } from '@/shared/constants';
import { perfMeasure } from '@/shared/perf';
import { ScheduleType } from '@/shared/types';
import { closeOverlay, openOverlay, overlayAtom } from '@/stores/overlay';
import { measurementOriginOffsetAtom, setMeasurementOriginOffset, setMeasurementsList } from '@/stores/ui';

import Overlay from '../Overlay';

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

type Measured = (x: number, y: number) => void;

// React Native's Jest View never answers measureInWindow, so a test hands back the place a phone would report
const measureInWindow = jest.mocked(
  (View as unknown as { prototype: { measureInWindow: (cb: Measured) => void } }).prototype.measureInWindow
);

afterEach(() => measureInWindow.mockReset());

const closeTargets = (options: { includeHiddenElements?: boolean } = {}) =>
  screen.queryAllByRole('button', { name: 'Close prayer details', ...options });

describe('the overlay layer on Friday 11 September 2026 at 14:00', () => {
  it('offers a screen reader no Close target while closed', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);

    await render(<Overlay />);

    expect(closeTargets()).toHaveLength(0);
  });

  // The zero-size probe's own window position is what the box and catchers subtract. React
  // Native's Jest View never answers measureInWindow, so a test hands back the place a phone
  // would report, exactly as the List suite does for the list rect
  it('measures its origin probe at layout and records the offset it answers', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    measureInWindow.mockImplementationOnce((cb) => cb(0, 23.67));

    await render(<Overlay />);
    await fireEvent(screen.getByTestId('overlay-origin'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } },
    });

    expect(getDefaultStore().get(measurementOriginOffsetAtom)).toEqual({ x: 0, y: 23.67 });
    setMeasurementOriginOffset({ x: 0, y: 0 });
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
    await act(() => jest.advanceTimersByTime(ANIMATION.duration));

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

  // The display value is the rule itself (ai/AGENTS.md, Performance Design Rule 4): the layer stays displayed
  // through the close fade and is hidden only once it has run, whatever a screen reader is told meanwhile
  // [milliseconds into the close fade, the layer's display]
  it.each<[number, 'flex' | 'none']>([
    [ANIMATION.duration - 1, 'flex'],
    [ANIMATION.duration, 'none'],
  ])('keeps the close layer displayed through the fade: %i ms in, its display is %s', async (elapsed, display) => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => closeOverlay());

    await act(() => jest.advanceTimersByTime(elapsed));

    const layer = screen.queryAllByTestId('overlay-layer', { includeHiddenElements: true })[0];
    expect(layer).toHaveStyle({ display });
  });

  it('stays shown when it opens again before the close fade has run', async () => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);
    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => closeOverlay());
    await act(() => jest.advanceTimersByTime(ANIMATION.duration / 2));

    await act(() => openOverlay(ScheduleType.Standard, DHUHR));
    await act(() => jest.advanceTimersByTime(ANIMATION.duration));

    expect(closeTargets()).toHaveLength(4);
  });

  // [selected index, prayer, explanation, Arabic explanation]
  it.each([
    [0, 'Midnight', 'Halfway between Magrib and Fajr', 'نصف الليل بين المغرب والفجر'],
    [4, 'Istijaba', '1 hour before Magrib (Fridays only)', 'ساعة قبل المغرب (الجمعة فقط)'],
  ])('explains the Extras row at index %i, %s, when the overlay opens on it', async (index, name, english, arabic) => {
    showLondonDay('2026-09-11', '14:00');
    setMeasurementsList(LIST);
    await render(<Overlay />);

    await act(() => openOverlay(ScheduleType.Extra, index));

    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText(english)).toBeVisible();
    expect(screen.getByText(arabic)).toBeVisible();
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
