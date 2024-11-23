import { View, StyleSheet, Text } from 'react-native';
import Prayer from './Prayer';
import { TEXT, PRAYER, SCREEN, COLORS, PRAYER_INDEX_LAST_THIRD, ANIMATION, PRAYER_INDEX_FAJR } from '@/shared/constants';
import { useAtomValue } from 'jotai';
import { scheduleAtom } from '@/stores/store';
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function PrayerLastThird() {
  const schedule = useAtomValue(scheduleAtom);

  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (schedule.nextIndex === PRAYER_INDEX_FAJR) {
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else {
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlow });
    }
  }, [schedule.nextIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [COLORS.inactivePrayer, '#a0bcf487']
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Animated.Text style={[styles.text, animatedStyle]}>Fri, 20th</Animated.Text>
        <Animated.Text style={[styles.text, animatedStyle]}>8h 32m 28s</Animated.Text>
      </View>
      <Prayer index={PRAYER_INDEX_LAST_THIRD} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    backgroundColor: '#6941c63f',
    borderColor: '#6941c64a',
    borderWidth: 1,
    ...PRAYER.border,
    ...PRAYER.shadow,
  },
  heading: {
    paddingTop: 15,
    paddingLeft: PRAYER.padding.left,
    paddingRight: PRAYER.padding.right,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    letterSpacing: 0.5,
    fontSize: TEXT.sizeSmaller,
    // color: '#a0bcf487',
    color: COLORS.inactivePrayer
  },
});