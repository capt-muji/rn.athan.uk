/**
 * The switch on the alert sheet's reminder card: what a screen reader hears, where its thumb sits, what a press does
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { I18nManager } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { ANIMATION, SIZE } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';

import Toggle from '../Toggle';

/** The thumb has no role or text of its own: it is the one thing inside the switch */
const thumb = () => screen.getByRole('switch').children[0];

describe('the reminder switch', () => {
  it.each([true, false])('tells a screen reader whether it is on, given %s', async (value) => {
    await render(<Toggle value={value} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch', { checked: value })).toBeOnTheScreen();
  });

  it('tells a screen reader it can be used', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch')).toBeEnabled();
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates.
  // Columns: the value it mounts with, where its thumb sits on the first frame
  it.each([
    [true, SIZE.toggle.translateX],
    [false, 0],
  ])('mounted with %s, draws its thumb settled at %s on the first frame', async (value, position) => {
    await render(<Toggle value={value} onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: position }] });
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('does not animate its thumb into place when mounted on', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await render(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).not.toHaveBeenCalled();
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('animates its thumb to the on position, over the standard duration, when the value changes after mount', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).toHaveBeenCalledWith(SIZE.toggle.translateX, { duration: ANIMATION.duration });
  });

  it('moves its thumb to the on position when the value changes after mount', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: SIZE.toggle.translateX }] });
  });

  it('gives a medium haptic and reports one toggle when pressed', async () => {
    const onToggle = jest.fn();
    await render(<Toggle value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("borders its off state with the cards' edge colour", async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch')).toHaveStyle({
      borderColor: 'rgba(99, 102, 241, 0.15)',
      borderWidth: 1,
    });
  });

  it('keeps its on state border unchanged', async () => {
    await render(<Toggle value={true} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch')).toHaveStyle({ borderColor: '#672bcf' });
  });
});

describe('the reminder switch while the Athan is off', () => {
  it('tells a screen reader it is disabled', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} disabled />);

    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('ignores a press, with no haptic', async () => {
    const onToggle = jest.fn();
    await render(<Toggle value={false} onToggle={onToggle} disabled />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onToggle).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

// The thumb keys its direction on the active locale, not the bridge snapshot: a starved
// crossing (row 78) renders the Arabic locale while I18nManager still reports the launch
// direction, and the thumb left the track exactly there (row 73)
describe('the reminder switch under the Arabic locale while the bridge still reports LTR', () => {
  beforeEach(() => {
    // The starved state needs the bridge still reporting the launch direction: the real jest
    // bridge reports LTR, and a preset change that flips it would silently turn these into
    // completed-crossing tests
    expect(I18nManager.getConstants().isRTL).toBe(false);
    setActiveLocale('ar');
  });

  afterEach(() => {
    setActiveLocale('en');
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame
  it('draws its thumb settled at the mirrored on position when mounted on', async () => {
    await render(<Toggle value onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: -SIZE.toggle.translateX }] });
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('animates its thumb to the mirrored on position when the value changes after mount', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).toHaveBeenCalledWith(-SIZE.toggle.translateX, { duration: ANIMATION.duration });
    expect(withTiming).not.toHaveBeenCalledWith(SIZE.toggle.translateX, { duration: ANIMATION.duration });
  });
});
