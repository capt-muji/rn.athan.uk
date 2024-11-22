import { StyleSheet, View } from 'react-native';
import { withTiming, useSharedValue, withDelay, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { TEXT, ANIMATION, COLORS, PRAYER_INDEX_LAST_THIRD, PRAYER_INDEX_FAJR } from '@/shared/constants';
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { scheduleAtom } from '@/stores/store';

interface Props { index: number; isOverlay: boolean; }

export default function PrayerTime({ index, isOverlay = false }: Props) {
  const isLastThird = index === PRAYER_INDEX_LAST_THIRD;
  const { today, tomorrow, nextIndex, selectedIndex } = useAtomValue(scheduleAtom);

  // const overlayVisible = false;

  const isPassed = index < nextIndex
  const isNext = index === nextIndex;
  const todayTime = today[index].time;
  const tomorrowTime = tomorrow[selectedIndex]?.time;

  const baseOpacity = isPassed || isNext ? 1 : TEXT.opacity;

  const originalOpacity = useSharedValue(baseOpacity);
  const overlayTodayOpacity = useSharedValue(0);
  const overlayTomorrowOpacity = useSharedValue(0);
  const textColor = useSharedValue(isPassed || isNext ? 1 : 0);

  // Add cascade delay helper function
  const getCascadeDelay = (currentIndex: number) => {
    const delay = 100;
    const totalPrayers = 7;
    return (totalPrayers - currentIndex) * delay;
  };

  useEffect(() => {
    if (isNext || isPassed) {
      originalOpacity.value = withDelay(ANIMATION.duration, withTiming(1, { duration: ANIMATION.durationSlow }));
      textColor.value = withDelay(ANIMATION.duration, withTiming(1, { duration: ANIMATION.durationSlow }));
      return;
    };

    // Isha prayer just finished
    if (nextIndex === PRAYER_INDEX_FAJR) {
      originalOpacity.value = withDelay(
        getCascadeDelay(index),
        withTiming(TEXT.opacity, { duration: ANIMATION.durationSlow })
      );
      textColor.value = withDelay(
        getCascadeDelay(index),
        withTiming(0, { duration: ANIMATION.durationSlow })
      );
      return;
    }
  }, [nextIndex]);

  // useEffect(() => {
  //   if (isNext) {
  //     originalOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
  //     textColor.value = withTiming(1, { duration: ANIMATION.durationSlow });
  //     return;
  //   }

  //   if (nextIndex === 0) {
  //     originalOpacity.value = withDelay(
  //       getCascadeDelay(index),
  //       withTiming(TEXT.opacity, { duration: ANIMATION.durationSlow })
  //     );
  //     textColor.value = withDelay(
  //       getCascadeDelay(index),
  //       withTiming(0, { duration: ANIMATION.durationSlow })
  //     );
  //     return;
  //   }

  //   if (!isPassed) {
  //     originalOpacity.value = withTiming(TEXT.opacity, { duration: ANIMATION.durationSlow });
  //     textColor.value = withTiming(0, { duration: ANIMATION.durationSlow });
  //   }
  // }, [nextIndex]);

  // useEffect(() => {
  //   // if overlay is visible, and this prayer is selected
  //   if (overlayVisible && selectedIndex === index) {

  //     if (isNext) {
  //       overlayTodayOpacity.value = 0;
  //     };

  //     // upcoming prayer
  //     if (!isPassed) {
  //       overlayTodayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
  //     };

  //     // tomorrow's prayer
  //     if (isPassed) {
  //       originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
  //       overlayTomorrowOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
  //     };
  //   }

  //   // if overlay is not visible
  //   if (!overlayVisible) {
  //     originalOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(baseOpacity, { duration: ANIMATION.duration }));
  //     overlayTodayOpacity.value = withTiming(0, { duration: ANIMATION.duration })
  //     overlayTomorrowOpacity.value = withTiming(0, { duration: ANIMATION.duration })
  //   };

  // }, [overlayVisible]);

  const mainTextStyle = useAnimatedStyle(() => {
    if (isLastThird) return {
      color: 'white',
      opacity: 1,
    };

    const color = interpolateColor(
      textColor.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    );

    return {
      color,
      opacity: originalOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { width: 95 }]}>
      {/* Main text (non-overlay) */}
      <Animated.Text style={[styles.text, mainTextStyle]}>
        {todayTime}
      </Animated.Text>

      {/* Overlay text - Only shows today's time */}
      <Animated.Text style={[
        styles.text,
        {
          color: COLORS.activePrayer,
          opacity: overlayTodayOpacity,
        }
      ]}>
        {todayTime}
      </Animated.Text>

      {/* Tomorrow text - Only shows when passed */}
      <Animated.Text style={[
        styles.text,
        {
          color: COLORS.activePrayer,
          opacity: overlayTomorrowOpacity,
        }
      ]}>
        {tomorrowTime}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
  },
});