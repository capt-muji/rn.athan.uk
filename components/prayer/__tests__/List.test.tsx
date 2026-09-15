/**
 * A day's prayer list: which rows it draws in what order, and when it measures its place in the window for the overlay
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { View } from 'react-native';

import { showLondonDay } from '@/__tests__/harness';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { countdownBarShownAtom, getMeasurementsList } from '@/stores/ui';

import List from '../List';

type Measured = (pageX: number, pageY: number, width: number, height: number) => void;

// React Native's Jest View never answers measureInWindow, so a test hands back the place a phone would report
const measureInWindow = jest.mocked(
  (View as unknown as { prototype: { measureInWindow: (callback: Measured) => void } }).prototype.measureInWindow
);

// A test that fails before its measure would otherwise leave its answer queued for the next test
afterEach(() => measureInWindow.mockReset());

/** Answers the list's next measure with a place in the window */
const reportPlace = (pageX: number, pageY: number, width: number, height: number) =>
  measureInWindow.mockImplementationOnce((callback) => callback(pageX, pageY, width, height));

/** Sends the layout event a phone sends once the list has a size */
const layOutList = async () => {
  const list = screen.root;
  if (!list) throw new Error('The list drew nothing to lay out');
  await fireEvent(list, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 366, height: 342 } } });
};

const PRAYER_NAME = new RegExp(`^(${[...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH].join('|')})$`);

/** The English prayer names on screen, top to bottom */
const namesOnScreen = () => screen.getAllByText(PRAYER_NAME).map((name) => name.children.join(''));

describe('the Standard list before any prayer times are stored', () => {
  it('draws nothing', async () => {
    await render(<List type={ScheduleType.Standard} />);

    expect(screen.toJSON()).toBeNull();
  });
});

describe('the lists on Friday 11 September 2026 at 14:00', () => {
  // [list, schedule, the rows top to bottom]
  it.each<[string, ScheduleType, string[]]>([
    ['Standard list', ScheduleType.Standard, ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Magrib', 'Isha']],
    [
      "Extras list, with Friday's Istijaba",
      ScheduleType.Extra,
      ['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba'],
    ],
  ])("draws the day's %s", async (_list, type, names) => {
    showLondonDay('2026-09-11', '14:00');

    await render(<List type={type} />);

    expect(namesOnScreen()).toEqual(names);
  });
});

describe('the Extras list on Saturday 12 September 2026 at 03:00', () => {
  it("draws the day's rows with no Istijaba", async () => {
    showLondonDay('2026-09-12', '03:00');

    await render(<List type={ScheduleType.Extra} />);

    expect(namesOnScreen()).toEqual(['Midnight', 'Last Third', 'Suhoor', 'Duha']);
  });
});

describe('the Standard list on Friday 11 September 2026 at 14:00', () => {
  it('leaves measuring to its first layout rather than measuring as it mounts', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<List type={ScheduleType.Standard} />);

    await act(() => jest.runOnlyPendingTimers());

    expect(measureInWindow).not.toHaveBeenCalled();
  });

  it('stores its place in the window when it first lays out', async () => {
    showLondonDay('2026-09-11', '14:00');
    reportPlace(12, 240, 366, 342);
    await render(<List type={ScheduleType.Standard} />);

    await layOutList();

    expect(getMeasurementsList()).toEqual({ pageX: 12, pageY: 240, width: 366, height: 342 });
  });

  it('measures nothing on a later layout once its place is stored', async () => {
    showLondonDay('2026-09-11', '14:00');
    reportPlace(12, 240, 366, 342);
    await render(<List type={ScheduleType.Standard} />);
    await layOutList();

    await layOutList();

    expect(measureInWindow).toHaveBeenCalledTimes(1);
  });

  it('measures its place again once the countdown bar is hidden, which moves the list', async () => {
    showLondonDay('2026-09-11', '14:00');
    reportPlace(12, 240, 366, 342);
    reportPlace(12, 180, 366, 342);
    await render(<List type={ScheduleType.Standard} />);
    await layOutList();

    // Settings writes this preference through the atom itself: the store has no setter for it
    await act(() => getDefaultStore().set(countdownBarShownAtom, false));
    await act(() => jest.runOnlyPendingTimers());

    expect(getMeasurementsList()).toEqual({ pageX: 12, pageY: 180, width: 366, height: 342 });
  });

  it('measures once when the countdown bar is switched off and on again before the list settles', async () => {
    showLondonDay('2026-09-11', '14:00');
    reportPlace(12, 240, 366, 342);
    await render(<List type={ScheduleType.Standard} />);

    await act(() => getDefaultStore().set(countdownBarShownAtom, false));
    await act(() => getDefaultStore().set(countdownBarShownAtom, true));
    await act(() => jest.runOnlyPendingTimers());

    expect(measureInWindow).toHaveBeenCalledTimes(1);
  });
});

describe('the Extras list on Friday 11 September 2026 at 14:00', () => {
  it('leaves its place unmeasured, on layout and when the countdown bar is hidden', async () => {
    showLondonDay('2026-09-11', '14:00');
    await render(<List type={ScheduleType.Extra} />);

    await layOutList();
    await act(() => getDefaultStore().set(countdownBarShownAtom, false));
    await act(() => jest.runOnlyPendingTimers());

    expect(measureInWindow).not.toHaveBeenCalled();
  });
});
