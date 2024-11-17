import { StyleSheet, View, Pressable } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { prayersTodayAtom, prayersNextIndexAtom, absoluteNextPrayerMeasurementsAtom, absolutePrayerMeasurementsAtom, prayersSelectedIndexAtom, overlayVisibleAtom } from '@/stores/store';
import { COLORS, TEXT, PRAYER, ANIMATION, SCREEN } from '@/shared/constants';
import { PrayerType } from '@/shared/types';
import Alert from './Alert';
import PrayerTime from './PrayerTime';
import usePrayer from '@/hooks/usePrayer';

interface Props {
  index: number;
  isOverlay?: boolean;
  type: PrayerType;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, isOverlay = false, type }: Props) {
  const { schedule, nextIndex } = usePrayer(type);
  const [selectedIndex, setSelectedIndex] = useAtom(selectedIndexAtom);
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);

  const prayer = schedule[index];
  const isPassed = prayer?.passed;
  const isNext = index === nextIndex;

  const textOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);
  const backgroundOpacity = useSharedValue(0);

  // handle non-overlay animations
  useEffect(() => {
    if (isPassed) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    };

    if (index === nextPrayerIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    };
  }, [nextPrayerIndex]);

  // handle overlay animations
  useEffect(() => {
    if (isOverlay && selectedPrayerIndex === nextPrayerIndex) {
      backgroundOpacity.value = 1;
    } else {
      backgroundOpacity.value = 0;
    }
  }, [overlayVisible]);

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;

    viewRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      const setMeasurements = type === 'prayer' ? setPrayerMeasurements : setExtraMeasurements;
      setMeasurements(prev => ({ ...prev, [index]: measurements }));
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isOverlay) {
      setOverlayVisible(false);
      return;
    }

    setSelectedPrayerIndex(index);
    setOverlayVisible(true);
  };

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

  const containerStyle = useAnimatedStyle(() => {
    const baseStyles = {
      borderRadius: PRAYER.borderRadius,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginHorizontal: !isOverlay ? SCREEN.paddingHorizontal : 0,
    };

    return baseStyles;
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  return (
    <AnimatedPressable
      ref={viewRef}
      onLayout={handleLayout}
      style={containerStyle}
      onPress={handlePress}
    >
      <Animated.View style={[styles.background, animatedBackgroundStyle]} />
      <Animated.Text style={[styles.text, styles.english, animatedTextStyle]}> {prayer.english} </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedTextStyle]}> {prayer.arabic} </Animated.Text>
      <PrayerTime index={index} isOverlay={isOverlay} />
      <Alert index={index} isOverlay={isOverlay} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    flex: 1,
    marginLeft: 20,
  },
  arabic: {
    flex: 0.75,
    textAlign: 'right',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: PRAYER.borderRadius,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  }
});