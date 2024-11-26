import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { withTiming, withDelay } from 'react-native-reanimated';
import { useRef } from 'react';
import { useAtomValue } from 'jotai';
import * as animationUtils from '@/shared/animation';

import { TEXT, PRAYER, ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { isTimePassed } from '@/shared/time';
import Alert from './Alert';
import PrayerTime from './PrayerTime';

const TIMING_CONFIG = {
  duration: ANIMATION.durationSlow
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props { index: number; type: ScheduleType }

export default function Prayer({ index, type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // State
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const viewRef = useRef<View>(null);

  // Derived State
  const prayer = schedule.today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;
  const onLoadColorPos = isPassed || isNext ? 1 : 0;

  // Animations
  const sharedValues = animationUtils.colorSharedValues(onLoadColorPos);
  const animatedStyles = animationUtils.colorAnimatedStyle(sharedValues);

  // Animations Updates
  if (isNext) {
    sharedValues.colorPos.value = withDelay(
      ANIMATION.duration,
      withTiming(1, TIMING_CONFIG)
    );
  }

  return (
    <AnimatedPressable ref={viewRef} style={styles.container}>
      <Animated.Text style={[styles.text, styles.english, animatedStyles]}>{prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedStyles]}>{prayer.arabic}</Animated.Text>
      <PrayerTime index={index} type={type} />
      <Alert index={index} type={type} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PRAYER.height,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    paddingLeft: PRAYER.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 15,
  },
});