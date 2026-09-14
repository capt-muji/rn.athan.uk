/**
 * Unit tests for the derived transitions in hooks/useAnimation.ts
 *
 * What useDerivedProgress hands Reanimated, render by render: a settled value on its first evaluation and after a
 * resume, the timing it latched when the target last changed, and the config and delay it builds from that timing;
 * then what each style wrapper draws from the progress. The hooks run under hookHarness and reanimatedFake, so frames
 * and smoothness are out of reach here and only these decisions are shown.
 */

import { ANIMATION } from '@/shared/constants';

import {
  useDerivedBackgroundColor,
  useDerivedColor,
  useDerivedFill,
  useDerivedOpacity,
  useDerivedProgress,
  useDerivedTranslateY,
} from '../useAnimation';
import { mountHook } from './hookHarness';
import type { Animation } from './reanimatedFake';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockAtomValues = new Map<string, unknown>();

jest.mock('react', () => require('./hookHarness').react);
jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated);
jest.mock('jotai', () => ({ useAtomValue: (atom: string) => mockAtomValues.get(atom) }));
jest.mock('@/stores/ui', () => ({ resyncAtom: 'resyncAtom' }));

type Options = Parameters<typeof useDerivedProgress>[1];

interface ProgressProps {
  target: number;
  options?: Options;
}

const timing = (toValue: number, config: unknown): Animation => ({ kind: 'timing', toValue, config });
const delayed = (delayMs: number, animation: Animation): Animation => ({ kind: 'delay', delayMs, animation });
const configOf = (animation: unknown) => (animation as { config: unknown }).config;

const easeIn = (t: number) => t * t;

const mountProgress = (target: number, options?: Options) => {
  const props: ProgressProps = { target, options };
  return mountHook(({ target, options }: ProgressProps) => useDerivedProgress(target, options), props);
};

beforeEach(() => mockAtomValues.set('resyncAtom', 0));

describe('useDerivedProgress', () => {
  it.each([0, 1, 0.25, 175])('settles at %d on its first evaluation instead of animating there', (target) => {
    const view = mountProgress(target, { duration: ANIMATION.durationSlow, delay: ANIMATION.cascadeDelay });

    expect(view.result.value).toBe(target);
  });

  it('animates every later change of target, over the standard duration and at once by default', () => {
    const view = mountProgress(0);

    view.rerender({ target: 1 });
    expect(view.result.value).toEqual(timing(1, { duration: ANIMATION.duration }));

    view.rerender({ target: 0 });
    expect(view.result.value).toEqual(timing(0, { duration: ANIMATION.duration }));
  });

  it('settles on the evaluation after a resume, whether or not the target moved, then animates again', () => {
    const options = { duration: ANIMATION.durationSlow };
    const view = mountProgress(0, options);
    view.rerender({ target: 1, options });
    expect(view.result.value).toEqual(timing(1, options));

    mockAtomValues.set('resyncAtom', 1);
    view.rerender({ target: 0, options });
    expect(view.result.value).toBe(0);

    mockAtomValues.set('resyncAtom', 2);
    view.rerender({ target: 0, options });
    expect(view.result.value).toBe(0);

    view.rerender({ target: 1, options });
    expect(view.result.value).toEqual(timing(1, options));
  });

  it('keeps the timing it took when the target changed, though a re-render mid-transition brings other options', () => {
    const cascade = { duration: ANIMATION.durationSlow, delay: ANIMATION.cascadeDelay };
    const view = mountProgress(0, cascade);

    view.rerender({ target: 1, options: cascade });
    const inFlight = delayed(ANIMATION.cascadeDelay, timing(1, { duration: ANIMATION.durationSlow }));
    expect(view.result.value).toEqual(inFlight);

    view.rerender({ target: 1, options: { duration: ANIMATION.durationFade } });
    expect(view.result.value).toEqual(inFlight);

    view.rerender({ target: 0, options: { duration: ANIMATION.durationFade } });
    expect(view.result.value).toEqual(timing(0, { duration: ANIMATION.durationFade }));
  });

  // Exact keys matter: an explicit `easing: undefined` overrides Reanimated's default and withTiming calls undefined(t)
  it.each<[string, Options, unknown]>([
    ['no options', undefined, { duration: ANIMATION.duration }],
    ['a duration', { duration: ANIMATION.durationFade }, { duration: ANIMATION.durationFade }],
    ['an easing', { easing: easeIn }, { duration: ANIMATION.duration, easing: easeIn }],
    ['an undefined easing', { easing: undefined }, { duration: ANIMATION.duration }],
    [
      'defaultTiming off',
      { defaultTiming: false, duration: ANIMATION.durationFade },
      { duration: ANIMATION.durationFade },
    ],
    ['defaultTiming on', { defaultTiming: true, duration: ANIMATION.durationSlow, easing: easeIn }, undefined],
  ])('given %s, times the change with config %p', (_, options, config) => {
    const view = mountProgress(0, options);
    view.rerender({ target: 1, options });

    expect(configOf(view.result.value)).toStrictEqual(config);
  });

  it.each<[number | undefined, boolean]>([
    [undefined, false],
    [0, false],
    [1, true],
    [ANIMATION.cascadeDelay, true],
    [ANIMATION.durationSlow, true],
  ])('with a delay of %p ms, holds the change back: %p', (delay, isHeldBack) => {
    const view = mountProgress(0, { delay });
    view.rerender({ target: 1, options: { delay } });

    const animation = timing(1, { duration: ANIMATION.duration });
    expect(view.result.value).toEqual(isHeldBack ? delayed(delay as number, animation) : animation);
  });
});

