/**
 * Unit tests for the imperative animations in hooks/useAnimation.ts
 *
 * useAnimationOpacity and useAnimationScale, which press handlers drive directly: where each mounts, the animation
 * `animate` starts, when that animation is held back, and when it reports back. The hooks run under hookHarness and
 * reanimatedFake, so only what they ask Reanimated for is shown, never how it looks.
 */

import { ANIMATION } from '@/shared/constants';

import { useAnimationOpacity, useAnimationScale } from '../useAnimation';
import { mountHook } from './hookHarness';
import { type Animation, jsThreadCalls } from './reanimatedFake';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
jest.mock('react', () => require('./hookHarness').react);
jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated);
jest.mock('jotai', () => ({ useAtomValue: jest.fn() }));
jest.mock('@/stores/ui', () => ({ resyncAtom: 'resyncAtom' }));

type Leaf = Extract<Animation, { kind: 'timing' | 'spring' }>;

/** The timing or spring itself, looking through a delay */
const leafOf = (animation: unknown): Leaf => {
  const described = animation as Animation;
  return (described.kind === 'delay' ? described.animation : described) as Leaf;
};

const hooks = [
  ['useAnimationOpacity', useAnimationOpacity],
  ['useAnimationScale', useAnimationScale],
] as const;

beforeEach(() => {
  jsThreadCalls.length = 0;
});

describe('useAnimationOpacity', () => {
  it.each<[number | undefined, number]>([
    [undefined, 0],
    [0, 0],
    [1, 1],
  ])('given %p, mounts drawn at opacity %p', (initial, opacity) => {
    const view = mountHook(() => useAnimationOpacity(initial), undefined);

    expect(view.result.style).toEqual({ opacity });
  });

  it('fades over the slow duration unless given one, and draws the fade', () => {
    const view = mountHook(() => useAnimationOpacity(0), undefined);

    view.result.animate(1);
    expect(view.result.value.value).toEqual({
      kind: 'timing',
      toValue: 1,
      config: { duration: ANIMATION.durationSlow },
      callback: expect.any(Function),
    });
    view.rerender();
    expect(view.result.style).toEqual({ opacity: view.result.value.value });

    view.result.animate(0, { duration: ANIMATION.durationFade });
    expect(view.result.value.value).toEqual({
      kind: 'timing',
      toValue: 0,
      config: { duration: ANIMATION.durationFade },
      callback: expect.any(Function),
    });
  });
});

describe('useAnimationScale', () => {
  it.each<[number | undefined, number]>([
    [undefined, 1],
    [0.9, 0.9],
  ])('given %p, mounts drawn at scale %p', (initial, scale) => {
    const view = mountHook(() => useAnimationScale(initial), undefined);

    expect(view.result.style).toEqual({ transform: [{ scale }] });
  });

  it('springs to the target with the house press spring, and draws the spring', () => {
    const view = mountHook(() => useAnimationScale(1), undefined);

    view.result.animate(0.9);
    expect(view.result.value.value).toEqual({
      kind: 'spring',
      toValue: 0.9,
      config: { damping: 12, stiffness: 500, mass: 0.5 },
      callback: expect.any(Function),
    });
    view.rerender();
    expect(view.result.style).toEqual({ transform: [{ scale: view.result.value.value }] });
  });
});

describe('both imperative hooks', () => {
  it.each(hooks.flatMap(([name, hook]) => [0, 1, ANIMATION.cascadeDelay].map((delay) => [name, delay, hook] as const)))(
    '%s, given a delay of %p ms, holds its animation back only when the delay is above zero',
    (_, delay, hook) => {
      const view = mountHook(() => hook(), undefined);

      view.result.animate(0.5, { delay });

      const animation = view.result.value.value as unknown as Animation;
      expect(animation.kind === 'delay').toBe(delay > 0);
      if (animation.kind === 'delay') expect(animation.delayMs).toBe(delay);
      expect(leafOf(animation).toValue).toBe(0.5);
    }
  );

  it.each(hooks)('%s reports back on the JS thread once its animation finishes, never when cut short', (_, hook) => {
    const onFinish = jest.fn();
    const view = mountHook(() => hook(), undefined);

    view.result.animate(0.5, { onFinish, delay: ANIMATION.cascadeDelay });
    const { callback } = leafOf(view.result.value.value);

    callback?.(false);
    expect(onFinish).not.toHaveBeenCalled();

    callback?.(true);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(jsThreadCalls).toEqual([{ fn: onFinish, args: [] }]);
  });

  it.each(hooks)('%s finishes quietly when nobody asked to hear about it', (_, hook) => {
    const view = mountHook(() => hook(), undefined);

    view.result.animate(0.5);

    expect(() => leafOf(view.result.value.value).callback?.(true)).not.toThrow();
    expect(jsThreadCalls).toEqual([]);
  });
});
