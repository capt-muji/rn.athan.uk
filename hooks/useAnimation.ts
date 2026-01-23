import { useCallback } from 'react';
import {
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  useAnimatedStyle,
  interpolateColor,
  runOnJS,
  interpolate,
  useAnimatedProps,
  WithTimingConfig,
  WithSpringConfig,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { ANIMATION } from '@/shared/constants';

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
 * Hook for animating text color between two colors
 *
 * @param initialValue Initial animation position (0 or 1)
 * @param input Color interpolation input with fromColor and toColor
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationColor(0, { fromColor: '#888', toColor: '#fff' });
 * animate(1); // Transition to toColor
 */
export const useAnimationColor = (initialValue: number = 0, input: ColorAnimationInput) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    color: interpolateColor(value.value, [0, 1], [input.fromColor, input.toColor]),
  }));

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createTimingAnimation(toValue, options);
  }, []);

  return { value, style, animate };
};

/**
 * Hook for animating SVG fill color between two colors
 *
 * @param initialValue Initial animation position (0 or 1)
 * @param input Color interpolation input with fromColor and toColor
 * @returns Animation value, animated props for SVG, and animate function
 *
 * @example
 * const { animatedProps, animate } = useAnimationFill(0, { fromColor: '#888', toColor: '#fff' });
 * <AnimatedPath animatedProps={animatedProps} />
 */
export const useAnimationFill = (initialValue: number = 0, input: ColorAnimationInput) => {
  const value = useSharedValue(initialValue);

  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(value.value, [0, 1], [input.fromColor, input.toColor]),
  }));

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createTimingAnimation(toValue, options);
  }, []);

  return { value, animatedProps, animate };
};

/**
 * Hook for animating background color between two colors
 *
 * @param initialValue Initial animation position (0 or 1)
 * @param input Color interpolation input with fromColor and toColor
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationBackgroundColor(0, { fromColor: '#000', toColor: '#fff' });
 */
export const useAnimationBackgroundColor = (initialValue: number = 0, input: ColorAnimationInput) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(value.value, [0, 1], [input.fromColor, input.toColor]),
  }));

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createTimingAnimation(toValue, options);
  }, []);

  return { value, style, animate };
};

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

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createTimingAnimation(toValue, options);
  }, []);

  return { value, style, animate };
};

/**
 * Hook for animating vertical translation with elastic easing
 *
 * @param initialValue Initial Y translation value
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationTranslateY(100);
 * animate(0); // Slide up from 100px
 */
export const useAnimationTranslateY = (initialValue: number) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: value.value }],
  }));

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createTimingAnimation(toValue, options, { easing: Easing.elastic(0.5) });
  }, []);

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

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createSpringAnimation(toValue, options);
  }, []);

  return { value, style, animate };
};

/**
 * Hook for animating a subtle bounce effect (scale 0.95 to 1)
 *
 * @param initialValue Initial animation position (0 = compressed, 1 = normal)
 * @returns Animation value, animated style, and animate function
 *
 * @example
 * const { style, animate } = useAnimationBounce(0);
 * animate(1); // Bounce to normal size
 */
export const useAnimationBounce = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(value.value, [0, 1], [0.95, 1]) }],
  }));

  const animate = useCallback((toValue: number, options?: AnimationOptions) => {
    value.value = createSpringAnimation(toValue, options);
  }, []);

  /**
   * Reset the animation value immediately (non-animated)
   * Cancels any running animation before setting the value
   */
  const reset = useCallback((toValue: number) => {
    cancelAnimation(value);
    value.value = toValue;
  }, []);

  return { value, style, animate, reset };
};
