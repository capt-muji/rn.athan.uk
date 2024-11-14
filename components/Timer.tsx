import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/constants';
import { nextPrayerIndexAtom, overlayVisibleAtom, todaysPrayersAtom, tomorrowsPrayersAtom, selectedPrayerIndexAtom } from '@/store/store';
import { usePrayerCountdown } from '@/hooks/useCountdown';

export default function Timer() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const nextPrayerName = useRef(todaysPrayers[nextPrayerIndex]?.english);
  const selectedPrayerCountdown = useRef('');
  const selectedPrayerName = useRef('');

  // Get countdown for next or selected prayer
  const prayers = overlayVisible && todaysPrayers[selectedPrayerIndex]?.passed ? tomorrowsPrayers : todaysPrayers;

  // today or tomorrow
  const day = overlayVisible && todaysPrayers[selectedPrayerIndex]?.passed ? 'tomorrow' : 'today';

  // Use selected prayer index if overlay is visible, otherwise use next prayer index
  const prayerIndex = overlayVisible ? selectedPrayerIndex : nextPrayerIndex;

  // Get countdown for index prayer
  const countdown = usePrayerCountdown(prayerIndex, day);

  useEffect(() => {
    if (overlayVisible && selectedPrayerIndex !== -1) {
      selectedPrayerName.current = prayers[selectedPrayerIndex].english;
      selectedPrayerCountdown.current = countdown;
    }
  }, [overlayVisible, selectedPrayerIndex]);

  const fontFamily = { fontFamily: overlayVisible ? TEXT.famiy.medium : TEXT.famiy.regular };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(overlayVisible ? 1.5 : 1) },
      { translateY: withTiming(overlayVisible ? 5 : 0) }
    ]
  }));

  return (
    <View style={styles.container}>
      {!overlayVisible && nextPrayerIndex === -1 ? (
        <Text style={styles.text}> {'All prayers passed'} </Text>
      ) : (
        <Animated.View style={styles.wrapper}>
          <Text style={styles.text}>
            {overlayVisible ? selectedPrayerName.current : nextPrayerName.current} in
          </Text>
          <Animated.View style={[styles.timerContainer, animatedStyle]}>
            <Animated.Text style={[styles.timer, fontFamily]}>
              {countdown}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginBottom: 40,
    justifyContent: 'center',
    zIndex: OVERLAY.zindexes.off.timer,
    pointerEvents: 'none',
  },
  wrapper: {

  },
  text: {
    color: COLORS.textSecondary,
    opacity: TEXT.opacity + 0.15,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
    marginBottom: 3,
  },
  timer: {
    fontFamily: TEXT.famiy.medium,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
  timerContainer: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
