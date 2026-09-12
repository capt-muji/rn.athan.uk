import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TIP_OVAL_WIDTH, tipLeftForProgress } from '@/components/countdown/tipGeometry';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { useCountdownBar } from '@/hooks/useCountdownBar';
import { ANIMATION, COLORS, COUNTDOWN_BAR, COUNTDOWN_TIP } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { countdownBarColorAtom, resyncAtom } from '@/stores/ui';

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

/** Smallest per-tick width change (dp) worth animating; real prayer intervals never reach it */
const VISIBLE_STEP_DP = 0.3;

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

  const {
    progress: elapsedProgress,
    isReady,
    isWarning: countdownWarning,
  } = useCountdownBar(type ?? ScheduleType.Standard);
  const reducedMotion = useReducedMotion();

  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  const atomColor = useAtomValue(countdownBarColorAtom);
  const resync = useAtomValue(resyncAtom);

  const countdownBarColor = previewColor ?? atomColor;
  const progress = previewProgress ?? (isReady ? 100 - elapsedProgress : 0);
  const isWarning = !isPreviewMode && countdownWarning;

  const widthValue = useSharedValue(progress);
  const colorValue = useSharedValue(0);

  const isFirstRender = useRef(true);
  const prevProgress = useRef(progress);
  const prevWarning = useRef(isWarning);
  const lastResync = useRef(resync);

  // Progress width and warning color animation
  useEffect(() => {
    const isResume = lastResync.current !== resync;
    lastResync.current = resync;

    if (isFirstRender.current) {
      widthValue.value = progress;
      colorValue.value = isWarning ? 1 : 0;
      isFirstRender.current = false;
    } else if (isResume || reducedMotion) {
      // Resume snaps: the bar must be correct instantly, never animate a
      // catch-up from the width it held before the host was suspended
      widthValue.value = progress;
      colorValue.value = isWarning ? 1 : 0;
    } else {
      const progressDiff = Math.abs(progress - prevProgress.current);

      if (progressDiff > 50) {
        // Large jumps (prayer transition refill) are visible — animate them
        widthValue.value = withTiming(progress, TIMING_CONFIG_FAST);
      } else if ((progressDiff / 100) * COUNTDOWN_BAR.WIDTH >= VISIBLE_STEP_DP) {
        // A visible per-second step (short intervals) keeps its smooth glide
        widthValue.value = withTiming(progress, TIMING_CONFIG_LINEAR);
      } else {
        // Sub-pixel step: still written every tick (a dropped write heals within a
        // second) but set directly, so an idle bar drives no per-frame layout
        widthValue.value = progress;
      }

      if (isWarning !== prevWarning.current) {
        colorValue.value = withTiming(isWarning ? 1 : 0, {
          duration: ANIMATION.durationMedium,
          easing: Easing.linear,
        });
      } else {
        // Re-asserted every tick like the width, without re-running an animation
        colorValue.value = isWarning ? 1 : 0;
      }
    }
    prevProgress.current = progress;
    prevWarning.current = isWarning;
  }, [progress, isWarning, reducedMotion, widthValue, colorValue, resync]);

  // Overlay visibility is derived; reduced motion snaps it
  const wrapperOpacityStyle = useDerivedOpacity(isPreviewMode || !overlayIsOn ? 1 : 0, {
    duration: reducedMotion ? 0 : ANIMATION.duration,
    easing: Easing.linear,
  });

  const barWidthStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const barColorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]),
  }));

  // Clamped so the oval cannot overhang the track at either end (tipGeometry)
  const tipPositionStyle = useAnimatedStyle(() => ({
    left: tipLeftForProgress(widthValue.value),
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
      accessibilityRole='progressbar'
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
      <Animated.View style={[styles.tipContainer, tipPositionStyle]} pointerEvents='none'>
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
    width: TIP_OVAL_WIDTH,
    height: COUNTDOWN_BAR.HEIGHT,
    borderRadius: COUNTDOWN_TIP.WIDTH / 2,
  },
});
