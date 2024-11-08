import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { nextPrayerIndexAtom, prayerMeasurementsAtom } from '@/store/store';
import { COLORS, PRAYER, SCREEN } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  // Access our dictionary of all prayer measurements
  const [measurements] = useAtom(prayerMeasurementsAtom);

  const animatedStyle = useAnimatedStyle(() => {
    // Look up the measurements for the active prayer
    const activePrayer = measurements[nextPrayerIndex];
    if (!activePrayer) return { opacity: 0 };

    // Animate to the pre-measured position
    return {
      top: withSpring(activePrayer.y, {
        damping: 10,
        stiffness: 150,
        mass: 0.3,
      }),
      width: withSpring(activePrayer.width),
      height: withSpring(activePrayer.height),
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
    backgroundColor: COLORS.primary,
    borderRadius: PRAYER.borderRadius,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
