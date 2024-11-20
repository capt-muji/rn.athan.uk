import { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYERS_ENGLISH, OVERLAY, PRAYER, SCREEN } from '@/shared/constants';
import { getRecentDate } from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';
import { dateAtom, extraScheduleAtom, standardScheduleAtom } from '@/stores/store';

const TIMING_CONFIG = { duration: ANIMATION.overlayDelay };
const SPRING_CONFIG = { damping: 15, stiffness: 90, mass: 0.8 };

interface Props {
  type: ScheduleType;
  listHeight: number;
}

export default function ActiveBackground({ type, listHeight }: Props) {
  const schedule = useAtomValue(type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  const opacityShared = useSharedValue(0);
  const backgroundColorShared = useSharedValue(COLORS.activeBackground);

  // Calculate dimensions
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  const totalPrayers = Object.keys(schedule.today).length;
  const prayerHeight = listHeight / totalPrayers;

  useEffect(() => {
    const nowDate = getRecentDate(DaySelection.Today);
    const lastPrayerIndex = PRAYERS_ENGLISH.length - 1;
    const isActive = date.current === nowDate && !schedule.today[lastPrayerIndex]?.passed;
    const isActiveOpacity = isActive ? 1 : 0.1;
    const isActiveBackgroundColor = isActive ? COLORS.activeBackground : COLORS.inactiveBackground;

    opacityShared.value = withTiming(isActiveOpacity, TIMING_CONFIG);
    backgroundColorShared.value = withTiming(isActiveBackgroundColor, TIMING_CONFIG);
  }, [date, schedule.today]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityShared.value,
    backgroundColor: backgroundColorShared.value,
    position: 'absolute',
    top: schedule.nextIndex * prayerHeight,
    left: SCREEN.paddingHorizontal,
    width: windowWidth - (SCREEN.paddingHorizontal * 2),
    height: prayerHeight,
    zIndex: OVERLAY.zindexes.off.activeBackground,
  }));

  return <Animated.View style={[styles.background, animatedStyle]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    borderRadius: PRAYER.borderRadius,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  }
});
