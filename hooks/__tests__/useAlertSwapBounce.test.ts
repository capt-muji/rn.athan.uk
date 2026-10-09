/**
 * Unit tests for hooks/useAlertSwapBounce.ts
 *
 * The bell's change-bounce: settled at mount; when played, a dip and a spring home on both axes; and the glyph swap
 * handed over once, at the trough, only if the dip got there. Alert.tsx decides when to play it. The hook runs under
 * hookHarness and reanimatedFake, and the tests stand in for Reanimated by finishing or cutting short each dip, so
 * the frames themselves are out of reach.
 */

import { ANIMATION } from '@/shared/constants';
import { AlertType } from '@/shared/types';

import { useAlertSwapBounce } from '../useAlertSwapBounce';
import { mountHook } from './hookHarness';
import { type Animation, jsThreadCalls } from './reanimatedFake';

jest.mock('react', () => require('./hookHarness').react);
jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated);

type Timing = Extract<Animation, { kind: 'timing' }>;

const mountBounce = () => mountHook(() => useAlertSwapBounce(), undefined);

/** Each axis's animation, as the style reads it on the next render */
const axesOf = (view: ReturnType<typeof mountBounce>) => {
  view.rerender();
  const [x, y] = (view.result.style as unknown as { transform: [{ scaleX: unknown }, { scaleY: unknown }] }).transform;
  return { x: x.scaleX as Animation, y: y.scaleY as Animation };
};

const dipOf = (axis: Animation) => (axis as Extract<Animation, { kind: 'sequence' }>).animations[0] as Timing;

beforeEach(() => {
  jsThreadCalls.length = 0;
});

describe('useAlertSwapBounce', () => {
  it('mounts settled at full size on both axes', () => {
    expect(mountBounce().result.style).toEqual({ transform: [{ scaleX: 1 }, { scaleY: 1 }] });
  });

  it('dips both axes to 0.6 over the dip duration, then springs them home with the house spring', () => {
    const view = mountBounce();

    view.result.play(AlertType.Sound, jest.fn());

    const pop = {
      kind: 'sequence',
      animations: [
        {
          kind: 'timing',
          toValue: 0.6,
          config: { duration: ANIMATION.alertBounceDip, easing: { bezier: [0.23, 1, 0.32, 1] } },
          callback: expect.any(Function),
        },
        { kind: 'spring', toValue: 1, config: { damping: 12, stiffness: 500, mass: 0.5 } },
      ],
    };
    expect(axesOf(view)).toEqual({ x: pop, y: pop });
  });

  it.each([
    ['Off', AlertType.Off],
    ['Silent', AlertType.Silent],
    ['Sound', AlertType.Sound],
  ])('hands the %s glyph over once, on the JS thread, when the X dip reaches its trough', (_, target) => {
    const swapGlyph = jest.fn();
    const view = mountBounce();

    view.result.play(target, swapGlyph);
    const { x, y } = axesOf(view);
    expect(swapGlyph).not.toHaveBeenCalled();

    dipOf(y).callback?.(true);
    expect(swapGlyph).not.toHaveBeenCalled();

    dipOf(x).callback?.(true);
    expect(swapGlyph.mock.calls).toEqual([[target]]);
    expect(jsThreadCalls).toEqual([{ fn: swapGlyph, args: [target] }]);
  });

  it('keeps the old glyph when a dip is cut short, so a rollback that replays the bounce swaps only to its own target', () => {
    const swapGlyph = jest.fn();
    const view = mountBounce();

    view.result.play(AlertType.Sound, swapGlyph);
    const commit = axesOf(view);
    view.result.play(AlertType.Off, swapGlyph);
    const rollback = axesOf(view);

    // Assigning the rollback's bounce cancels the commit's, whose dips then end unfinished
    dipOf(commit.x).callback?.(false);
    dipOf(commit.y).callback?.(false);
    expect(swapGlyph).not.toHaveBeenCalled();

    dipOf(rollback.x).callback?.(true);
    expect(swapGlyph.mock.calls).toEqual([[AlertType.Off]]);
  });
});
