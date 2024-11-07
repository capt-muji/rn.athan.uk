import { StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { nextPrayerIndexAtom, lastValidPositionAtom, overlayAtom, selectedPrayerIndexAtom } from '@/store/store';
import { COLORS, PRAYER, SCREEN, ANIMATION } from '@/constants';

export default function ActiveBackground() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [lastPosition, setLastPosition] = useAtom(lastValidPositionAtom);
  const [isOverlay] = useAtom(overlayAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  // Update last valid position when we have a real index
  if (nextPrayerIndex !== -1) {
    setLastPosition(nextPrayerIndex);
  }

  const animatedStyle = useAnimatedStyle(() => {
    const currentPosition = nextPrayerIndex === -1 ? lastPosition : nextPrayerIndex;
    const shouldShow = !isOverlay || (isOverlay && selectedPrayerIndex === currentPosition);
    
    return {
      transform: [{
        translateY: withSpring(currentPosition * PRAYER.height, {
          damping: 8,
          stiffness: 125,
          mass: 0.5,
          velocity: 0,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 2,
        })
      }],
      opacity: withTiming(
        (nextPrayerIndex === -1 || !shouldShow) ? 0 : 1,
        { duration: ANIMATION.duration }
      )
    };
  });

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
    opacity: 0,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});
