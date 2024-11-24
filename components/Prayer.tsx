import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withDelay, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, PRAYER, ANIMATION } from '@/shared/constants';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom, dateAtom } from '@/stores/store';
import { getCascadeDelay, } from '@/shared/prayer';
import { isTimePassed, } from '@/shared/time';
import { ScheduleType } from '@/shared/types';

interface Props {
  index: number;
  type: ScheduleType;
  inactiveColor?: string;
  isOverlay?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, type, inactiveColor, isOverlay = false }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  const prayer = schedule.today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === schedule.nextIndex;

  const viewRef = useRef<View>(null);

  const colorProgress = useSharedValue(isPassed || isNext ? 1 : 0);

  // handle non-overlay animations
  useEffect(() => {
    if (isNext) {
      colorProgress.value = withDelay(ANIMATION.duration, withTiming(1, { duration: ANIMATION.durationSlow }));
      // } else if (schedule.nextIndex === PRAYER_INDEX_FAJR && isLastThird) {
      // colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlowest });
      // } else if (schedule.nextIndex !== PRAYER_INDEX_FAJR && isLastThird) {
      // colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlowest });
    };
  }, [schedule.nextIndex]);

  useEffect(() => {
    if (index !== schedule.nextIndex && schedule.today[0].date !== date.current) {
      colorProgress.value = withDelay(
        getCascadeDelay(index),
        withTiming(0, { duration: ANIMATION.durationSlow })
      );
    }
  }, [date.current]);



  // handle overlay animations
  // useEffect(() => {
  //   if (isOverlay && schedule.selectedIndex === schedule.nextIndex) {
  //     backgroundOpacity.value = 1;
  //   } else {
  //     backgroundOpacity.value = 0;
  //   }
  // }, [isOverlayOn]);

  // const handlePress = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  //   if (isOverlay) {
  //     app.setIsOverlayOn(false);
  //     return;
  //   }

  //   app.setIsOverlayOn(true);
  // };

  const animatedStyle = useAnimatedStyle(() => {
    // if (isOverlay) return {
    //   color: COLORS.activePrayer,
    // };

    return {
      color: interpolateColor(
        colorProgress.value,
        [0, 1],
        [inactiveColor || COLORS.inactivePrayer, COLORS.activePrayer]
      ),
    };
  });

  return (
    <AnimatedPressable
      ref={viewRef}
      style={styles.container}
    // onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, animatedStyle]}>{prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedStyle]}>{prayer.arabic}</Animated.Text>
      <PrayerTime index={index} isOverlay={isOverlay} type={type} inactiveColor={inactiveColor} />
      <Alert index={index} isOverlay={isOverlay} type={type} inactiveColor={inactiveColor} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PRAYER.height,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    paddingLeft: PRAYER.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 15,
  },
});