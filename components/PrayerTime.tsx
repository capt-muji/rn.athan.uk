import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { TEXT, ANIMATION, COLORS } from '@/constants';
import { todaysPrayersAtom, tomorrowsPrayersAtom, overlayClosingAtom, nextPrayerIndexAtom } from '@/store/store';

interface Props {
  index: number;
  isOverlay: boolean;
  isSelected: boolean;
}

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

  const baseStyle = [styles.text, styles.time, { color: textColor }];

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
      opacity: withTiming(overlayClosing ? 0 : 1, { duration })
    };
  });

  return (
    <Animated.Text style={[baseStyle, isOverlay && isPassed ? tomorrowAnimatedStyle : todayAnimatedStyle]}>
      {isOverlay && isPassed ? tomorrowTime : todayTime}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  time: {
    flex: 1,
    textAlign: 'center',
    marginLeft: 25,
    marginRight: 10,
  },
  tomorrow: {
    position: 'absolute',
    right: 10,
  }
});