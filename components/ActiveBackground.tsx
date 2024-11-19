import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYERS_ENGLISH, OVERLAY, PRAYER } from '@/shared/constants';
import { getRecentDate } from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';
import useSchedule from '@/hooks/useSchedule';
import { useApp } from '@/hooks/useApp';

const TIMING_CONFIG = { duration: ANIMATION.overlayDelay };
const SPRING_CONFIG = { damping: 15, stiffness: 90, mass: 0.8 };

interface Props {
  type: ScheduleType;
}

export default function ActiveBackground({ type }: Props) {
  const { date } = useApp();
  const { today, nextIndex, measurements } = useSchedule(type);

  const opacityShared = useSharedValue(0);
  const backgroundColorShared = useSharedValue(COLORS.activeBackground);

  useEffect(() => {
    if (!measurements[nextIndex]) return;

    const nowDate = getRecentDate(DaySelection.Today);
    const lastPrayerIndex = PRAYERS_ENGLISH.length - 1;
    const isActive = date.current === nowDate && !today()[lastPrayerIndex]?.passed;
    const isActiveOpacity = isActive ? 1 : 0.1;
    const isActiveBackgroundColor = isActive ? COLORS.activeBackground : COLORS.inactiveBackground;

    opacityShared.value = withTiming(isActiveOpacity, TIMING_CONFIG);
    backgroundColorShared.value = withTiming(isActiveBackgroundColor, TIMING_CONFIG);
  }, [measurements, nextIndex, date, today]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!measurements[nextIndex]) return { opacity: opacityShared.value };

    const activePrayer = measurements[nextIndex];

    return {
      opacity: opacityShared.value,
      backgroundColor: backgroundColorShared.value,
      position: 'absolute',
      top: withSpring(activePrayer.pageY, SPRING_CONFIG),
      left: activePrayer.pageX,
      width: activePrayer.width,
      height: activePrayer.height,
      zIndex: OVERLAY.zindexes.off.activeBackground,
    };
  });

  return <Animated.View style={[styles.background, animatedStyle]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    borderRadius: PRAYER.borderRadius,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  }
});
