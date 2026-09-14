/**
 * Unit tests for hooks/useAlertAnimations.ts
 *
 * The bell carries two animations on separate wrappers, the press scale outside and the change-bounce inside, so the
 * two never fight, and both must mount settled. The hook runs under hookHarness and reanimatedFake.
 */

import { useAlertAnimations } from '../useAlertAnimations';
import { mountHook } from './hookHarness';

jest.mock('react', () => require('./hookHarness').react);
jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated);
jest.mock('jotai', () => ({ useAtomValue: jest.fn() }));
jest.mock('@/stores/ui', () => ({ resyncAtom: 'resyncAtom' }));

describe('useAlertAnimations', () => {
  it('gives the bell a press scale and a change-bounce, each drawn at full size at mount', () => {
    const { AnimScale, AnimSwap } = mountHook(() => useAlertAnimations(), undefined).result;

    expect(AnimScale.style).toEqual({ transform: [{ scale: 1 }] });
    expect(AnimSwap.style).toEqual({ transform: [{ scaleX: 1 }, { scaleY: 1 }] });
  });
});
