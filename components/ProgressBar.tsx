import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

import { useSchedule } from '@/hooks/useSchedule';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { standardTimerAtom, extraTimerAtom, overlayTimerAtom } from '@/stores/timer';

interface Props {
  type: ScheduleType;
}

export default function ProgressBar({ type }: Props) {
  const { schedule } = useSchedule(type);
  const overlay = useAtomValue(overlayAtom);

  // Get timer from store based on type
  const isStandard = type === ScheduleType.Standard;
  const timerAtom = overlay.isOn ? overlayTimerAtom : isStandard ? standardTimerAtom : extraTimerAtom;
  const timer = useAtomValue(timerAtom);

  const progress = useMemo(() => {
    const nextPrayer = schedule.today[schedule.nextIndex];
    let prevPrayer;

    // Special case: First prayer (Fajr) - use yesterday's last prayer (Isha)
    // Yesterday's data is always available - ensured by sync layer (Jan 1 fetch)
    if (schedule.nextIndex === 0) {
      const yesterdaySchedule = schedule.yesterday;
      const lastIndex = Object.keys(yesterdaySchedule).length - 1;
      prevPrayer = yesterdaySchedule[lastIndex];
    } else {
      prevPrayer = schedule.today[schedule.nextIndex - 1];
    }

    const prevPrayerTimeInSeconds = TimeUtils.parseTimeToSeconds(prevPrayer.time);
    const nextPrayerTimeInSeconds = TimeUtils.parseTimeToSeconds(nextPrayer.time);

    const timeDiffInSeconds = nextPrayerTimeInSeconds - prevPrayerTimeInSeconds;
    const totalDuration = timeDiffInSeconds >= 0 ? timeDiffInSeconds : 86400 + timeDiffInSeconds;

    return Math.max(0, Math.min(100, (timer.timeLeft / totalDuration) * 100));
  }, [schedule, timer.timeLeft, type]);

  const widthValue = useSharedValue(progress ?? 0);
  const colorValue = useSharedValue(progress ?? 0);
  const warningValue = useSharedValue(0);
  const opacityValue = useSharedValue(overlay.isOn ? 0 : 1);
  const isFirstRender = useRef(true);
  const prevProgress = useRef(progress);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      warningValue.value,
      [0, 1],
      ['#d3ff8b', '#d63384'] // green to dark red-pink
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
        colorValue.value = progress;
        warningValue.value = progress <= 10 ? 1 : 0;
        isFirstRender.current = false;
      } else {
        const progressDiff = Math.abs((progress ?? 0) - (prevProgress.current ?? 0));
        const timingConfig = {
          duration: progressDiff > 50 ? 950 : 1000,
          easing: progressDiff > 50 ? Easing.bezier(0.33, 0, 0.1, 1) : Easing.linear,
        };
        widthValue.value = withTiming(progress, timingConfig);
        colorValue.value = withTiming(progress, timingConfig);

        // Animate warning state with 500ms transition
        warningValue.value = withTiming(progress <= 10 ? 1 : 0, { duration: 500, easing: Easing.linear });
      }
      prevProgress.current = progress;
    }
  }, [progress]);

  // Set opacity instantly to 0 when overlay is on, otherwise 1
  useEffect(() => {
    opacityValue.value = overlay.isOn ? 0 : 1;
  }, [overlay.isOn]);

  // Always render container to reserve 3px height, use opacity to hide/show
  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      {/* Base glow effect */}
      <Animated.View style={[styles.glow, animatedStyle, colorStyle, glowStyle]} />
      {/* Extra intense neon glow for warning state */}
      <Animated.View style={[styles.glow, animatedStyle, colorStyle, warningGlowStyle]} />
      {/* Main progress bar */}
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
    backgroundColor: '#dff9ff25',
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
