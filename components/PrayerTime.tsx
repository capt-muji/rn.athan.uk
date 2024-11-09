import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { TEXT, ANIMATION, COLORS } from '@/constants';
import { todaysPrayersAtom, tomorrowsPrayersAtom, overlayClosingAtom, nextPrayerIndexAtom } from '@/store/store';

interface Props {
  index: number;
  isOverlay: boolean;
  isSelected: boolean;
}

const TodayTime = ({ time, style, isVisible }: { time: string, style: any[], isVisible: boolean }) => {
  return (
    <Animated.Text style={[style, { opacity: isVisible ? 1 : 0 }]}>
      {time}
    </Animated.Text>
  );
};

const TomorrowTime = ({ time, style, isVisible }: { time: string, style: any[], isVisible: boolean }) => {
  return (
    <Animated.Text style={[style, { position: 'absolute', opacity: isVisible ? 1 : 0 }]}>
      {time}
    </Animated.Text>
  );
};

export default function PrayerTime({
  index,
  isOverlay,
  isSelected,
}: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayClosing] = useAtom(overlayClosingAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const todayTime = todaysPrayers[index].time;
  const tomorrowTime = tomorrowsPrayers[index]?.time;

  // Calculate textColor internally
  const textColor = isSelected
    ? 'white'
    : isPassed || isNext
      ? COLORS.textPrimary
      : COLORS.textTransparent;

  const baseStyle = [];

  const todayAnimatedStyle = useAnimatedStyle(() => {
    if (!isOverlay) {
      return {
        opacity: isPassed || isNext ? 1 : TEXT.transparent
      };
    }

    // Skip animation for passed/next prayers in overlay
    if (isPassed || isNext) return {};

    const shouldBeVisible = isSelected;
    const duration = overlayClosing ? ANIMATION.duration : 0;

    return {
      opacity: withTiming(
        shouldBeVisible && !overlayClosing ? 1 : 0,
        { duration }
      )
    };
  });

  const tomorrowAnimatedStyle = useAnimatedStyle(() => {
    if (!isOverlay || !isPassed) return { opacity: 0 };

    const duration = overlayClosing ? ANIMATION.duration : 0;
    return {
      opacity: withSequence(
        withTiming(0, { duration: 100 }), // First hide
        withDelay(100, withTiming(1, { duration })) // Then show after delay
      )
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {(isSelected && isPassed) ? (
        <Animated.Text style={[styles.text, { color: textColor, opacity: 1 }, tomorrowAnimatedStyle]}>
          {tomorrowTime}
        </Animated.Text>
      ) : (
        <Animated.Text style={[styles.text, { color: textColor, opacity: 1 }, todayAnimatedStyle]}>
          {todayTime}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
  },
});