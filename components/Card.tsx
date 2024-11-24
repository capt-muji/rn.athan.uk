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
  const { nextIndex } = useAtomValue(extraScheduleAtom);

  const isNext = index === nextIndex;
  const isPassed = index < nextIndex;
  const colorProgress = useSharedValue(0);

  if (isNext) colorProgress.value = 0.5;
  if (isPassed) colorProgress.value = 1;

  const colors = {
    heading: {
      passed: '#37618faa',
      next: '#96c9ffb4',
      upcoming: '#5282b555'
    },
    text: {
      passed: 'red',
      next: 'green',
      upcoming: '#5282b555'
    },
    background: {
      passed: '#280a6a1d',
      next: '#0048ff',
      upcoming: '#2d11831d'
    },
    shadow: {
      passed: '#060127',
      next: '#0a0a7e',
      upcoming: '#0400249c'
    },
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [colors.background.upcoming, colors.background.next, colors.background.passed]
    ),
    shadowColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [colors.shadow.upcoming, colors.shadow.next, colors.shadow.passed]
    ),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      [colors.heading.upcoming, colors.heading.next, colors.heading.passed]
    ),
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={styles.heading}>
        <Animated.Text style={[styles.text, animatedTextStyle]}>Friday</Animated.Text>
        <Animated.Text style={[styles.text, animatedTextStyle]}>Nov 20</Animated.Text>
      </View>
      <Prayer type={ScheduleType.Extra} index={index} inactiveColor={colors.text.upcoming} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...PRAYER.border,
    marginHorizontal: SCREEN.paddingHorizontal,
    shadowOffset: { width: 1, height: 10 },
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