// =============================================================================
// WHAT THE WRAPPERS DRAW
// =============================================================================

describe('the derived style wrappers', () => {
  it('useDerivedOpacity draws the progress as opacity, timed by its options', () => {
    const view = mountHook(
      (props: { target: number }) => useDerivedOpacity(props.target, { duration: ANIMATION.durationFade }),
      { target: 1 }
    );
    expect(view.result).toEqual({ opacity: 1 });

    view.rerender({ target: 0 });
    expect(view.result).toEqual({ opacity: timing(0, { duration: ANIMATION.durationFade }) });
  });

  it('useDerivedTranslateY draws the progress as a vertical offset, timed by its options', () => {
    const view = mountHook(
      (props: { target: number }) => useDerivedTranslateY(props.target, { duration: ANIMATION.durationFade }),
      { target: 180 }
    );
    expect(view.result).toEqual({ transform: [{ translateY: 180 }] });

    view.rerender({ target: 240 });
    expect(view.result).toEqual({ transform: [{ translateY: timing(240, { duration: ANIMATION.durationFade }) }] });
  });

  const FROM = '#6b6b80';
  const TO = '#ffffff';

  const colourWrappers = [
    ['useDerivedColor', 'color', useDerivedColor],
    ['useDerivedBackgroundColor', 'backgroundColor', useDerivedBackgroundColor],
    ['useDerivedFill', 'fill', useDerivedFill],
  ] as const;

  it.each(colourWrappers)('%s maps progress 0 to the first colour and 1 to the second, as %s', (_, property, hook) => {
    const view = mountHook((props: { target: number }) => hook(props.target, { fromColor: FROM, toColor: TO }), {
      target: 1,
    });

    expect(view.result).toEqual({ [property]: { value: 1, inputRange: [0, 1], outputRange: [FROM, TO] } });
  });

  it.each(colourWrappers)('%s passes every timing option through to its progress', (_, property, hook) => {
    const progressOf = (result: unknown) => (result as Record<string, { value: unknown }>)[property].value;

    const timed = mountHook(
      (props: { target: number }) =>
        hook(props.target, {
          fromColor: FROM,
          toColor: TO,
          duration: ANIMATION.durationFade,
          delay: ANIMATION.cascadeDelay,
          easing: easeIn,
        }),
      { target: 0 }
    );
    timed.rerender({ target: 1 });
    expect(progressOf(timed.result)).toEqual(
      delayed(ANIMATION.cascadeDelay, timing(1, { duration: ANIMATION.durationFade, easing: easeIn }))
    );

    const byDefault = mountHook(
      (props: { target: number }) =>
        hook(props.target, { fromColor: FROM, toColor: TO, duration: ANIMATION.durationFade, defaultTiming: true }),
      { target: 0 }
    );
    byDefault.rerender({ target: 1 });
    expect(configOf(progressOf(byDefault.result))).toBeUndefined();
  });
});
