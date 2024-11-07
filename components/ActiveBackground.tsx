import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { nextPrayerIndexAtom } from '@/store/store';
import { COLORS, PRAYER, SCREEN, ANIMATION } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: withTiming(nextPrayerIndex * PRAYER.height, {
        duration: ANIMATION.duration * 3
      })
    }]
  }));

  if (nextPrayerIndex === -1) return null;

  return (
    <Animated.View style={[styles.background, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: SCREEN.paddingHorizontal,
    right: SCREEN.paddingHorizontal,
    height: PRAYER.height,
    backgroundColor: COLORS.primary,
    borderRadius: PRAYER.borderRadius,
    opacity: 1,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
