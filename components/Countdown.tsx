import { StyleSheet, Text } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/shared/constants';
import { nextPrayerIndexAtom, overlayVisibleAtom, todaysPrayersAtom, tomorrowsPrayersAtom, selectedPrayerIndexAtom } from '@/stores/state';
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
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{prayerName || ''} in</Text>
      <Animated.Text style={[styles.countdown, fontFamily, animatedStyle]}>{prayerCountdown || ' '}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    justifyContent: 'center',
    zIndex: OVERLAY.zindexes.off.countdown,
    pointerEvents: 'none',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 5,
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity
  },
  countdown: {
    fontFamily: TEXT.famiy.medium,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
});
