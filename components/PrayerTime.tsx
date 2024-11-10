import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { TEXT, ANIMATION, COLORS } from '@/constants';
import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, selectedPrayerIndexAtom, overlayVisibleToggleAtom, overlayStartOpeningAtom, overlayStartClosingAtom, overlayContentAtom } from '@/store/store';
import { useEffect } from 'react';

interface Props {
  index: number;
  isOverlay: boolean;
}

export default function PrayerTime({ index, isOverlay }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex, setSelectedPrayerIndexAtom] = useAtom(selectedPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [overlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [overlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const todayTime = todaysPrayers[index].time;
  const tomorrowTime = tomorrowsPrayers[index]?.time;

  const originalOpac = !isOverlay && (isPassed || isNext) ? 1 : TEXT.opacity;

  const originalOpacity = useSharedValue(originalOpac);
  const overlayOpacity = useSharedValue(isOverlay ?
    (isPassed ? 0 : TEXT.opacity) :
    originalOpacity.value
  );

  const animatedStyle = useAnimatedStyle(() => {
    // is selected
    if (isOverlay) {
      if (isPassed) {
        return {
          color: 'white',
          opacity: overlayOpacity.value  // Changed from originalOpacity to overlayOpacity
        }
      }

      return {
        color: 'white',
        opacity: overlayOpacity.value  // Changed from originalOpacity to overlayOpacity
      };
    }

    // today and is passed next
    if (isPassed || isNext) {
      return {
        // color: COLORS.textPrimary,
        color: 'white',
        opacity: originalOpacity.value,
      };
    }

    // today and is not passed or next
    return {
      color: COLORS.textTransparent,
      // color: 'red',
      opacity: originalOpacity.value,
    };
  });

  useEffect(() => {
    if (isOverlay) {
      if (isPassed) {
        overlayOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION.duration }));
        return;
      }

      // Don't set initial value, just animate from TEXT.opacity to 1
      overlayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
      return;
    }

    if (!isOverlay) {
      if (overlayVisibleToggle && selectedPrayerIndex === index) {
        if (isPassed) {
          originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
          return;
        }
        originalOpacity.value = 1;
        return;
      }
    }
  }, [overlayStartOpening]);

  useEffect(() => {
    if (isOverlay && !overlayVisibleToggle) {
      overlayOpacity.value = withTiming(0, { duration: ANIMATION.duration });
    }

    if (!isOverlay) {
      // Restore original opacity based on isPassed or isNext state
      const targetOpacity = (isPassed || isNext) ? 1 : TEXT.opacity;
      originalOpacity.value = withDelay(250, withTiming(targetOpacity, { duration: ANIMATION.duration }));
    }
  }, [overlayStartClosing]);

  const time = () => {
    if (isOverlay) {
      if (isPassed) {
        return tomorrowTime;
      }
      return todayTime;
    }
    return todayTime;
  }
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