import { 
  useSharedValue, 
  withTiming, 
  withSpring, 
  withDelay, 
  useAnimatedStyle, 
  interpolateColor,
  runOnJS
} from 'react-native-reanimated';
import { COLORS, ANIMATION } from '@/shared/constants';

const DEFAULT_TIMING = {
  duration: ANIMATION.durationSlow
};

const DEFAULT_SPRING = {
  damping: 12,
  stiffness: 500,
  mass: 0.5
};

export const useColorAnimation = (initialValue: number = 0) => {
  const progress = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }));

  const animate = (toValue: number, delay = 0) => {
    'worklet';
    if (delay > 0) {
      progress.value = withDelay(delay, withTiming(toValue, DEFAULT_TIMING));
    } else {
      progress.value = withTiming(toValue, DEFAULT_TIMING);
    }
  };

  return { progress, style, animate };
};

export const useBackgroundColorAnimation = (initialValue: number = 0) => {
  const progress = useSharedValue(initialValue);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', COLORS.activeBackground]
    )
  }));

  const animate = (toValue: number, onFinish?: () => void) => {
    'worklet';
    progress.value = withTiming(toValue, DEFAULT_TIMING, (finished) => {
      if (finished && onFinish) {
        runOnJS(onFinish)();
      }
    });
  };

  return { progress, style, animate };
};

export const useTranslateYAnimation = (initialValue: number) => {
  const translateY = useSharedValue(initialValue);

  const animate = (toValue: number) => {
    'worklet';
    translateY.value = withTiming(toValue, DEFAULT_TIMING);
  };

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value }]
    };
  });

  return { translateY, style, animate };
};

export const useScaleAnimation = (initialValue: number = 1) => {
  const scale = useSharedValue(initialValue);

  const animate = (toValue: number) => {
    'worklet';
    scale.value = withSpring(toValue, DEFAULT_SPRING);
  };

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }]
    };
  });

  return { scale, style, animate };
};

export const useFadeAnimation = (initialValue: number = 0) => {
  const opacity = useSharedValue(initialValue);

  const animate = (toValue: number) => {
    'worklet';
    opacity.value = withTiming(toValue, DEFAULT_TIMING);
  };

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value
    };
  });

  return { opacity, style, animate };
};
