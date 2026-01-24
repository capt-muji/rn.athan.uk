import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  useReducedMotion,
} from 'react-native-reanimated';

import { useCountdownBar } from '@/hooks/useCountdownBar';
import { ANIMATION, COLORS } from '@/shared/constants';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarColorAtom } from '@/stores/ui';

const BAR_WIDTH = 100;
const BAR_HEIGHT = 2;
const WARNING_THRESHOLD = 10;

// Pre-defined timing configs
const TIMING_CONFIG_FAST = {
  duration: 950,
  easing: Easing.bezier(0.33, 0, 0.1, 1),
};
const TIMING_CONFIG_LINEAR = {
  duration: 1000,
  easing: Easing.linear,
};

interface Props {
  type: ScheduleType;
}

export default function CountdownBar({ type }: Props) {
  const { progress: elapsedProgress, isReady } = useCountdownBar(type);
  const reducedMotion = useReducedMotion();

  const overlay = useAtomValue(overlayAtom);
  const countdownBarColor = useAtomValue(countdownBarColorAtom);

  // Convert elapsed % to remaining %
  const progress = isReady ? 100 - elapsedProgress : 0;

  const widthValue = useSharedValue(progress);
  const colorValue = useSharedValue(0);
  const opacityValue = useSharedValue(overlay.isOn ? 0 : 1);
  const isFirstRender = useRef(true);
  const isFirstOpacityRender = useRef(true);
  const prevProgress = useRef(progress);

  const isWarning = progress <= WARNING_THRESHOLD;

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);
    return {
      backgroundColor: color,
      shadowColor: color,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4,
    shadowRadius: 7,
    elevation: 7,
  }));

  useEffect(() => {
    if (isFirstRender.current) {
      widthValue.value = progress;
      colorValue.value = progress > WARNING_THRESHOLD ? 0 : 1;
      isFirstRender.current = false;
    } else {
      const progressDiff = Math.abs(progress - prevProgress.current);

      if (reducedMotion) {
        widthValue.value = progress;
        colorValue.value = progress > WARNING_THRESHOLD ? 0 : 1;
      } else {
        const timingConfig = progressDiff > 50 ? TIMING_CONFIG_FAST : TIMING_CONFIG_LINEAR;
        widthValue.value = withTiming(progress, timingConfig);

        colorValue.value = withTiming(progress > WARNING_THRESHOLD ? 0 : 1, {
          duration: ANIMATION.durationMedium,
          easing: Easing.linear,
        });
      }
    }
    prevProgress.current = progress;
  }, [progress, reducedMotion]);

  useEffect(() => {
    const shouldShow = !overlay.isOn;

    if (isFirstOpacityRender.current) {
      opacityValue.value = shouldShow ? 1 : 0;
      isFirstOpacityRender.current = false;
    } else if (reducedMotion) {
      opacityValue.value = shouldShow ? 1 : 0;
    } else {
      opacityValue.value = withTiming(shouldShow ? 1 : 0, {
        duration: ANIMATION.duration,
        easing: Easing.linear,
      });
    }
  }, [overlay.isOn, reducedMotion]);

  return (
    <Animated.View
      style={[styles.wrapper, opacityStyle]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Prayer countdown: ${Math.round(progress)} percent remaining`}
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      accessibilityLiveRegion={isWarning ? 'assertive' : 'none'}>
      <Animated.View style={styles.track}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, animatedStyle, colorStyle, glowStyle]} />
        {/* Main countdown bar */}
        <Animated.View style={[styles.bar, animatedStyle, colorStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

const BORDER_WIDTH = 0.5;
const GAP = 0.25;
const OUTER_RADIUS = BAR_HEIGHT / 2 + GAP + BORDER_WIDTH;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: '#152866e7',
    borderRadius: OUTER_RADIUS,
    padding: GAP,
    // Shadow for floating effect
    shadowColor: '#03103a',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  track: {
    height: BAR_HEIGHT,
    width: BAR_WIDTH,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: '#112262e7',
  },
  bar: {
    position: 'absolute',
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
  glow: {
    position: 'absolute',
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
    shadowOffset: { width: 0, height: 0 },
  },
});
