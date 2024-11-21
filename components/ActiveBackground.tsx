import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { COLORS, PRAYER } from '@/shared/constants';
import { scheduleAtom } from '@/stores/store';

export default function ActiveBackground() {
  const schedule = useAtomValue(scheduleAtom);
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;
  }, [schedule.nextIndex]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{
      translateY: withSpring(translateY.value, { damping: 12, stiffness: 90, mass: 0.8 })
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
