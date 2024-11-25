import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYER } from '@/shared/constants';
import { dateAtom, extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import { isTimePassed } from '@/shared/time';

interface Props {
  type: ScheduleType
}

export default function ActiveBackground({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const colorProgress = useSharedValue(1);
  const prevPosition = useRef(schedule.nextIndex);

  // Check if last prayer has passed
  const lastPrayerIndex = Object.keys(schedule.today).length - 1;
  const lastPrayerTime = schedule.today[lastPrayerIndex].time;
  const isLastPrayerPassed = isTimePassed(lastPrayerTime);

  // Initial setup
  useEffect(() => {
    const shouldBeTransparent = isLastPrayerPassed;
    colorProgress.value = shouldBeTransparent ? 0 : 1;
    translateY.value = schedule.nextIndex * PRAYER.height;
    prevPosition.current = schedule.nextIndex;
  }, []);

  // Handle nextIndex changes
  useEffect(() => {
    if (schedule.nextIndex === prevPosition.current) return;

    if (schedule.nextIndex === 0) {
      // Fade out and move to position 0 in sequence
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlow });
      translateY.value = withSequence(
        withTiming(translateY.value, { duration: ANIMATION.durationSlow }), // Keep current position while fading
        withTiming(0, { duration: 0 }) // Then instantly move to 0
      );
    } else {
      // Just slide to new position
      translateY.value = schedule.nextIndex * PRAYER.height;
    }

    prevPosition.current = schedule.nextIndex;
  }, [schedule.nextIndex]);

  // Handle date changes
  useEffect(() => {
    if (!isLastPrayerPassed) {
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlow });
    }
  }, [date.current]);

  const animatedStyles = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['transparent', COLORS.activeBackground]
    ),
    transform: [{
      translateY: withTiming(translateY.value, {
        duration: ANIMATION.durationSlower,
        easing: Easing.elastic(0.5)
      })
    }],
  }));

  return <Animated.View style={[styles.background, animatedStyles]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: PRAYER.height,
    borderRadius: 8,
    shadowOffset: { width: 1, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowColor: COLORS.activeBackgroundShadow
  }
});
