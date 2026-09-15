/**
 * One row of the Athan list: its name, what pressing the row or its play button does, and the preview countdown
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';

import { perfMark } from '@/shared/perf';

import SoundItem from '../SoundItem';

// Taps are marked only in a measurement build (EXPO_PUBLIC_PERF_MONITOR), so which mark a tap takes is observed
jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));

const COUNTDOWN = /^\d+:\d{2}$/;

const onSelect = jest.fn();
const onPlayPress = jest.fn();

/** The third row of the list, neither selected nor playing, unless a test says otherwise */
const athan3 = (props: Partial<ComponentProps<typeof SoundItem>> = {}) => (
  <SoundItem
    index={2}
    isSelected={false}
    isPlaying={false}
    remainingSeconds={0}
    onSelect={onSelect}
    onPlayPress={onPlayPress}
    {...props}
  />
);

/** The play button has no role or label, so it is found as the element drawn beside the countdown */
const playButton = () => {
  const [, button] = screen.getByText(COUNTDOWN).parent!.children.filter((child) => typeof child !== 'string');
  return button;
};

describe('the Athan 3 row, not playing', () => {
  it('is named by its place in the list', async () => {
    await render(athan3());

    expect(screen.getByText('Athan 3')).toBeOnTheScreen();
  });

  it('selects the row, with a medium haptic, when the row is pressed', async () => {
    await render(athan3());

    await fireEvent.press(screen.getByText('Athan 3'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(onPlayPress).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('plays the row, with a medium haptic, when its play button is pressed', async () => {
    await render(athan3());

    await fireEvent.press(playButton());

    expect(onPlayPress).toHaveBeenCalledTimes(1);
    expect(onPlayPress).toHaveBeenCalledWith(2);
    expect(onSelect).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('marks a tap on the row as a selection of its place for a measurement build', async () => {
    await render(athan3());

    await fireEvent.press(screen.getByText('Athan 3'));

    expect(jest.mocked(perfMark).mock.calls).toEqual([['sound_select_tap', { index: 2 }]]);
  });

  it('marks a tap on its play button as a play of its place for a measurement build', async () => {
    await render(athan3());

    await fireEvent.press(playButton());

    expect(jest.mocked(perfMark).mock.calls).toEqual([['sound_play_tap', { index: 2 }]]);
  });

  it('neither plays nor selects when a finger only touches the play button and lifts off it', async () => {
    await render(athan3());

    await fireEvent(playButton(), 'pressIn');
    await fireEvent(playButton(), 'pressOut');

    expect(onPlayPress).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('keeps its countdown hidden', async () => {
    await render(athan3());

    expect(screen.getByText(COUNTDOWN)).not.toBeVisible();
  });

  it('keeps its countdown hidden while selected, whatever seconds it is handed', async () => {
    await render(athan3({ isSelected: true, remainingSeconds: 30 }));

    expect(screen.getByText(COUNTDOWN)).not.toBeVisible();
  });

  // fireEvent would find the handler on the row's own props even if the view never received it, so the view the
  // phone lays out is checked for it instead
  it('hands the layout handler of the sheet that measures it to the view the phone lays out', async () => {
    const onLayout = jest.fn();

    await render(athan3({ onLayout }));

    expect(screen.getByText('Athan 3').parent).toHaveProp('onLayout', onLayout);
  });
});

describe('the Athan 3 row while its preview plays', () => {
  // Columns: whole seconds left, what the countdown shows
  it.each([
    [75, '1:15'],
    [65, '1:05'],
    [9, '0:09'],
  ])('shows %i seconds left as %s', async (remainingSeconds, shown) => {
    await render(athan3({ isPlaying: true, remainingSeconds }));

    expect(screen.getByText(shown)).toBeVisible();
  });

  it('keeps its countdown hidden until the seconds left are known', async () => {
    await render(athan3({ isPlaying: true, remainingSeconds: 0 }));

    expect(screen.getByText(COUNTDOWN)).not.toBeVisible();
  });

  it('holds the last second rather than showing 0:00 as the clip ends', async () => {
    await render(athan3({ isPlaying: true, remainingSeconds: 3 }));

    await screen.rerender(athan3({ isPlaying: true, remainingSeconds: 0 }));

    expect(screen.getByText('0:03')).toBeVisible();
    expect(screen.queryByText('0:00')).not.toBeOnTheScreen();
  });

  it('hides its countdown the moment the preview stops', async () => {
    await render(athan3({ isPlaying: true, remainingSeconds: 3 }));

    await screen.rerender(athan3({ isPlaying: false, remainingSeconds: 0 }));

    expect(screen.getByText(COUNTDOWN)).not.toBeVisible();
  });
});
