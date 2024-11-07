import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { COLORS, SCREEN, TEXT, ANIMATION } from '@/constants';
import { nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

export default function Timer() {
  const { nextPrayer, overlayTimer } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);

  // Use next prayer timer if selected prayer is the next prayer
  const displayTimer = (isOverlay && selectedPrayerIndex !== nextPrayerIndex) 
    ? overlayTimer 
    : nextPrayer;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(isOverlay ? 1.5 : 1, {
          duration: ANIMATION.duration
        })
      },
      {
        translateY: withTiming(isOverlay ? 5 : 0, {
          duration: ANIMATION.duration
        })
      }
    ],
    fontFamily: isOverlay ? TEXT.famiy.medium : TEXT.famiy.regular
  }));

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}>
          {displayTimer.timerName}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            {`${displayTimer.timerName || '...'} in`}
          </Text>
          {displayTimer.timeDisplay && (
            <Animated.Text style={[styles.timer, animatedStyle]}>
              {displayTimer.timeDisplay}
            </Animated.Text>
          )}
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
  }
});
