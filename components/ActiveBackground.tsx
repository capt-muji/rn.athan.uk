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
import { dateAtom, scheduleAtom, isBackgroundActiveAtom } from '@/stores/store';

export default function ActiveBackground() {
  const isActive = useAtomValue(isBackgroundActiveAtom);
  const date = useAtomValue(dateAtom);
  const schedule = useAtomValue(scheduleAtom);
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
