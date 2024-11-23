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
import { dateAtom, extraScheduleAtom, isBackgroundActiveAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';

interface Props { type: ScheduleType }

export default function ActiveBackground({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const isActive = useAtomValue(isBackgroundActiveAtom);
  const date = useAtomValue(dateAtom);
  const isFajr = schedule.nextIndex === PRAYER_INDEX_FAJR && date.current === date.current;
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;

    colorProgress.value = withTiming(isFajr ? 1 : 0, {
      duration: isFajr ? ANIMATION.durationSlowest : ANIMATION.durationSlow
    });
  }, [schedule.nextIndex, date, isActive]);

  const animatedStyles = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [COLORS.activeBackground, COLORS.inactiveBackground]
    ),
    transform: [{
      translateY: withTiming(translateY.value, {
        duration: isFajr ? ANIMATION.durationSlowest : ANIMATION.durationSlower,
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
    ...PRAYER.shadow,
  }
});
