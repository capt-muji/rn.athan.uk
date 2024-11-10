import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { nextPrayerIndexAtom, relativePrayerMeasurementsAtom } from '@/store/store';
import { COLORS, PRAYER } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [relativeMeasurements] = useAtom(relativePrayerMeasurementsAtom);

  const animatedStyle = useAnimatedStyle(() => {
    if (nextPrayerIndex === -1 || !relativeMeasurements[nextPrayerIndex]) {
      return { opacity: 0 };
    }

    const activePrayer = relativeMeasurements[nextPrayerIndex];
    return {
      opacity: withTiming(1),
      position: 'absolute',
      top: withSpring(activePrayer.y),
      left: activePrayer.x,
      width: withSpring(activePrayer.width),
      height: withSpring(activePrayer.height),
    };
  });

  return <Animated.View style={[styles.background, animatedStyle]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    borderRadius: PRAYER.borderRadius,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
