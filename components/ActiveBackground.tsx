import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { nextPrayerIndexAtom } from '@/store/store';
import { COLORS, PRAYER, SCREEN } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: withSpring(nextPrayerIndex * PRAYER.height, {
        damping: 8,        // Lower = more bouncy
        stiffness: 125,    // Higher = faster movement
        mass: 0.5,         // Lower = less inertia
        velocity: 0,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
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
