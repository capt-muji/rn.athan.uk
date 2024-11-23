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
  const isPassed = index < nextIndex;
  const colorProgress = useSharedValue(0);

  if (isNext) colorProgress.value = 0.5;
  if (isPassed) colorProgress.value = 1;

  // 1 = is passed
  // 0.5 = is next
  // 0 = is upcoming

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#280a6a1d', '#0048ff', '#280a6a4d']
    ),
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#39158522', '#3053a338', '#3815854d']
    ),
    shadowColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#410a7781', '#0a0a7e', '#410a7781']
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [COLORS.inactiveCardText, '#96c9ffb4', '#5892d0aa']
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
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.85,
    shadowRadius: 15,
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