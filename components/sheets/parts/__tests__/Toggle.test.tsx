/**
 * The switch on the alert sheet's reminder card: what a screen reader hears, where its thumb sits, what a press does
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { I18nManager, StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { ANIMATION, COLORS, SIZE } from '@/shared/constants';
import { setActiveLocale } from '@/shared/i18n/locale';

import { REMINDER_SWITCH, SEGMENT_PILL } from '../dim';
import Toggle, { type ToggleHandle } from '../Toggle';

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

  // AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates.
  // Columns: the value it mounts with, where its thumb sits on the first frame
  it.each([
    [true, SIZE.toggle.translateX],
    [false, 0],
  ])('mounted with %s, draws its thumb settled at %s on the first frame', async (value, position) => {
    await render(<Toggle value={value} onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: position }] });
  });

  // AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('does not animate its thumb into place when mounted on', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await render(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).not.toHaveBeenCalled();
  });

  // AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('animates its thumb to the on position, over the standard duration, when the value changes after mount', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    // The third argument is the settle the deferred write rides; an external value change
    // carries generation 0 and the settle writes nothing
    expect(withTiming).toHaveBeenCalledWith(
      SIZE.toggle.translateX,
      { duration: ANIMATION.duration },
      expect.any(Function)
    );
  });

  it('moves its thumb to the on position when the value changes after mount', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: SIZE.toggle.translateX }] });
  });

  it('reports one toggle when pressed, carrying the pressed target for the settled write, leaving the haptic to its owner row', async () => {
    const onToggle = jest.fn();
    await render(<Toggle value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('writes the pressed target once per press, in the pressed order', async () => {
    const writes: boolean[] = [];
    const StatefulToggle = () => {
      const [value, setValue] = useState(false);
      const write = (next: boolean) => {
        writes.push(next);
        setValue(next);
      };
      return <Toggle value={value} onToggle={write} />;
    };
    await render(<StatefulToggle />);

    await fireEvent.press(screen.getByRole('switch'));
    await fireEvent.press(screen.getByRole('switch'));

    expect(writes).toEqual([true, false]);
  });

  it('gives the press its own feedback through onPress, once', async () => {
    const onPress = jest.fn();
    await render(<Toggle value={false} onToggle={jest.fn()} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('a switch that answers refused presses', () => {
    it('fires the feedback for a frozen press and still writes nothing', async () => {
      const onPress = jest.fn();
      const onToggle = jest.fn();
      await render(<Toggle value={false} onToggle={onToggle} onPress={onPress} frozen feedbackWhenRefused />);

      await fireEvent.press(screen.getByRole('switch'));

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onToggle).not.toHaveBeenCalled();
      expect(thumb()).toHaveStyle({ transform: [{ translateX: 0 }] });
    });

    it('fires the feedback for a disabled press and still writes nothing', async () => {
      const onPress = jest.fn();
      const onToggle = jest.fn();
      await render(<Toggle value={false} onToggle={onToggle} onPress={onPress} disabled feedbackWhenRefused />);

      await fireEvent.press(screen.getByRole('switch'));

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('keeps a refused press silent without the ask, the contract every other caller holds', async () => {
      const onPress = jest.fn();
      const onToggle = jest.fn();
      await render(<Toggle value={false} onToggle={onToggle} onPress={onPress} frozen />);

      await fireEvent.press(screen.getByRole('switch'));

      expect(onPress).not.toHaveBeenCalled();
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('answers an accepted press once, feedback and write together', async () => {
      const onPress = jest.fn();
      const onToggle = jest.fn();
      await render(<Toggle value={false} onToggle={onToggle} onPress={onPress} feedbackWhenRefused />);

      await fireEvent.press(screen.getByRole('switch'));
      await act(() => jest.runAllTimersAsync());

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  it('lets a label drive the switch through its press handle, writing as the switch itself does', async () => {
    const onToggle = jest.fn();
    let handle: ToggleHandle | null = null;
    await render(
      <Toggle
        ref={(current) => {
          handle = current;
        }}
        value={false}
        onToggle={onToggle}
      />
    );

    await act(() => handle?.press());

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('writes nothing when its animation is superseded mid-flight, the completion cancelled', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    withTiming.mockImplementation(((target: number, _config: unknown, callback?: (finished: boolean) => void) => {
      callback?.(false);
      return target;
    }) as unknown as typeof Reanimated.withTiming);
    const onToggle = jest.fn();
    await render(<Toggle value={false} onToggle={onToggle} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onToggle).not.toHaveBeenCalled();
    withTiming.mockRestore();
  });

  it('writes nothing for an animation nobody pressed, however the value arrives', async () => {
    const onToggle = jest.fn();
    await render(<Toggle value={false} onToggle={onToggle} />);

    await screen.rerender(<Toggle value onToggle={onToggle} />);

    expect(onToggle).not.toHaveBeenCalled();
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

  // Owner order 2026-10-31, the 2.43.1 read: the circle reads exactly as dark as the row's hint
  // line beside it - the hint's own locked solid, not the brighter sheet-hint token
  it('dims its thumb to the locked hint ink, carrying no opacity of its own', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} disabled />);

    expect(thumb()).toHaveStyle({ backgroundColor: '#122246' });
    expect(StyleSheet.flatten(screen.getByRole('switch').props.style).opacity).toBeUndefined();
  });

  it("draws its disabled off track in the pill's locked-off solid", async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} disabled />);

    expect(screen.getByRole('switch')).toHaveStyle({ backgroundColor: '#0c193c', borderColor: '#0c193c' });
  });

  it("draws its disabled on track in the pill's locked-on pair", async () => {
    await render(<Toggle value onToggle={jest.fn()} disabled />);

    expect(screen.getByRole('switch')).toHaveStyle({ backgroundColor: '#141849', borderColor: '#171a4d' });
  });

  it('keeps its thumb in the primary ink while its row can be used', async () => {
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ backgroundColor: COLORS.text.primary });
  });
});

// Owner order 2026-11-01, the follow-up read: the thumb keeps its ink and the track darkens
// under it, so the thumb reads as a circle on the track instead of the one oval they both
// painted. Audited cold from the tokens, the same WCAG luminance the info card suite uses
describe("the disabled track's tokens", () => {
  /** Relative luminance of a #rrggbb solid, the repo's own WCAG formula */
  const luminanceOf = (hex: string): number => {
    const channel = (value: number) => {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const n = Number.parseInt(hex.slice(1), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };

  it('keeps the thumb at its locked ink, untouched', () => {
    expect(REMINDER_SWITCH.thumbDisabled).toBe('#122246');
  });

  it("takes the segment pill's own locked solids, pair for pair, no new ink", () => {
    expect(REMINDER_SWITCH.track.off).toEqual(SEGMENT_PILL.lockedOff);
    expect(REMINDER_SWITCH.track.on).toEqual(SEGMENT_PILL.lockedOn);
  });

  it('darkens both track backgrounds under the thumb', () => {
    const thumbLum = luminanceOf(REMINDER_SWITCH.thumbDisabled);

    expect(luminanceOf(REMINDER_SWITCH.track.off.background)).toBeLessThan(thumbLum);
    expect(luminanceOf(REMINDER_SWITCH.track.on.background)).toBeLessThan(thumbLum);
  });

  it('orders the three inks: off track darkest, then the on track, then the thumb', () => {
    const offLum = luminanceOf(REMINDER_SWITCH.track.off.background);
    const onLum = luminanceOf(REMINDER_SWITCH.track.on.background);
    const thumbLum = luminanceOf(REMINDER_SWITCH.thumbDisabled);

    expect(offLum).toBeLessThan(onLum);
    expect(onLum).toBeLessThan(thumbLum);
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

  // AGENTS.md: a toggle mounted on shows its settled state on the first frame
  it('draws its thumb settled at the mirrored on position when mounted on', async () => {
    await render(<Toggle value onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: -SIZE.toggle.translateX }] });
  });

  // AGENTS.md: a toggle mounted on shows its settled state on the first frame
  it('animates its thumb to the mirrored on position when the value changes after mount', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).toHaveBeenCalledWith(
      -SIZE.toggle.translateX,
      { duration: ANIMATION.duration },
      expect.any(Function)
    );
    expect(withTiming).not.toHaveBeenCalledWith(
      SIZE.toggle.translateX,
      { duration: ANIMATION.duration },
      expect.any(Function)
    );
  });
});
