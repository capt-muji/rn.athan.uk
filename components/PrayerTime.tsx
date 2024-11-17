import { StyleSheet, View } from 'react-native';
import { withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { TEXT, ANIMATION, COLORS } from '@/shared/constants';
import { prayersTodayAtom, prayersTomorrowAtom, prayersNextIndexAtom, prayersSelectedIndexAtom, overlayVisibleAtom } from '@/stores/store';
import { useEffect } from 'react';

interface Props {
  index: number;
  isOverlay: boolean;
}

export default function PrayerTime({ index, isOverlay }: Props) {
  const [todaysPrayers] = useAtom(prayersTodayAtom);
  const [tomorrowsPrayers] = useAtom(prayersTomorrowAtom);
  const [nextPrayerIndex] = useAtom(prayersNextIndexAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [selectedPrayerIndex] = useAtom(prayersSelectedIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const todayTime = todaysPrayers[index].time;
  const tomorrowTime = tomorrowsPrayers[selectedPrayerIndex]?.time;

  const baseOpacity = isPassed || isNext ? 1 : TEXT.opacity;

  const originalOpacity = useSharedValue(baseOpacity);
  const overlayTodayOpacity = useSharedValue(0);
  const overlayTomorrowOpacity = useSharedValue(0);

  useEffect(() => {
    if (index === nextPrayerIndex) {
      originalOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else if (!isPassed) {
      originalOpacity.value = TEXT.opacity;
    }
  }, [nextPrayerIndex]);

  useEffect(() => {
    // if overlay is visible, and this prayer is selected
    if (overlayVisible && selectedPrayerIndex === index) {

      if (isNext) {
        overlayTodayOpacity.value = 0;
      };

      // upcoming prayer
      if (!isPassed) {
        overlayTodayOpacity.value = withTiming(1, { duration: ANIMATION.duration });
      };

      // tomorrow's prayer
      if (isPassed) {
        originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
        overlayTomorrowOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
      };
    }

    // if overlay is not visible
    if (!overlayVisible) {
      originalOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(baseOpacity, { duration: ANIMATION.duration }));
      overlayTodayOpacity.value = withTiming(0, { duration: ANIMATION.duration })
      overlayTomorrowOpacity.value = withTiming(0, { duration: ANIMATION.duration })
    };

  }, [overlayVisible]);

  return (
    <View style={styles.container}>
      {/* Main text (non-overlay) */}
      <Animated.Text style={[
        styles.text,
        {
          color: isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent,
          opacity: originalOpacity,
        }
      ]}>
        {todayTime}
      </Animated.Text>

      {/* Overlay text - Only shows today's time */}
      <Animated.Text style={[
        styles.text,
        {
          color: COLORS.textPrimary,
          opacity: overlayTodayOpacity,
        }
      ]}>
        {todayTime}
      </Animated.Text>

      {/* Tomorrow text - Only shows when passed */}
      <Animated.Text style={[
        styles.text,
        {
          color: COLORS.textPrimary,
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
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
    paddingLeft: 25,
  },
});