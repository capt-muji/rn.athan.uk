import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import { COLORS, SCREEN, TEXT, ANIMATION } from '@/constants';
import { nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

export default function Timer() {
  const { nextPrayer, overlayTimer } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);

  // Separate opacity values for each timer
  const defaultOpacity = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Handle animations when overlay changes
  useEffect(() => {
    if (isOverlay) {
      // Fade out default timer and smoothly scale up
      defaultOpacity.value = withTiming(0, { duration: ANIMATION.duration });
      overlayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
      scale.value = withTiming(1.5, { 
        duration: ANIMATION.duration * 2 // Longer duration for smoother scale
      });
      translateY.value = withTiming(5, { 
        duration: ANIMATION.duration * 2
      });
    } else {
      // Reset when overlay is inactive
      overlayOpacity.value = withTiming(0, { duration: ANIMATION.duration });
      defaultOpacity.value = withTiming(1, { duration: ANIMATION.duration });
      scale.value = withTiming(1, { 
        duration: ANIMATION.duration * 2 // Longer duration for smoother scale
      });
      translateY.value = withTiming(0, { 
        duration: ANIMATION.duration * 2
      });
    }
  }, [isOverlay]);

  const defaultStyle = useAnimatedStyle(() => ({
    opacity: defaultOpacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ]
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    position: 'absolute',
    width: '100%',
    fontFamily: TEXT.famiy.medium
  }));

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}>
          {nextPrayer.timerName}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            {`${nextPrayer.timerName || '...'} in`}
          </Text>
          <View style={styles.timerContainer}>
            <Animated.Text style={[styles.timer, defaultStyle]}>
              {nextPrayer.timeDisplay}
            </Animated.Text>
            <Animated.Text style={[styles.timer, overlayStyle]}>
              {overlayTimer.timeDisplay}
            </Animated.Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginTop: SCREEN.paddingHorizontal,
    marginBottom: 35,
    zIndex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
  },
  timer: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 5,
    textAlign: 'center',
  },
  timerContainer: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
