import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import {
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ANIMATION } from '@/shared/constants';
import { resyncAtom } from '@/stores/ui';

interface AnimationOptions {
  duration?: number;
  delay?: number;
  onFinish?: () => void;
}

interface ColorAnimationInput {
  fromColor: string;
  toColor: string;
}

const DEFAULT_TIMING: WithTimingConfig = {
  duration: ANIMATION.durationSlow,
};

const DEFAULT_SPRING: WithSpringConfig = {
  damping: 12,
  stiffness: 500,
  mass: 0.5,
};

/**
 * Helper to create a timing-based animation with consistent options handling
 * Reduces duplication across timing-based animation hooks
 */
function createTimingAnimation(toValue: number, options?: AnimationOptions, customConfig?: Partial<WithTimingConfig>) {
  'worklet';
  const timing: WithTimingConfig = {
    ...DEFAULT_TIMING,
    ...customConfig,
    duration: options?.duration ?? customConfig?.duration ?? DEFAULT_TIMING.duration,
  };

  const animation = withTiming(toValue, timing, (finished) => {
    if (finished && options?.onFinish) runOnJS(options.onFinish)();
  });

  return options?.delay ? withDelay(options.delay, animation) : animation;
}

/**
 * Helper to create a spring-based animation with consistent options handling
 * Reduces duplication across spring-based animation hooks
 */
function createSpringAnimation(toValue: number, options?: AnimationOptions) {
  'worklet';
  const animation = withSpring(toValue, DEFAULT_SPRING, (finished) => {
    if (finished && options?.onFinish) runOnJS(options.onFinish)();
  });

  return options?.delay ? withDelay(options.delay, animation) : animation;
}

/**
 * Hook for animating opacity
 *
 * @param initialValue Initial opacity value (0-1)
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationOpacity(0);
 * animate(1); // Fade in
 */
export const useAnimationOpacity = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    opacity: value.value,
  }));

  const animate = useCallback(
    (toValue: number, options?: AnimationOptions) => {
      value.value = createTimingAnimation(toValue, options);
    },
    [value]
  );

  return { value, style, animate };
};

/**
 * Hook for animating scale with spring physics
 *
 * @param initialValue Initial scale value (default: 1)
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationScale(1);
 * animate(0.9); // Scale down
 */
export const useAnimationScale = (initialValue: number = 1) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: value.value }],
  }));

  const animate = useCallback(
    (toValue: number, options?: AnimationOptions) => {
      value.value = createSpringAnimation(toValue, options);
    },
    [value]
  );

  return { value, style, animate };
};

// =============================================================================
// DERIVED TRANSITIONS (overlay path)
// =============================================================================

interface DerivedTimingOptions {
  duration?: number;
  delay?: number;
  easing?: WithTimingConfig['easing'];
  /** Use Reanimated's default timing, matching a bare `withTiming` call */
  defaultTiming?: boolean;
}

/**
 * Derived from state, not effects: the mapper re-runs on target or resume
 * change and converges, so a suspend-dropped write cannot strand. First
 * evaluation and resume snap so the settled frame is exact.
 */
export const useDerivedProgress = (target: number, options?: DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const duration = options?.duration ?? ANIMATION.duration;
  const delay = options?.delay ?? 0;
  const easing = options?.easing;
  const useDefaultTiming = options?.defaultTiming ?? false;

  const isFirstEvaluation = useSharedValue(true);
  const lastResync = useSharedValue(resync);

  return useDerivedValue(() => {
    if (isFirstEvaluation.value || lastResync.value !== resync) {
      isFirstEvaluation.value = false;
      lastResync.value = resync;
      return target;
    }

    // Omit an undefined easing: an explicit `easing: undefined` overrides
    // Reanimated's default and makes withTiming call undefined(t)
    const config = useDefaultTiming ? undefined : easing !== undefined ? { duration, easing } : { duration };
    const animation = withTiming(target, config);
    return delay > 0 ? withDelay(delay, animation) : animation;
  });
};

// The consumer mappers carry the resume counter as a dependency: on foreground
// the mapper restarts and re-applies its current value. A re-render alone does
// not re-apply an animated prop, and a snap to an unchanged value is a no-op,
// so without this a native prop (SVG fill) that went stale across a suspend is
// never re-asserted.
export const useDerivedOpacity = (target: number, options?: DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const progress = useDerivedProgress(target, options);
  return useAnimatedStyle(() => ({ opacity: progress.value }), [resync]);
};

export const useDerivedColor = (target: number, input: ColorAnimationInput & DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const { fromColor, toColor, duration, delay, easing, defaultTiming } = input;
  const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });
  return useAnimatedStyle(
    () => ({
      color: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),
    }),
    [resync]
  );
};

export const useDerivedBackgroundColor = (target: number, input: ColorAnimationInput & DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const { fromColor, toColor, duration, delay, easing, defaultTiming } = input;
  const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });
  return useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),
    }),
    [resync]
  );
};

export const useDerivedTranslateY = (target: number, options?: DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const progress = useDerivedProgress(target, options);
  return useAnimatedStyle(() => ({ transform: [{ translateY: progress.value }] }), [resync]);
};

export const useDerivedFill = (target: number, input: ColorAnimationInput & DerivedTimingOptions) => {
  const resync = useAtomValue(resyncAtom);
  const { fromColor, toColor, duration, delay, easing, defaultTiming } = input;
  const progress = useDerivedProgress(target, { duration, delay, easing, defaultTiming });
  return useAnimatedProps(
    () => ({
      fill: interpolateColor(progress.value, [0, 1], [fromColor, toColor]),
    }),
    [resync]
  );
};
