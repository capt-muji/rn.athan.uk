import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYER, PRAYER_INDEX_FAJR } from '@/shared/constants';
import { dateAtom, extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';

interface Props { type: ScheduleType }

export default function ActiveBackground({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const date = useAtomValue(dateAtom);
  const isFirstPrayer = schedule.nextIndex === PRAYER_INDEX_FAJR && date.current === date.current;
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (schedule.nextIndex === 0) {
      colorProgress.value = withTiming(1, {
        duration: ANIMATION.durationSlow,
      }, (finished) => {
        if (finished) translateY.value = 0;
      });
    } else {
      translateY.value = schedule.nextIndex * PRAYER.height;
      colorProgress.value = withTiming(isFirstPrayer ? 1 : 0, {
        duration: isFirstPrayer ? ANIMATION.durationSlowest : ANIMATION.durationSlow
      });
    }
  }, [schedule.nextIndex, date]);

  const animatedStyles = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [COLORS.activeBackground, 'transparent']
    ),
    transform: [{
      translateY: withTiming(translateY.value, {
        duration: isFirstPrayer ? ANIMATION.durationSlowest : ANIMATION.durationSlower,
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
