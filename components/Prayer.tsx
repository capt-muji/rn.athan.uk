import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withDelay, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { useRef } from 'react';
import { useAtomValue } from 'jotai';

import { COLORS, TEXT, PRAYER, ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { isTimePassed } from '@/shared/time';
import Alert from './Alert';
import PrayerTime from './PrayerTime';

const ANIMATION_CONFIG = {
  timing: {
    duration: ANIMATION.duration,
    durationSlow: ANIMATION.durationSlow
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const createAnimations = (initialColorPos: number) => ({
  colorPos: useSharedValue(initialColorPos)
});

const createAnimatedStyles = (animations: ReturnType<typeof createAnimations>) => ({
  text: useAnimatedStyle(() => ({
    color: interpolateColor(
      animations.colorPos.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }))
});

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
  const animations = createAnimations(onLoadColorPos);
  const animatedStyles = createAnimatedStyles(animations);

  if (isNext) {
    animations.colorPos.value = withDelay(
      ANIMATION_CONFIG.timing.duration,
      withTiming(1, { duration: ANIMATION_CONFIG.timing.durationSlow })
    );
  }

  return (
    <AnimatedPressable ref={viewRef} style={styles.container}>
      <Animated.Text style={[styles.text, styles.english, animatedStyles.text]}>{prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedStyles.text]}>{prayer.arabic}</Animated.Text>
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