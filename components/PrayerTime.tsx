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
  const [lastSelectedPrayerIndex] = useAtom(lastSelectedPrayerIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const todayTime = todaysPrayers[index].time;
  const tomorrowTime = tomorrowsPrayers[index]?.time;

  const overlayOpacity = useSharedValue(isOverlay ? 1 : 0);
  const mainOpacity = useSharedValue(isPassed ? 1 : (isPassed || isNext ? 1 : TEXT.opacity));

  useEffect(() => {
    overlayOpacity.value = withSpring(isOverlay ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 100,
    });
  }, [isOverlay]);

  useEffect(() => {
    if (isPassed) {
      if (overlayVisibleToggle && index === selectedPrayerIndex) {
        // Hide immediately when selected and overlay opens
        mainOpacity.value = withSpring(0, {
          mass: 1,
          damping: 15,
          stiffness: 100,
        });
      } else if (!overlayVisibleToggle && index === lastSelectedPrayerIndex) {
        // Show with delay only when overlay closes and this was the last selected
        mainOpacity.value = withDelay(
          500,
          withSpring(1, {
            mass: 1,
            damping: 15,
            stiffness: 100,
          })
        );
      } else if (!overlayVisibleToggle && index === selectedPrayerIndex) {
        // Reset opacity when selecting a new prayer
        mainOpacity.value = withSpring(1, {
          mass: 1,
          damping: 15,
          stiffness: 100,
        });
      }
    }
  }, [overlayVisibleToggle, isPassed, selectedPrayerIndex, lastSelectedPrayerIndex]);

  return (
    <View style={styles.container}>
      {/* Main text (non-overlay) */}
      <Animated.Text style={[
        styles.text,
        {
          color: isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent,
          opacity: mainOpacity,
        }
      ]}>
        {todayTime}
      </Animated.Text>

      {/* Overlay text */}
      <Animated.Text style={[
        styles.text,
        styles.overlay,
        {
          opacity: overlayOpacity,
          color: COLORS.textPrimary,
        }
      ]}>
        {isPassed ? tomorrowTime : todayTime}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
  },
  today: {
  },
  overlay: {
  },
});