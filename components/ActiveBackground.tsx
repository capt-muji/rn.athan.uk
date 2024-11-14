import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { nextPrayerIndexAtom, absolutePrayerMeasurementsAtom, overlayVisibleAtom } from '@/store/store';
import { ANIMATION, COLORS, OVERLAY, PRAYER } from '@/constants';

const SPRING_CONFIG = { damping: 10, stiffness: 100, mass: 1 };

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [absoluteMeasurements] = useAtom(absolutePrayerMeasurementsAtom);

  const animatedStyle = useAnimatedStyle(() => {
    if (nextPrayerIndex === -1 || !absoluteMeasurements[nextPrayerIndex]) {
      return { opacity: 0 };
    }

    const activePrayer = absoluteMeasurements[nextPrayerIndex];

    return {
      opacity: withTiming(1, { duration: ANIMATION.overlayDelay }),
      position: 'absolute',
      top: withSpring(activePrayer.pageY, SPRING_CONFIG),
      left: activePrayer.pageX,
      width: activePrayer.width,
      height: activePrayer.height,
      zIndex: OVERLAY.zindexes.off.activeBackground,
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
    shadowOpacity: 0.35,
    shadowRadius: 5,
  }
});
