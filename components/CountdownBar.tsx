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
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarColorAtom } from '@/stores/ui';

/** Bar dimensions */
const BAR_WIDTH = 100;
const BAR_HEIGHT = 2.5;
const GLOSS_HEIGHT = 0.75;

/** Pulsing tip indicator */
const TIP_WIDTH = 2;
const TIP_OFFSET = 0.9;
const TIP_TINT_AMOUNT = 0.15; // 0 = bar color, 1 = white
const TIP_OPACITY_MIN = 0.85;
const TIP_OPACITY_MAX = 1.0;
const TIP_PULSE_DURATION = 2500;

/** Warning state triggers in final 10% */
const WARNING_THRESHOLD = 10;

const TRACK_COLOR = '#1a3a6e';

/** Fast timing for large progress jumps (>50%) */
const TIMING_CONFIG_FAST = {
  duration: 950,
  easing: Easing.bezier(0.33, 0, 0.1, 1),
};

/** Linear timing for normal 1-second updates */
const TIMING_CONFIG_LINEAR = {
  duration: 1000,
  easing: Easing.linear,
};

interface Props {
  /** Schedule type for countdown calculation (required in normal mode) */
  type?: ScheduleType;
  /** Override color for preview mode (bypasses color atom) */
  previewColor?: string;
  /** Fixed progress value for preview mode (0-100, bypasses countdown hook) */
  previewProgress?: number;
  /** Scale multiplier for the entire bar (default: 1) */
  scale?: number;
}

/**
 * Animated countdown progress bar showing time remaining until next prayer.
 *
 * Features:
 * - Glossy 3D appearance with highlight/shadow layers
 * - Smooth width transitions as time elapses
 * - Color transition to warning (orange) in final 10%
 * - Pulsing tip indicator at the leading edge
 * - Respects reduced motion preferences
 * - Hides when overlay is active
 *
 * Preview mode: Pass `previewColor` and/or `previewProgress` to render a static
 * preview that bypasses the countdown hook and color atom.
 */
export default function CountdownBar({ type, previewColor, previewProgress, scale = 1 }: Props) {
  const isPreviewMode = previewColor !== undefined || previewProgress !== undefined;

  const { progress: elapsedProgress, isReady } = useCountdownBar(type ?? ScheduleType.Standard);
  const reducedMotion = useReducedMotion();

  const overlay = useAtomValue(overlayAtom);
  const atomColor = useAtomValue(countdownBarColorAtom);

  const countdownBarColor = previewColor ?? atomColor;
  const progress = previewProgress ?? (isReady ? 100 - elapsedProgress : 0);
  const isWarning = !isPreviewMode && progress <= WARNING_THRESHOLD;

  const widthValue = useSharedValue(progress);
  const colorValue = useSharedValue(0);
  const opacityValue = useSharedValue(overlay.isOn ? 0 : 1);
  const tipPulse = useSharedValue(0);

  const isFirstRender = useRef(true);
  const isFirstOpacityRender = useRef(true);
  const prevProgress = useRef(progress);

  // Tip pulse animation (infinite loop)
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

  // Progress width and warning color animation
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
        // Use fast timing for large jumps (e.g., prayer transition)
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

  // Visibility based on overlay state (skip in preview mode)
  useEffect(() => {
    if (isPreviewMode) return;

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
  }, [overlay.isOn, reducedMotion, isPreviewMode]);

  const wrapperOpacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const barWidthStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const barColorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]),
  }));

  const tipPositionStyle = useAnimatedStyle(() => ({
    left: (widthValue.value / 100) * BAR_WIDTH - TIP_OFFSET,
  }));

  const tipAppearanceStyle = useAnimatedStyle(() => {
    const baseColor = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);
    const tintColor = interpolateColor(TIP_TINT_AMOUNT, [0, 1], [baseColor, '#ffffff']);
    return {
      backgroundColor: tintColor,
      opacity: TIP_OPACITY_MIN + tipPulse.value * (TIP_OPACITY_MAX - TIP_OPACITY_MIN),
    };
  });

  const scaleStyle = scale !== 1 ? { transform: [{ scale }] } : undefined;

  return (
    <Animated.View
      style={[styles.wrapper, wrapperOpacityStyle, scaleStyle]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Prayer countdown: ${Math.round(progress)} percent remaining`}
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      accessibilityLiveRegion={isWarning ? 'assertive' : 'none'}>
      {/* Track (background trough) */}
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
      <Animated.View style={[styles.tipContainer, tipPositionStyle]} pointerEvents="none">
        <Animated.View style={[styles.tipOval, tipAppearanceStyle]} />
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
    backgroundColor: TRACK_COLOR,
    overflow: 'hidden',
  },
  trackHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  trackShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GLOSS_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tipContainer: {
    position: 'absolute',
    top: 0,
    height: BAR_HEIGHT,
    width: 1,
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
