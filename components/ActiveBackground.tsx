import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import {
  nextPrayerIndexAtom,
  absolutePrayerMeasurementsAtom,
  dateAtom,
  todaysPrayersAtom,
} from '@/store/store';
import { ANIMATION, COLORS, OVERLAY, PRAYER } from '@/constants';
import { getTodayOrTomorrowDate } from '@/utils/time';

const TIMING_CONFIG = { duration: ANIMATION.overlayDelay };
const SPRING_CONFIG = { damping: 10, stiffness: 100, mass: 1 };

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [absoluteMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [date] = useAtom(dateAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);

  const opacityShared = useSharedValue(0);
  const backgroundColorShared = useSharedValue(COLORS.activeBackground);

  useEffect(() => {
    if (!absoluteMeasurements[nextPrayerIndex]) return;

    const nowDate = getTodayOrTomorrowDate('today');
    const lastPrayerIndex = 6;
    const isActive = date === nowDate && !todaysPrayers[lastPrayerIndex]?.passed;
    const isActiveOpacity = isActive ? 1 : 0.1;
    const isActiveBackgroundColor = isActive ? COLORS.activeBackground : COLORS.inactiveBackground;

    opacityShared.value = withTiming(isActiveOpacity, TIMING_CONFIG);
    backgroundColorShared.value = withTiming(isActiveBackgroundColor, TIMING_CONFIG);
  }, [absoluteMeasurements, nextPrayerIndex, date, todaysPrayers]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!absoluteMeasurements[nextPrayerIndex]) return { opacity: opacityShared.value };

    const activePrayer = absoluteMeasurements[nextPrayerIndex];

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
