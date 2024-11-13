import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle, withTiming, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { TEXT, ANIMATION, COLORS } from '@/constants';
import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, selectedPrayerIndexAtom, overlayVisibleToggleAtom, overlayStartOpeningAtom, overlayStartClosingAtom, lastSelectedPrayerIndexAtom, overlayFinishedClosingAtom } from '@/store/store';
import { useEffect } from 'react';

interface Props {
  index: number;
  isOverlay: boolean;
}

export default function PrayerTime({ index, isOverlay }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const todayTime = todaysPrayers[index].time;
  const tomorrowTime = tomorrowsPrayers[index]?.time;

  const baseOpacity = isPassed || isNext ? 1 : TEXT.opacity;
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    if (!isOverlay && !isNext && index === selectedPrayerIndex) {
      opacity.value = withSpring(baseOpacity, {
        mass: 1,
        damping: 15,
        stiffness: 100,
      });
    }
  }, [overlayVisibleToggle, baseOpacity, selectedPrayerIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    // Handle selected prayer (both overlay and non-overlay)
    if (index === selectedPrayerIndex) {
      if (isOverlay) return {
        color: COLORS.textPrimary,
        opacity: 1
      };

      return {
        color: COLORS.textPrimary,
        opacity: opacity.value,
      };
    }

    // Default behavior for non-selected prayers
    if (isPassed || isNext) return {
      color: COLORS.textPrimary,
      opacity: baseOpacity,
    };

    return {
      color: COLORS.textTransparent,
      opacity: baseOpacity,
    };
  });

  const time = () => isOverlay ? (isPassed ? tomorrowTime : todayTime) : todayTime;

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, animatedStyle]}>
        {time()}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
  },
});