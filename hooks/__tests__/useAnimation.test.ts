/**
 * Unit tests for hooks/useAnimation.ts
 *
 * WORKLET TESTING LIMITATIONS:
 * React Native Reanimated worklets cannot be tested in Node/Jest because:
 * - Worklets run on the UI thread in a separate JSI-based runtime
 * - The 'worklet' directive triggers native compilation unavailable in Node
 * - useAnimatedStyle/useAnimatedProps execute on UI thread only
 *
 * These tests verify exports exist. Animation behavior should be tested
 * via E2E tests (Detox/Maestro) that can interact with the native runtime.
 *
 * @see https://docs.swmansion.com/react-native-reanimated/docs/guides/testing
 */

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((initial: number) => ({ value: initial })),
  useDerivedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  useAnimatedProps: jest.fn(() => ({})),
  interpolateColor: jest.fn(),
  withTiming: jest.fn(),
  withSpring: jest.fn(),
  withDelay: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
}));

jest.mock('@/stores/ui', () => ({
  resyncAtom: {},
}));

jest.mock('@/shared/constants', () => ({
  ANIMATION: { duration: 200, durationSlow: 300 },
}));

describe('useAnimation exports', () => {
  it('exports the imperative and derived animation hooks', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hooks = require('../useAnimation');

    expect(typeof hooks.useAnimationOpacity).toBe('function');
    expect(typeof hooks.useAnimationScale).toBe('function');
    expect(typeof hooks.useDerivedProgress).toBe('function');
    expect(typeof hooks.useDerivedOpacity).toBe('function');
    expect(typeof hooks.useDerivedColor).toBe('function');
    expect(typeof hooks.useDerivedBackgroundColor).toBe('function');
    expect(typeof hooks.useDerivedTranslateY).toBe('function');
    expect(typeof hooks.useDerivedFill).toBe('function');
  });
});
