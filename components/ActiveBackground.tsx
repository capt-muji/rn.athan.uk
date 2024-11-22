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
import { ANIMATION, COLORS, PRAYER } from '@/shared/constants';
import { dateAtom, scheduleAtom } from '@/stores/store';

export default function ActiveBackground() {
  const date = useAtomValue(dateAtom);
  const schedule = useAtomValue(scheduleAtom);
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;

    // Check if it's midnight reset on the same day
    if (schedule.nextIndex === 0 && date.current === date.current) {
      opacity.value = withTiming(0.1, { duration: ANIMATION.durationSlow });
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else {
      opacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlow });
    }
  }, [schedule.nextIndex, date]);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [COLORS.active, '#5f96e3']
    ),
    transform: [{
      translateY: withTiming(translateY.value, {
        duration: ANIMATION.durationSlower,
        easing: Easing.elastic(0.75)
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
    backgroundColor: COLORS.active,
    shadowColor: COLORS.activeShadow
  }
});
