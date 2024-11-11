import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { nextPrayerIndexAtom, relativePrayerMeasurementsAtom, activeBackgroundReadyAtom } from '@/store/store';
import { COLORS, PRAYER } from '@/constants';

export default function ActiveBackground() {
  console.log('aaa - active background rendering');

  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [relativeMeasurements] = useAtom(relativePrayerMeasurementsAtom);
  const [, setActiveBackgroundReady] = useAtom(activeBackgroundReadyAtom);

  console.log('bbb - reading nextPrayerIndex');
  console.log(nextPrayerIndex);

  const animatedStyle = useAnimatedStyle(() => {
    if (nextPrayerIndex === -1 || !relativeMeasurements[nextPrayerIndex]) {
      runOnJS(setActiveBackgroundReady)(false);
      return { opacity: 0 };
    }

    console.log('ccc - active background now showing');
    const activePrayer = relativeMeasurements[nextPrayerIndex];
    return {
      opacity: withTiming(1, {}, () => {
        runOnJS(setActiveBackgroundReady)(true);
      }),
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
