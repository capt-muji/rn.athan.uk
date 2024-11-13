import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { nextPrayerIndexAtom, absolutePrayerMeasurementsAtom, overlayVisibleAtom } from '@/store/store';
import { ANIMATION, COLORS, OVERLAY, PRAYER } from '@/constants';

export default function ActiveBackground({ isOverlay = false }) {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [absoluteMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);


  const animatedStyle = useAnimatedStyle(() => {
    if (nextPrayerIndex === -1 || !absoluteMeasurements[nextPrayerIndex]) {
      return { opacity: 0 };
    }

    const activePrayer = absoluteMeasurements[nextPrayerIndex];

    return {
      opacity: withTiming(1, { duration: ANIMATION.overlayDelay }),
      position: 'absolute',
      top: withSpring(activePrayer.pageY),
      left: activePrayer.pageX,
      width: withSpring(activePrayer.width),
      height: withSpring(activePrayer.height),
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
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
