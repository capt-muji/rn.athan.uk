import { StyleSheet, View } from 'react-native';
import { withTiming, useSharedValue, withDelay } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { TEXT, ANIMATION, COLORS, PRAYERS_ENGLISH } from '@/shared/constants';
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { scheduleAtom } from '@/stores/store';

interface Props { index: number; isOverlay: boolean; }

export default function PrayerTime({ index, isOverlay = false }: Props) {
  const isLastThird = index === PRAYERS_ENGLISH.length - 1;
  const { today, tomorrow, nextIndex, selectedIndex } = useAtomValue(scheduleAtom);

  const overlayVisible = false;

  const isPassed = index < nextIndex
  const isNext = index === nextIndex;
  const todayTime = today[index].time;
  const tomorrowTime = tomorrow[selectedIndex]?.time;

  const baseOpacity = isPassed || isNext ? 1 : TEXT.opacity;

  const originalOpacity = useSharedValue(baseOpacity);
  const overlayTodayOpacity = useSharedValue(0);
  const overlayTomorrowOpacity = useSharedValue(0);

  useEffect(() => {
    if (index === nextIndex) {
      originalOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else if (!isPassed) {
      originalOpacity.value = TEXT.opacity;
    }
  }, [nextIndex]);

  useEffect(() => {
    // if overlay is visible, and this prayer is selected
    if (overlayVisible && selectedIndex === index) {

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

  const computedStyles = {
    color: isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent,
    opacity: originalOpacity,
  };

  if (isLastThird) {
    originalOpacity.value = 1;
    computedStyles.color = 'white';
  }

  return (
    <View style={[styles.container, { width: 95 }]}>
      {/* Main text (non-overlay) */}
      <Animated.Text style={[styles.text, computedStyles]}>
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