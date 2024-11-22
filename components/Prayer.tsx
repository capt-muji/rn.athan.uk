import { StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withDelay, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, PRAYER, ANIMATION, PRAYERS_ENGLISH } from '@/shared/constants';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import { useAtomValue } from 'jotai';
import { scheduleAtom } from '@/stores/store';
import { getCascadeDelay } from '@/shared/prayer';

interface Props { index: number; isOverlay?: boolean; }

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, isOverlay = false }: Props) {
  const schedule = useAtomValue(scheduleAtom);

  const prayer = schedule.today[index];
  const isPassed = index < schedule.nextIndex
  const isNext = index === schedule.nextIndex;
  const isLastThird = index === PRAYERS_ENGLISH.length - 1;

  const viewRef = useRef<View>(null);

  const textOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);
  const textColor = useSharedValue(isPassed || isNext ? 1 : 0);

  // handle non-overlay animations
  useEffect(() => {
    if (schedule.nextIndex === 0) {
      textOpacity.value = withDelay(
        getCascadeDelay(index),
        withTiming(TEXT.opacity, { duration: ANIMATION.durationSlow })
      );
      textColor.value = withDelay(
        getCascadeDelay(index),
        withTiming(0, { duration: ANIMATION.durationSlow })
      );
      return;
    }

    if (isPassed) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
      textColor.value = withTiming(1, { duration: ANIMATION.duration });
      return;
    }

    if (isNext) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
      textColor.value = withTiming(1, { duration: ANIMATION.durationSlow });
      return;
    }

    textOpacity.value = withTiming(TEXT.opacity, { duration: ANIMATION.durationSlow });
    textColor.value = withTiming(0, { duration: ANIMATION.durationSlow });
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

  const animatedTextStyle = useAnimatedStyle(() => {
    if (isOverlay || isLastThird) return {
      color: COLORS.activePrayer,
      opacity: 1,
    };

    const color = interpolateColor(
      textColor.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    );

    return {
      color,
      opacity: textOpacity.value,
    };
  });

  return (
    <AnimatedPressable
      ref={viewRef}
      style={styles.container}
    // onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, animatedTextStyle]}>{prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedTextStyle]}>{prayer.arabic}</Animated.Text>
      <PrayerTime index={index} isOverlay={isOverlay} />
      <Alert index={index} isOverlay={isOverlay} />
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
    paddingRight: 13,
  },
});