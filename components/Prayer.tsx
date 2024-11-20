import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, PRAYER, ANIMATION, SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';

interface Props {
  index: number;
  type: ScheduleType;
  isOverlay?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, type, isOverlay = false }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const isOverlayOn = false;

  const prayer = schedule.today[index];
  const isPassed = index < schedule.nextIndex
  const isNext = index === schedule.nextIndex;

  const viewRef = useRef<View>(null);

  const textOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);
  const backgroundOpacity = useSharedValue(0);

  // handle non-overlay animations
  useEffect(() => {
    if (isPassed) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    };

    if (isNext) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    };
  }, [schedule.nextIndex]);

  // handle overlay animations
  useEffect(() => {
    if (isOverlay && schedule.selectedIndex === schedule.nextIndex) {
      backgroundOpacity.value = 1;
    } else {
      backgroundOpacity.value = 0;
    }
  }, [isOverlayOn]);

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;

    viewRef.current.measureInWindow((x, y, width, height) => {
      const measurement = { pageX: x, pageY: y, width, height };
      // setMeasurements({ ...measurements, [index]: measurement });
    });
  };

  // const handlePress = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  //   if (isOverlay) {
  //     app.setIsOverlayOn(false);
  //     return;
  //   }

  //   app.setIsOverlayOn(true);
  // };

  const animatedTextStyle = useAnimatedStyle(() => {
    if (isOverlay) return {
      color: 'white',
      opacity: 1,
    };

    if (isPassed || isNext) return {
      color: COLORS.textPrimary,
      opacity: textOpacity.value,
    };

    return {
      color: COLORS.textTransparent,
      opacity: textOpacity.value,
    };
  });

  return (
    <AnimatedPressable
      ref={viewRef}
      onLayout={handleLayout}
      style={styles.container}
    // onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, animatedTextStyle]}> {prayer.english} </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedTextStyle]}> {prayer.arabic} </Animated.Text>
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
    marginLeft: 20,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 13,
  },
});