import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/constants';
import { nextPrayerIndexAtom, overlayVisibleAtom, todaysPrayersAtom, tomorrowsPrayersAtom, selectedPrayerIndexAtom } from '@/store/store';
import { usePrayerCountdown } from '@/hooks/useCountdown';

export default function Timer() {
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const prayers = overlayVisible && todaysPrayers[selectedPrayerIndex]?.passed ? tomorrowsPrayers : todaysPrayers;
  const day = overlayVisible && todaysPrayers[selectedPrayerIndex]?.passed ? 'tomorrow' : 'today';
  const prayerIndex = overlayVisible ? selectedPrayerIndex : nextPrayerIndex;

  const prayerName = prayers[prayerIndex]?.english;
  const prayerCountdown = usePrayerCountdown(prayerIndex, day);

  const fontFamily = { fontFamily: overlayVisible ? TEXT.famiy.medium : TEXT.famiy.regular };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(overlayVisible ? 1.5 : 1) },
      { translateY: withTiming(overlayVisible ? 5 : 0) }
    ]
  }));

  return (
    <View style={styles.componentContainer}>
      {!overlayVisible && nextPrayerIndex === -1 ? (
        <Text style={styles.text}>Refreshing at midnight</Text>
      ) : (
        <Animated.View style={styles.contentContainer}>
          <Text style={styles.text}>{prayerName} in</Text>
          <Animated.View style={[styles.countdownContainer, animatedStyle]}>
            <Animated.Text style={[styles.countdown, fontFamily]}>{prayerCountdown}</Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  componentContainer: {
    height: 50,
    marginBottom: 40,
    justifyContent: 'center',
    zIndex: OVERLAY.zindexes.off.countdown,
    pointerEvents: 'none',
  },
  contentContainer: {

  },
  text: {
    color: COLORS.textSecondary,
    opacity: TEXT.opacity + 0.15,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
    marginBottom: 3,
    fontFamily: TEXT.famiy.regular,
  },
  countdown: {
    fontFamily: TEXT.famiy.medium,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
  countdownContainer: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
