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

  const originalOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);
  const overlayOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    // is selected
    if (isOverlay) return {
      color: 'white',
      opacity: 1,
    };

    // today and is passed or next
    if (isPassed || isNext) return {
      color: COLORS.textPrimary,
      opacity: originalOpacity.value,
    };

    // today and is not passed or next
    return {
      color: COLORS.textTransparent,
      opacity: originalOpacity.value,
    };
  });

  // const tomorrowAnimatedStyle = useAnimatedStyle(() => {
  //   // is selected
  //   if (isOverlay) return {
  //     color: 'white',
  //     opacity: 0,
  //   };

  //   // is passed or next
  //   if (isPassed || isNext) return {
  //     color: COLORS.textPrimary,
  //     opacity: originalOpacity.value,
  //   };

  //   // is not passed or next
  //   return {
  //     color: COLORS.textTransparent,
  //     opacity: originalOpacity.value,
  //   };
  // });


  useEffect(() => {
    if (isOverlay && selectedPrayerIndex !== -1 && overlayStartOpening && overlayVisibleToggle) {
      originalOpacity.value = withTiming(0, { duration: 5000 });
      overlayOpacity.value = withDelay(150, withTiming(TEXT.opacity, { duration: 5000 }));
    }
  }, [overlayStartOpening]);

  useEffect(() => {
    if (isOverlay && overlayStartClosing) {
      overlayOpacity.value = withTiming(0, { duration: 5000 });
      originalOpacity.value = withDelay(250, withTiming(1, { duration: 5000 }));
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