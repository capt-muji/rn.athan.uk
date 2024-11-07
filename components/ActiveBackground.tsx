import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { nextPrayerIndexAtom, lastValidPositionAtom } from '@/store/store';
import { COLORS, PRAYER, ANIMATION, SCREEN } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [lastPosition, setLastPosition] = useAtom(lastValidPositionAtom);

  if (nextPrayerIndex !== -1) {
    setLastPosition(nextPrayerIndex);
  }

  const animatedStyle = useAnimatedStyle(() => {
    const currentPosition = nextPrayerIndex === -1 ? lastPosition : nextPrayerIndex;

    return {
      transform: [{
        translateY: withSpring(currentPosition * PRAYER.height, {
          damping: 10,        // Reduced damping for more bounce
          stiffness: 150,     // Increased stiffness for more "snap"
          mass: 0.3,          // Reduced mass for quicker movement
          velocity: 100,      // Added initial velocity for more momentum
          restSpeedThreshold: 0.5,  // Lower threshold to ensure animation completes
          restDisplacementThreshold: 0.5
        })
      }],
      opacity: withTiming(
        nextPrayerIndex === -1 ? 0 : 1,
        {
          duration: 300,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1)
        }
      )
    };
  });

  return <Animated.View style={[styles.background, animatedStyle]} />;
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
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
