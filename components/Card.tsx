import { View, StyleSheet, Text } from 'react-native';
import Prayer from './Prayer';
import { TEXT, PRAYER, SCREEN, COLORS, PRAYER_INDEX_LAST_THIRD, ANIMATION, PRAYER_INDEX_FAJR } from '@/shared/constants';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom } from '@/stores/store';
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScheduleType } from '@/shared/types';

export default function Card() {
  const schedule = useAtomValue(extraScheduleAtom);

  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (schedule.nextIndex === 0) {
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlowest });
    } else {
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlowest });
    }
  }, [schedule.nextIndex]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [COLORS.inactivePrayer, '#8eaff1aa']
    ),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: colorProgress.value,
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#4d26a74d', '#5230b13e']
      // ['#4d26a74d', '#0d0226d2']
    ),
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#5330a338', '#6941c63f']
      // ['#5330a338', '#6941c63f']
    ),
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={styles.heading}>
        <Animated.Text style={[styles.text, animatedTextStyle]}>Fri, 20th</Animated.Text>
        <Animated.Text style={[styles.text, animatedTextStyle]}>8h 32m 28s</Animated.Text>
      </View>
      <Prayer type={ScheduleType.Extra} index={PRAYER_INDEX_LAST_THIRD} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
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
  },
});