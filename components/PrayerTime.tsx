import { StyleSheet, View } from 'react-native';
import { withTiming, useSharedValue, withDelay, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAtomValue } from 'jotai';

import { TEXT, ANIMATION, COLORS } from '@/shared/constants';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import { isTimePassed } from '@/shared/time';

const ANIMATION_CONFIG = {
  timing: {
    duration: ANIMATION.duration,
    durationSlow: ANIMATION.durationSlow
  }
};

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
  const animations = createAnimations(onLoadColorPos);
  const animatedStyles = createAnimatedStyles(animations);

  // Animations Updates
  if (isNext) {
    animations.colorPos.value = withDelay(
      ANIMATION_CONFIG.timing.duration,
      withTiming(1, { duration: ANIMATION_CONFIG.timing.durationSlow })
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