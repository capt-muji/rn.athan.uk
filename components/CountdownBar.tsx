import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useCountdownBar } from '@/hooks/useCountdownBar';
import { ANIMATION, COLORS } from '@/shared/constants';
import type { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarColorAtom } from '@/stores/ui';

/** Bar dimensions (percentage-based width for responsiveness) */
const BAR_WIDTH = 100;
const BAR_HEIGHT = 2.5;
const GLOSS_HEIGHT = 0.75;
const TIP_WIDTH = 1.5;

/** Progress threshold for warning state (last 10%) */
const WARNING_THRESHOLD = 10;

/** Animation timing for large progress jumps (>50%) */
const TIMING_CONFIG_FAST = {
  duration: 950,
  easing: Easing.bezier(0.33, 0, 0.1, 1),
};

/** Animation timing for normal progress updates */
const TIMING_CONFIG_LINEAR = {
  duration: 1000,
  easing: Easing.linear,
};

/** Tip pulse animation duration (one direction) */
const TIP_PULSE_DURATION = 1200;

interface Props {
  type: ScheduleType;
}

/**
 * Animated countdown progress bar showing time remaining until next prayer.
 *
 * Features:
 * - Glossy 3D appearance with highlights and shadows
 * - Smooth width transitions as time elapses
 * - Color transition to warning state in final 10%
 * - Pulsing tip indicator for visual feedback
 * - Respects reduced motion preferences
 * - Hides when overlay is active
 */
export default function CountdownBar({ type }: Props) {
  const { progress: elapsedProgress, isReady } = useCountdownBar(type);
  const reducedMotion = useReducedMotion();

  const overlay = useAtomValue(overlayAtom);
  const countdownBarColor = useAtomValue(countdownBarColorAtom);

  // Convert elapsed percentage to remaining percentage
  const progress = isReady ? 100 - elapsedProgress : 0;
  const isWarning = progress <= WARNING_THRESHOLD;

  // Animation shared values
  const widthValue = useSharedValue(progress);
  const colorValue = useSharedValue(0);
  const opacityValue = useSharedValue(overlay.isOn ? 0 : 1);
  const tipPulse = useSharedValue(0);

  // Refs for tracking state changes
  const isFirstRender = useRef(true);
  const isFirstOpacityRender = useRef(true);
  const prevProgress = useRef(progress);

  // Start tip pulse animation
  useEffect(() => {
    if (reducedMotion) return;
    tipPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: TIP_PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: TIP_PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [reducedMotion]);

  // Update progress and color animations
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

  // Handle visibility based on overlay state
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

  // Animated styles
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const barWidthStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const barColorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]),
  }));

  const tipContainerStyle = useAnimatedStyle(() => ({
    left: (widthValue.value / 100) * BAR_WIDTH - 1,
  }));

  const tipOvalStyle = useAnimatedStyle(() => {
    const baseColor = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);
    const tintColor = interpolateColor(0.3, [0, 1], [baseColor, '#ffffff']);
    return {
      backgroundColor: tintColor,
      opacity: 0.5 + tipPulse.value * 0.5,
      transform: [{ scaleX: 0.8 + tipPulse.value * 0.2 }],
    };
  });

  return (
    <Animated.View
      style={[styles.wrapper, opacityStyle]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Prayer countdown: ${Math.round(progress)} percent remaining`}
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      accessibilityLiveRegion={isWarning ? 'assertive' : 'none'}>
      {/* Track (background) */}
      <Animated.View style={styles.track}>
        <Animated.View style={styles.trackHighlight} />
        <Animated.View style={styles.trackShadow} />

        {/* Progress bar */}
        <Animated.View style={[styles.bar, barWidthStyle, barColorStyle]}>
          <Animated.View style={styles.barHighlight} />
          <Animated.View style={styles.barShadow} />
        </Animated.View>
      </Animated.View>

      {/* Pulsing tip indicator */}
      <Animated.View style={[styles.tipContainer, tipContainerStyle]} pointerEvents="none">
        <Animated.View style={[styles.tipOval, tipOvalStyle]} />
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
    overflow: 'visible',
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
  tipContainer: {
    position: 'absolute',
    top: 0,
    height: BAR_HEIGHT,
    width: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  tipOval: {
    position: 'absolute',
    width: TIP_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: TIP_WIDTH / 2,
  },
});
