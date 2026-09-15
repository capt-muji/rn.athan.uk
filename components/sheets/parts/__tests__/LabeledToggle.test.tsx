/**
 * A settings row: a label beside a switch, and the one change a press on either makes
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { perfMark } from '@/shared/perf';

import LabeledToggle from '../LabeledToggle';

// Taps are marked only in a measurement build (EXPO_PUBLIC_PERF_MONITOR), so the mark a tap takes is observed
jest.mock('@/shared/perf', () => ({ perfMark: jest.fn(), perfMeasure: jest.fn() }));

describe('the Show seconds row in the settings sheet, switched off', () => {
  it('shows its label beside a switch a screen reader hears as off', async () => {
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={jest.fn()} />);

    expect(screen.getByText('Show seconds')).toBeOnTheScreen();
    expect(screen.getByRole('switch', { checked: false })).toBeOnTheScreen();
  });

  it('toggles once, with no haptic, when the label is pressed', async () => {
    const onToggle = jest.fn();
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByText('Show seconds'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('toggles once, with one medium haptic, when the switch itself is pressed', async () => {
    const onToggle = jest.fn();
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  // Columns: what is pressed, how a person finds it
  it.each([
    ['the label', () => screen.getByText('Show seconds')],
    ['the switch', () => screen.getByRole('switch')],
  ])('marks one toggle tap with its label for a measurement build when %s is pressed', async (_pressed, find) => {
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={jest.fn()} />);

    await fireEvent.press(find());

    expect(jest.mocked(perfMark).mock.calls).toEqual([['toggle_tap', { label: 'Show seconds' }]]);
  });
});
