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
  const date = useAtomValue(dateAtom);
  const schedule = useAtomValue(scheduleAtom);
  const isActive = useAtomValue(isBackgroundActiveAtom);
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const isFajr = schedule.nextIndex === PRAYER_INDEX_FAJR && date.current === date.current;

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;

    if (isFajr) {
      opacity.value = withTiming(0.1, { duration: ANIMATION.durationSlowest });
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlowest });
    } else {
      opacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlow });
    }
  }, [schedule.nextIndex, date, isActive]);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    backgroundColor: COLORS.activeBackground,
    shadowColor: COLORS.activeBackgroundShadow
  }
});
