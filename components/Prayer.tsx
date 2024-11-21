import { StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, PRAYER, ANIMATION } from '@/shared/constants';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import { useAtomValue } from 'jotai';
import { scheduleAtom } from '@/stores/store';

interface Props { index: number; isOverlay?: boolean; }

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, isOverlay = false }: Props) {
  const schedule = useAtomValue(scheduleAtom);

  const isLastThird = schedule.today[index].english.toLowerCase() === 'last third';

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

  const computedStyles: ViewStyle = {};

  return (
    <AnimatedPressable
      ref={viewRef}
      style={styles.container}
    // onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, computedStyles, animatedTextStyle]}> {prayer.english} </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, computedStyles, animatedTextStyle]}> {prayer.arabic} </Animated.Text>
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
    marginLeft: 20,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 13,
  },
});