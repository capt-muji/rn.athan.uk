import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/constants';
import { nextPrayerIndexAtom, overlayVisibleToggleAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

interface TimerProps {
  isOverlay?: boolean;
}

export default function Timer({ isOverlay = false }: TimerProps) {
  const { nextPrayer } = useTimer({ isOverlay });
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(overlayVisibleToggle ? 1.5 : 1) },
      { translateY: withTiming(overlayVisibleToggle ? 5 : 0) }
    ]
  }));

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}> {nextPrayer.timerName} </Text>
      ) : (
        <>
          <Text style={styles.text}> {`${nextPrayer.timerName || '...'} in`} </Text>
          <Animated.View style={[styles.timerContainer, animatedStyle]}>
            <Text style={styles.timer}> {nextPrayer.timeDisplay} </Text>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginBottom: 35,
    justifyContent: 'center',
    zIndex: OVERLAY.zindexes.off.timer
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
  },
  timer: {
    fontFamily: TEXT.famiy.medium,
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
