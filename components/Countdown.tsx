import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/shared/constants';
import { usePrayerCountdown } from '@/hooks/useCountdown';
import useBaseStore from '@/hooks/useBaseStore';
import { PrayerType } from '@/shared/types';

interface Props {
  type: PrayerType;
}

export default function Countdown({ type }: Props) {
  const {
    isOverlayOn,
    today: todaysPrayers,
    tomorrow: tomorrowsPrayers,
    nextIndex: nextPrayerIndex,
    selectedIndex: selectedPrayerIndex
  } = useBaseStore(type);

  const prayers = isOverlayOn && todaysPrayers[selectedPrayerIndex]?.passed ? tomorrowsPrayers : todaysPrayers;
  const day = isOverlayOn && todaysPrayers[selectedPrayerIndex]?.passed ? 'tomorrow' : 'today';
  const prayerIndex = isOverlayOn ? selectedPrayerIndex : nextPrayerIndex;

  const prayerName = prayers[prayerIndex]?.english;
  const prayerCountdown = usePrayerCountdown(prayerIndex, day);

  const fontFamily = { fontFamily: isOverlayOn ? TEXT.famiy.medium : TEXT.famiy.regular };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(isOverlayOn ? 1.5 : 1) },
      { translateY: withTiming(isOverlayOn ? 5 : 0) }
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
