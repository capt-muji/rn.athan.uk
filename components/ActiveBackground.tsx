import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { nextPrayerIndexAtom, prayerRelativeMeasurementsAtom } from '@/store/store';
import { COLORS, PRAYER } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [measurements] = useAtom(prayerRelativeMeasurementsAtom);

  const animatedStyle = useAnimatedStyle(() => {
    const activePrayer = measurements[nextPrayerIndex];
    
    if (nextPrayerIndex === -1 || !activePrayer) {
      return { opacity: 0 };
    }

    return {
      opacity: withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      }),
      position: 'absolute',
      top: withSpring(activePrayer.y, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      }),
      left: activePrayer.x,
      width: withSpring(activePrayer.width),
      height: withSpring(activePrayer.height),
    };
  }, [nextPrayerIndex, measurements]);

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
