/**
 * The segmented controls on the alert sheet: what a screen reader hears, what a press reports, where the pill sits
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import * as Reanimated from 'react-native-reanimated';

import { ANIMATION } from '@/shared/constants';
import { AlertType, Icon } from '@/shared/types';

import SegmentedControl, { type SegmentOption } from '../SegmentedControl';

// The alert sheet's own options: the Athan at prayer time, and the reminder's sound
const ATHAN_OPTIONS: SegmentOption[] = [
  { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];
const REMINDER_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

/** The row holding the options, which is what the phone measures */
const control = () => screen.getByRole('radio', { name: 'Silent' }).parent!;

/** The phone measuring the control at a width */
const measure = (width: number) =>
  fireEvent(control(), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 34 } } });

/** Everything the control draws; the pill has no role or text of its own, and is drawn before the options */
const drawn = () => control().children.filter((child) => typeof child !== 'string');

describe('the Athan control with Silent saved', () => {
  it('tells a screen reader that Silent is the selected option', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Off', selected: false })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Silent', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Sound', selected: false })).toBeOnTheScreen();
  });

  it('gives a light haptic and reports the option pressed', async () => {
    const onSelect = jest.fn();
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={onSelect} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Sound' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(AlertType.Sound);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('tells a screen reader the new selection when the saved option changes', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);

    await screen.rerender(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Silent', selected: false })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Sound', selected: true })).toBeOnTheScreen();
  });

  it('draws nothing but its three options until its width is known', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);

    expect(drawn()).toHaveLength(ATHAN_OPTIONS.length);
  });

  // ai/AGENTS.md: geometry an animation will own is right in the first frame, so the pill never squashes or slides in
  it('draws the pill one segment wide and already under Silent the moment its width is known', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);

    await measure(306);

    // 3 of padding on each side leaves 300 for three segments, and Silent is one segment along
    expect(drawn()).toHaveLength(ATHAN_OPTIONS.length + 1);
    expect(drawn()[0]).toHaveStyle({ width: 100, transform: [{ translateX: '100%' }] });
  });

  // ai/AGENTS.md: mount settles, and only a change of selection animates
  it('animates neither the pill nor the options into place when mounted', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);

    expect(withTiming).not.toHaveBeenCalled();
  });

  // ai/AGENTS.md: mount settles, and only a change of selection animates. The spy starts after the measure: the mock's
  // derived value runs again on every render, where the real one runs again only when the selection changes
  it('slides the pill to the new option, over the standard duration, when the saved option changes', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);
    await measure(306);
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await screen.rerender(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    // Sound is two segments along
    expect(withTiming).toHaveBeenCalledWith(200, { duration: ANIMATION.duration });
  });

  it('fades the old option out and the new one in, over the standard duration, when the saved option changes', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await screen.rerender(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    expect(withTiming).toHaveBeenCalledWith(0, { duration: ANIMATION.duration });
    expect(withTiming).toHaveBeenCalledWith(1, { duration: ANIMATION.duration });
  });

  it('moves the pill under the new option when the saved option changes', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);
    await measure(306);

    await screen.rerender(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    expect(drawn()[0]).toHaveStyle({ transform: [{ translateX: '200%' }] });
  });
});

describe('the reminder sound control while the reminder is off', () => {
  it('ignores a press, with no haptic', async () => {
    const onSelect = jest.fn();
    await render(
      <SegmentedControl options={REMINDER_OPTIONS} selected={AlertType.Silent} onSelect={onSelect} disabled />
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Sound' }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
