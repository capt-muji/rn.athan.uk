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
import { ANIMATION, COLORS, COUNTDOWN_BAR, COUNTDOWN_TIP } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarColorAtom } from '@/stores/ui';

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
  const isWarning = !isPreviewMode && progress <= COUNTDOWN_BAR.WARNING_THRESHOLD;

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
        withTiming(1, { duration: COUNTDOWN_TIP.PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: COUNTDOWN_TIP.PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [reducedMotion]);

  // Progress width and warning color animation
  useEffect(() => {
    if (isFirstRender.current) {
      widthValue.value = progress;
      colorValue.value = progress > COUNTDOWN_BAR.WARNING_THRESHOLD ? 0 : 1;
      isFirstRender.current = false;
    } else {
      const progressDiff = Math.abs(progress - prevProgress.current);

      if (reducedMotion) {
        widthValue.value = progress;
        colorValue.value = progress > COUNTDOWN_BAR.WARNING_THRESHOLD ? 0 : 1;
      } else {
        // Use fast timing for large jumps (e.g., prayer transition)
        const timingConfig = progressDiff > 50 ? TIMING_CONFIG_FAST : TIMING_CONFIG_LINEAR;
        widthValue.value = withTiming(progress, timingConfig);
        colorValue.value = withTiming(progress > COUNTDOWN_BAR.WARNING_THRESHOLD ? 0 : 1, {
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
    left: (widthValue.value / 100) * COUNTDOWN_BAR.WIDTH - COUNTDOWN_TIP.OFFSET,
  }));

  const tipAppearanceStyle = useAnimatedStyle(() => {
    const baseColor = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);
    const tintColor = interpolateColor(COUNTDOWN_TIP.TINT_AMOUNT, [0, 1], [baseColor, '#000000']);
    return {
      backgroundColor: tintColor,
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
        {/* Progress bar */}
        <Animated.View style={[styles.bar, barWidthStyle, barColorStyle]}>
          <Animated.View style={styles.barHighlight} />
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
    shadowColor: '#1b0f75',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'visible',
  },
  track: {
    height: COUNTDOWN_BAR.HEIGHT,
    width: COUNTDOWN_BAR.WIDTH,
    borderRadius: COUNTDOWN_BAR.HEIGHT / 2,
    backgroundColor: COUNTDOWN_BAR.TRACK_COLOR,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    height: '100%',
    borderRadius: COUNTDOWN_BAR.HEIGHT / 2,
    overflow: 'hidden',
  },
  barHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COUNTDOWN_BAR.GLOSS_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipContainer: {
    position: 'absolute',
    height: COUNTDOWN_BAR.HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipOval: {
    position: 'absolute',
    width: COUNTDOWN_TIP.WIDTH + 1,
    height: COUNTDOWN_BAR.HEIGHT,
    borderRadius: COUNTDOWN_TIP.WIDTH / 2,
  },
});
