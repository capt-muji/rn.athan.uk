import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withDelay, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, PRAYER, ANIMATION, PRAYERS_ENGLISH, PRAYER_INDEX_LAST_THIRD, PRAYER_INDEX_FAJR } from '@/shared/constants';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { getCascadeDelay } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';

interface Props {
  index: number;
  type: ScheduleType;
  isOverlay?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, type, isOverlay = false }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const prayer = schedule.today[index];
  const isPassed = index < schedule.nextIndex
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
    } else if (schedule.nextIndex === 0) {
      colorProgress.value = withDelay(
        getCascadeDelay(index),
        withTiming(0, { duration: ANIMATION.durationSlow })
      );
    }
  }, [schedule.nextIndex]);

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
    if (isOverlay) return {
      color: COLORS.activePrayer,
    };

    const cardInactiveColor = COLORS.inactiveCardText;
    const x = isStandard ? COLORS.inactivePrayer : cardInactiveColor;
    return {
      color: interpolateColor(
        colorProgress.value,
        [0, 1],
        [x, COLORS.activePrayer]
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
      <PrayerTime index={index} isOverlay={isOverlay} type={type} />
      <Alert index={index} isOverlay={isOverlay} type={type} />
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