import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

import { useCountdownBar } from '@/hooks/useCountdownBar';
import { ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarShownAtom, countdownBarColorAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function CountdownBar({ type }: Props) {
  // NEW: Use sequence-based countdown calculation
  // See: ai/adr/005-timing-system-overhaul.md
  const { progress: elapsedProgress, isReady } = useCountdownBar(type);

  const overlay = useAtomValue(overlayAtom);
  const isCountdownBarShown = useAtomValue(countdownBarShownAtom);
  const countdownBarColor = useAtomValue(countdownBarColorAtom);

  // Convert elapsed % to remaining % (bar shrinks as time passes)
  // Old: (timeLeft / totalDuration) * 100 = remaining %
  // New: (elapsed / total) * 100 = elapsed %, so remaining = 100 - elapsed
  const progress = isReady ? 100 - elapsedProgress : 0;

  const widthValue = useSharedValue(progress ?? 0);
  const colorValue = useSharedValue(0); // Discrete color state: 0=blue, 1=red
  const warningValue = useSharedValue(0);
  const opacityValue = useSharedValue(!overlay.isOn && isCountdownBarShown ? 1 : 0);
  const isFirstRender = useRef(true);
  const isFirstOpacityRender = useRef(true);
  const prevProgress = useRef(progress);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorValue.value,
      [0, 1],
      [
        countdownBarColor, // User's color for normal state
        '#ff0080', // red for warning state
      ]
    );
    return {
      backgroundColor: color,
      shadowColor: color,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    // Platform-specific glow settings
    const isAndroid = Platform.OS === 'android';

    if (isAndroid) {
      // Android: use elevation for shadow spread
      const baseElevation = 15;
      const warningElevation = 10;
      const elevation = baseElevation - warningValue.value * (baseElevation - warningElevation);

      return {
        elevation,
        shadowOpacity: 0.9,
      };
    } else {
      // iOS: use shadowRadius for spread
      const shadowOpacity = 0.9 + warningValue.value * 0.1;
      const shadowRadius = 15 - warningValue.value * 7;

      return {
        shadowOpacity,
        shadowRadius,
      };
    }
  });

  // Extra intense glow layer for warning state only
  const warningGlowStyle = useAnimatedStyle(() => {
    const isAndroid = Platform.OS === 'android';

    if (isAndroid) {
      return {
        elevation: warningValue.value * 10,
        shadowOpacity: warningValue.value * 0.7,
      };
    } else {
      return {
        shadowOpacity: warningValue.value,
        shadowRadius: 6,
      };
    }
  });

  useEffect(() => {
    if (progress !== null) {
      if (isFirstRender.current) {
        widthValue.value = progress;
        colorValue.value = progress > 10 ? 0 : 1;
        warningValue.value = progress <= 10 ? 1 : 0;
        isFirstRender.current = false;
      } else {
        const progressDiff = Math.abs((progress ?? 0) - (prevProgress.current ?? 0));
        const timingConfig = {
          duration: progressDiff > 50 ? 950 : 1000,
          easing: progressDiff > 50 ? Easing.bezier(0.33, 0, 0.1, 1) : Easing.linear,
        };
        widthValue.value = withTiming(progress, timingConfig);

        // Animate color state with 500ms transition (discrete: 0=blue, 1=red)
        colorValue.value = withTiming(progress > 10 ? 0 : 1, {
          duration: 500,
          easing: Easing.linear,
        });

        // Animate warning state with 500ms transition
        warningValue.value = withTiming(progress <= 10 ? 1 : 0, { duration: 500, easing: Easing.linear });
      }
      prevProgress.current = progress;
    }
  }, [progress]);

  // Animate opacity: hidden when overlay is on OR when user toggles "Show countdown bar" off
  useEffect(() => {
    const shouldShow = !overlay.isOn && isCountdownBarShown;

    if (isFirstOpacityRender.current) {
      // On first render, set opacity directly without animation
      opacityValue.value = shouldShow ? 1 : 0;
      isFirstOpacityRender.current = false;
    } else {
      // On subsequent renders, animate the change
      opacityValue.value = withTiming(shouldShow ? 1 : 0, { duration: ANIMATION.duration, easing: Easing.linear });
    }
  }, [overlay.isOn, isCountdownBarShown]);

  // Always render container to reserve 3px height, use opacity to hide/show
  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      {/* Base glow effect */}
      <Animated.View style={[styles.glow, animatedStyle, colorStyle, glowStyle]} />
      {/* Extra intense neon glow for warning state */}
      <Animated.View style={[styles.glow, animatedStyle, colorStyle, warningGlowStyle]} />
      {/* Main countdown bar */}
      <Animated.View style={[styles.elapsed, animatedStyle, colorStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 3,
    width: 100,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#7ebdf131',
  },
  elapsed: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  glow: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
});
