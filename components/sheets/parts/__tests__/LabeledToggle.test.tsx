/**
 * A settings row: a label beside a switch, and the one change a press on either makes
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native';
import type { TestInstance } from 'test-renderer';

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

  // The track carries no text, so without the setting's own label the switch announces only "off"
  it('names the switch with the setting it controls', async () => {
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch', { name: 'Show seconds' })).toBeOnTheScreen();
  });

  it('toggles once, with one medium haptic, when the label is pressed', async () => {
    const onToggle = jest.fn();
    await render(<LabeledToggle label='Show seconds' value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByText('Show seconds'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
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

// The owner's general row rule (T-540, order 2026-10-31): a label that runs long ellipsizes at
// one line and never displaces the control at its edge - the XS in Spanish pushed the control
// out of the card. The worst real input is the longest string any shipped catalog carries for
// a settings row (Italian, the countdown-bar row); the artificial one runs past every catalog
const ROW_LABEL_ONE_LINE = (label: TestInstance) => {
  expect(label.props.numberOfLines).toBe(1);
  expect(StyleSheet.flatten(label.props.style).flexShrink).toBe(1);
  // The control the label must not displace: the switch still renders beside it
  expect(screen.getByRole('switch')).toBeOnTheScreen();
};

describe('a settings toggle row whose label runs long', () => {
  it('ellipsizes at one line with the longest string any shipped catalog carries', async () => {
    await render(<LabeledToggle label='Mostra la barra del conto alla rovescia' value={false} onToggle={jest.fn()} />);

    ROW_LABEL_ONE_LINE(screen.getByText('Mostra la barra del conto alla rovescia'));
  });

  it('ellipsizes at one line with a string longer than any shipped catalog', async () => {
    const artificial = 'A row label long enough to outgrow the narrowest card any shipped language fills';

    await render(<LabeledToggle label={artificial} value={false} onToggle={jest.fn()} />);

    ROW_LABEL_ONE_LINE(screen.getByText(artificial));
  });
});
