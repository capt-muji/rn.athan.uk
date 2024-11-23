import { View, StyleSheet, Text } from 'react-native';
import Prayer from './Prayer';
import { TEXT, PRAYER, SCREEN, COLORS, PRAYER_INDEX_LAST_THIRD, ANIMATION, PRAYER_INDEX_FAJR } from '@/shared/constants';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom } from '@/stores/store';
import { useEffect } from 'react';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScheduleType } from '@/shared/types';

interface Props { index: number }

export default function Card({ index }: Props) {
  const schedule = useAtomValue(extraScheduleAtom);

  const nextIndex = 1;
  const isNext = index === nextIndex;
  const isPassed = index < 2;
  const colorProgress = useSharedValue(0);

  if (isNext) {
    colorProgress.value = 0.5;
  }

  if (isPassed) {
    colorProgress.value = 1;
  }

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#4d26a74d', '#264aa74d', '#26a7534d']
    ),
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#5330a338', '#3053a338', '#30a35338']
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [COLORS.inactivePrayer, 'red', 'blue']
    ),
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={styles.heading}>
        <Animated.Text style={[styles.text, animatedTextStyle]}>Fri, 20th</Animated.Text>
        <Animated.Text style={[styles.text, animatedTextStyle]}>8h 32m 28s</Animated.Text>
      </View>
      <Prayer type={ScheduleType.Extra} index={index} />
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