/**
 * Reanimated for hook tests, on top of hookHarness
 *
 * Worklets run as plain functions here, so nothing about frames or smoothness can be shown. What can be shown is what
 * a hook asks Reanimated for: each animation builder returns a plain description of its call, a shared value keeps its
 * value across renders, and a derived value, animated style or animated props is worked out again on every render. A
 * shared value handed an animation holds that description, not a frame's number. Reanimated's own jest mock cannot show
 * this: its shared values are new on every render and its builders return the bare target.
 *
 * A test wires it in with `jest.mock('react-native-reanimated', () => require('./reanimatedFake').reanimated)`.
 */

import { useSlot } from './hookHarness';

type Callback = (finished?: boolean) => void;

export type Animation =
  | { kind: 'timing'; toValue: number; config: unknown; callback?: Callback }
  | { kind: 'spring'; toValue: number; config: unknown; callback?: Callback }
  | { kind: 'delay'; delayMs: number; animation: Animation }
  | { kind: 'sequence'; animations: Animation[] };

/** Every call a worklet sent back to the JS thread, in order */
export const jsThreadCalls: { fn: unknown; args: unknown[] }[] = [];

export const reanimated = {
  Easing: {
    bezier: (x1: number, y1: number, x2: number, y2: number) => ({ bezier: [x1, y1, x2, y2] }),
  },
  interpolateColor: (value: unknown, inputRange: number[], outputRange: string[]) => ({
    value,
    inputRange,
    outputRange,
  }),
  runOnJS:
    (fn: (...args: never[]) => unknown) =>
    (...args: unknown[]) => {
      jsThreadCalls.push({ fn, args });
      return (fn as (...forwarded: unknown[]) => unknown)(...args);
    },
  useSharedValue: <T>(initial: T) => useSlot(() => ({ value: initial })),
  useDerivedValue: <T>(updater: () => T) => {
    const derived = useSlot(() => ({ value: undefined as T | undefined }));
    derived.value = updater();
    return derived;
  },
  useAnimatedStyle: <T>(updater: () => T) => updater(),
  useAnimatedProps: <T>(updater: () => T) => updater(),
  withDelay: (delayMs: number, animation: Animation): Animation => ({ kind: 'delay', delayMs, animation }),
  withSequence: (...animations: Animation[]): Animation => ({ kind: 'sequence', animations }),
  withSpring: (toValue: number, config?: unknown, callback?: Callback): Animation => ({
    kind: 'spring',
    toValue,
    config,
    callback,
  }),
  withTiming: (toValue: number, config?: unknown, callback?: Callback): Animation => ({
    kind: 'timing',
    toValue,
    config,
    callback,
  }),
};
