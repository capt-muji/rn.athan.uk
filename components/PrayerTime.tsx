import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
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
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [lastSelectedPrayerIndex] = useAtom(lastSelectedPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [overlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [overlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [overlayFinishedClosing] = useAtom(overlayFinishedClosingAtom);

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
          color: 'yellow',
          opacity: overlayOpacity.value
        }
      }

      if (isNext) {
        return {
          // color: COLORS.textPrimary,
          color: 'black',
          opacity: overlayOpacity.value,
        };
      }

      return {
        // color: COLORS.textPrimary,
        color: 'orange',
        opacity: overlayOpacity.value
      };
    }

    if (isPassed) {
      return {
        // color: COLORS.textPrimary,
        color: 'blue',
        opacity: originalOpacity.value,
      };
    }

    if (isNext) {
      return {
        // color: COLORS.textPrimary,
        color: 'cyan',
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
    if (!isOverlay) {
      if (!isPassed && !isNext && overlayVisibleToggle && selectedPrayerIndex === index) {
        originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
        return;
      }
    }

    if (isOverlay) {
      if (isPassed) {
        overlayOpacity.value = withDelay(150, withTiming(1, { duration: ANIMATION.duration }));
        return;
      }

      if (isNext) {
        overlayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
        return;
      }

      overlayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    }
  }, [overlayStartOpening]);

  useEffect(() => {
    if (isOverlay && !overlayVisibleToggle) {
      overlayOpacity.value = withTiming(TEXT.opacity, { duration: ANIMATION.duration });
    }

    if (!isOverlay) {
      console.log('NOT OVERLAY');
      const targetOpacity = (isPassed || isNext) ? 1 : TEXT.opacity;

      if (overlayStartClosing && !overlayFinishedClosing && isPassed && lastSelectedPrayerIndex === index) {
        console.log(prayer.english);
        console.log('first', originalOpacity.value);

        // Set initial opacity to 0 using withTiming for proper animation
        originalOpacity.value = withTiming(0, {
          duration: 0,  // immediate
        }, () => {
          console.log('second', originalOpacity.value);
          // After setting to 0, animate to target opacity with delay
          originalOpacity.value = withDelay(
            250,
            withTiming(targetOpacity, { duration: ANIMATION.duration })
          );
          console.log('third', originalOpacity.value);
        });
      } else {
        originalOpacity.value = withTiming(targetOpacity, { duration: ANIMATION.duration });
      }
    }
  }, [overlayStartClosing, isOverlay, overlayVisibleToggle]);

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