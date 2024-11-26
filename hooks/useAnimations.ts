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
} from 'react-native-reanimated';
import { COLORS, ANIMATION } from '@/shared/constants';

interface AnimationOptions {
  duration?: number;
  delay?: number;
  onFinish?: () => void;
}

const DEFAULT_TIMING: WithTimingConfig = {
  duration: ANIMATION.durationSlow
};

const DEFAULT_SPRING: WithSpringConfig = {
  damping: 12,
  stiffness: 500,
  mass: 0.5
};

export const useAnimationColor = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      value.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    const timing = {
      ...DEFAULT_TIMING,
      duration: options?.duration ?? DEFAULT_TIMING.duration,
    };
    
    const animation = withTiming(toValue, timing, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
    
    value.value = options?.delay 
      ? withDelay(options.delay, animation)
      : animation;
  };

  return { value, style, animate };
};

export const useAnimationBackgroundColor = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      value.value,
      [0, 1],
      ['transparent', COLORS.activeBackground]
    )
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    const timing = {
      ...DEFAULT_TIMING,
      duration: options?.duration ?? DEFAULT_TIMING.duration,
    };
    
    value.value = withTiming(toValue, timing, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
  };

  return { value, style, animate };
};

export const useAnimationTranslateY = (initialValue: number) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: value.value }]
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    const timing = {
      ...DEFAULT_TIMING,
      duration: options?.duration ?? DEFAULT_TIMING.duration,
      easing: Easing.elastic(0.5)
    };

    value.value = withTiming(toValue, timing, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
  };

  return { value, style, animate };
};

export const useAnimationScale = (initialValue: number = 1) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: value.value }]
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    value.value = withSpring(toValue, DEFAULT_SPRING, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
  };

  return { value, style, animate };
};

export const useAnimationFade = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    opacity: value.value
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    const timing = {
      ...DEFAULT_TIMING,
      duration: options?.duration ?? DEFAULT_TIMING.duration
    };
    
    value.value = withTiming(toValue, timing, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
  };

  return { value, style, animate };
};

export const useAnimationBounce = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(value.value, [0, 1], [0.95, 1]) }]
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    value.value = withSpring(toValue, DEFAULT_SPRING, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
  };

  return { value, style, animate };
};

export const useAnimationFill = (initialValue: number = 0) => {
  const value = useSharedValue(initialValue);

  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      value.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }));

  const animate = (toValue: number, options?: AnimationOptions) => {
    'worklet';
    const timing = {
      ...DEFAULT_TIMING,
      duration: options?.duration ?? DEFAULT_TIMING.duration
    };
    
    const animation = withTiming(toValue, timing, (finished) => {
      if (finished && options?.onFinish) runOnJS(options.onFinish)();
    });
    
    value.value = options?.delay 
      ? withDelay(options.delay, animation)
      : animation;
  };

  return { value, animatedProps, animate };
};
