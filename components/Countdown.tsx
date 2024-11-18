import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/shared/constants';
import { useCountdown } from '@/hooks/useCountdown';
import { PrayerType } from '@/shared/types';
import useOverlay from '@/hooks/useOverlay';

interface Props {
  type: PrayerType;
}

export default function Countdown({ type }: Props) {
  const { currentPrayers, currentDay, currentIndex, isOverlayOn } = useOverlay(type);

  const prayerName = currentPrayers[currentIndex]?.english;
  const prayerCountdown = useCountdown(currentIndex, currentDay);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(isOverlayOn ? 1.5 : 1) },
      { translateY: withTiming(isOverlayOn ? 5 : 0) }
    ]
  }));

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{prayerName || ''} in</Text>
      <Animated.Text
        style={[
          styles.countdown,
          { fontFamily: isOverlayOn ? TEXT.famiy.medium : TEXT.famiy.regular },
          animatedStyle
        ]}
      >
        {prayerCountdown || ' '}
      </Animated.Text>
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
