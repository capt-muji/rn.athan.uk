import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYER } from '@/shared/constants';
import { scheduleAtom } from '@/stores/store';

export default function ActiveBackground() {
  const schedule = useAtomValue(scheduleAtom);
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;
  }, [schedule.nextIndex]);

  const animatedStyles = useAnimatedStyle(() => ({
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
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow
  }
});
