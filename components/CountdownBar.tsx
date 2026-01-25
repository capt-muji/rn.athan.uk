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
const BAR_HEIGHT = 2.5;
const GLOSS_HEIGHT = 0.75;
const WARNING_THRESHOLD = 10;

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

  const barColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);
    return {
      backgroundColor: color,
    };
  });

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
        <Animated.View style={styles.trackHighlight} />
        <Animated.View style={styles.trackShadow} />
        <Animated.View style={[styles.bar, animatedStyle, barColorStyle]}>
          <Animated.View style={styles.barHighlight} />
          <Animated.View style={styles.barShadow} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    shadowColor: '#03103a',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  track: {
    height: BAR_HEIGHT,
    width: BAR_WIDTH,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: '#1a3a6e',
    overflow: 'hidden',
  },
  trackHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  bar: {
    position: 'absolute',
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  barHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  barShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
