import { StyleSheet, View } from 'react-native';
import { withTiming, useSharedValue, withDelay, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAtomValue } from 'jotai';

import { TEXT, ANIMATION, COLORS } from '@/shared/constants';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import { isTimePassed } from '@/shared/time';
import { createColorAnimation, createColorAnimatedStyle } from '@/shared/animation';

const TIMING_CONFIG = {
  duration: ANIMATION.durationSlow
};

interface Props { index: number; type: ScheduleType; }

export default function PrayerTime({ index, type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // State
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  // Derived State
  const prayer = schedule.today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;
  const onLoadColorPos = isPassed || isNext ? 1 : 0;

  // Animations
  const animations = createColorAnimation(onLoadColorPos);
  const animatedStyles = createColorAnimatedStyle(animations);

  // Animations Updates
  if (isNext) {
    animations.colorPos.value = withDelay(
      ANIMATION.duration,
      withTiming(1, TIMING_CONFIG)
    );
  }

  return (
    <View style={[styles.container, { width: isStandard ? 95 : 85 }]}>
      <Animated.Text style={[styles.text, animatedStyles.text]}>
        {prayer.time}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    width: '100%',
  },
});