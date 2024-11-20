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
  dimensions: {
    width: number;
    height: number;
  };
}

export default function ActiveBackground({ type, dimensions }: Props) {
  const schedule = useAtomValue(type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  const backgroundColorShared = useSharedValue(COLORS.activeBackground);

  const totalPrayers = Object.keys(schedule.today).length;
  const prayerHeight = dimensions.height / totalPrayers;

  useEffect(() => {
    const nowDate = getRecentDate(DaySelection.Today);
    const lastPrayerIndex = PRAYERS_ENGLISH.length - 1;
  }, [date, schedule.today]);

  const animatedStyle = useAnimatedStyle(() => ({
    top: schedule.nextIndex * prayerHeight,
    height: prayerHeight,
    zIndex: OVERLAY.zindexes.off.activeBackground,
  }));

  return <Animated.View style={[styles.background, animatedStyle]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    backgroundColor: COLORS.activeBackground,
    borderRadius: PRAYER.borderRadius,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  }
});
