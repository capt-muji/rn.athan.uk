/**
 * What the veiled colour hooks hand Reanimated: an ink that rides its own tween inside a veil
 * interpolation, so the veil at 0 is bit-identical to the bare colour tween and at 1 rests on
 * the veil colour - solid colours end to end, never an opacity (T-294)
 */

import { ANIMATION } from '@/shared/constants';

import { useDerivedVeiledBackgroundColor, useDerivedVeiledColor } from '../useAnimation';
import { mountHook } from './hookHarness';
import type { Animation } from './reanimatedFake';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockAtomValues = new Map<string, unknown>();

jest.mock('react', () => require('./hookHarness').react);
jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated);
jest.mock('jotai', () => ({ useAtomValue: (atom: string) => mockAtomValues.get(atom) }));
jest.mock('@/stores/ui', () => ({ resyncAtom: 'resyncAtom' }));

const FROM = '#52529e';
const TO = '#ffffff';
const VEIL = '#0b0016';

interface VeiledProps {
  veilTarget: number;
  colorTarget: number;
}

const timing = (toValue: number, config: unknown): Animation => ({ kind: 'timing', toValue, config });

/** The interpolation descriptor a style property holds */
const descriptorOf = (result: unknown, property: string) =>
  (result as Record<string, { value: unknown; inputRange: number[]; outputRange: unknown[] }>)[property];

beforeEach(() => mockAtomValues.set('resyncAtom', 0));

describe('useDerivedVeiledColor', () => {
  it('wraps the colour tween inside the veil interpolation, the veil colour as its far end', () => {
    const view = mountHook(
      (props: VeiledProps) =>
        useDerivedVeiledColor(props.veilTarget, props.colorTarget, {
          fromColor: FROM,
          toColor: TO,
          veilColor: VEIL,
        }),
      { veilTarget: 0, colorTarget: 0 }
    );

    const veil = descriptorOf(view.result, 'color');
    const colour = veil.outputRange[0] as { outputRange: string[] };

    expect(veil.inputRange).toEqual([0, 1]);
    expect(veil.outputRange[1]).toBe(VEIL);
    expect(colour.outputRange).toEqual([FROM, TO]);
  });

  it('rides the colour tween untouched while no veil is drawn', () => {
    const view = mountHook(
      (props: VeiledProps) =>
        useDerivedVeiledColor(props.veilTarget, props.colorTarget, {
          fromColor: FROM,
          toColor: TO,
          veilColor: VEIL,
        }),
      { veilTarget: 0, colorTarget: 0 }
    );

    view.rerender({ veilTarget: 0, colorTarget: 1 });

    // The mock re-runs a derived value on every render, target changed or not, so the veil
    // emits its own timing here: what matters is that each interpolation tracks its own
    // progress, the veil's over the colour's
    const veil = descriptorOf(view.result, 'color');
    expect(veil.value).toEqual(timing(0, { duration: ANIMATION.duration }));
    expect((veil.outputRange[0] as { value: unknown }).value).toEqual(timing(1, { duration: ANIMATION.duration }));
  });

  it('draws the veil over whatever ink the colour tween rests on, at its own duration', () => {
    const view = mountHook(
      (props: VeiledProps) =>
        useDerivedVeiledColor(props.veilTarget, props.colorTarget, {
          fromColor: FROM,
          toColor: TO,
          veilColor: VEIL,
          veilDuration: ANIMATION.durationFade,
          duration: ANIMATION.durationSlow,
        }),
      { veilTarget: 0, colorTarget: 0 }
    );

    view.rerender({ veilTarget: 0, colorTarget: 1 });

    view.rerender({ veilTarget: 1, colorTarget: 1 });
    const veil = descriptorOf(view.result, 'color');
    expect(veil.value).toEqual(timing(1, { duration: ANIMATION.durationFade }));
    expect((veil.outputRange[0] as { value: unknown }).value).toEqual(timing(1, { duration: ANIMATION.durationSlow }));
  });

  it('carries the same composition on the background property', () => {
    const view = mountHook(
      (props: VeiledProps) =>
        useDerivedVeiledBackgroundColor(props.veilTarget, props.colorTarget, {
          fromColor: FROM,
          toColor: TO,
          veilColor: VEIL,
        }),
      { veilTarget: 0, colorTarget: 0 }
    );

    const veil = descriptorOf(view.result, 'backgroundColor');
    expect(veil.outputRange[1]).toBe(VEIL);
    expect((veil.outputRange[0] as { outputRange: string[] }).outputRange).toEqual([FROM, TO]);
  });
});
