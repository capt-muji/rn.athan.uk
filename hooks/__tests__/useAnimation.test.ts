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
  withTiming: jest.fn(),
  withSpring: jest.fn(),
  withDelay: jest.fn(),
  useAnimatedStyle: jest.fn(() => ({})),
  useAnimatedProps: jest.fn(() => ({})),
  interpolateColor: jest.fn(),
  interpolate: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
  cancelAnimation: jest.fn(),
  Easing: { elastic: jest.fn() },
}));

jest.mock('@/shared/constants', () => ({
  ANIMATION: { durationSlow: 300 },
}));

jest.mock('react', () => ({
  useCallback: (fn: unknown) => fn,
}));

describe('useAnimation exports', () => {
  it('exports all 7 animation hooks', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const hooks = require('../useAnimation');

    expect(typeof hooks.useAnimationColor).toBe('function');
    expect(typeof hooks.useAnimationOpacity).toBe('function');
    expect(typeof hooks.useAnimationScale).toBe('function');
    expect(typeof hooks.useAnimationBounce).toBe('function');
    expect(typeof hooks.useAnimationTranslateY).toBe('function');
    expect(typeof hooks.useAnimationFill).toBe('function');
    expect(typeof hooks.useAnimationBackgroundColor).toBe('function');
  });
});
