import { StyleSheet, View, Pressable } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, runOnJS } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';

import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, absoluteNextPrayerMeasurementsAtom, absolutePrayerMeasurementsAtom, overlayVisibleToggleAtom, selectedPrayerIndexAtom, relativePrayerMeasurementsAtom, overlayContentAtom, overlayStartOpeningAtom } from '@/store/store';
import { COLORS, TEXT, PRAYER, ANIMATION } from '@/constants';
import Alert from './Alert';
import PrayerTime from './PrayerTime';

interface Props {
  index: number;
  isOverlay?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, isOverlay = false }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [absolutePrayerMeasurements, setAbsolutePrayerMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [, setNextPrayerMeasurements] = useAtom(absoluteNextPrayerMeasurementsAtom);
  const [, setRelativePrayerMeasurements] = useAtom(relativePrayerMeasurementsAtom);
  const [, setOverlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [, setOverlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const tomorrowPrayer = tomorrowsPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const textOpacity = useSharedValue(isPassed ? 1 : TEXT.opacity);

  // fade next prayer text opacity when it becomes the next prayer
  useEffect(() => {
    if (index === nextPrayerIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    } else if (!isPassed) {
      textOpacity.value = TEXT.opacity;
    }
  }, [nextPrayerIndex]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (!isOverlay || !isNext) return {};

    // apply blue background to next prayer on overlay
    return {
      backgroundColor: COLORS.primary,
      shadowColor: COLORS.primaryShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
    };
  });

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;  // Add isOverlay check here

    // Measure absolute window coordinates to display text in overlay
    viewRef.current.measureInWindow((x, y, width, height) => {
      const windowMeasurements = {
        pageX: x,
        pageY: y,
        width,
        height
      };

      setAbsolutePrayerMeasurements(prev => {
        const measurements = [...prev];
        measurements[index] = windowMeasurements;
        return measurements;
      });

      if (isNext) {
        setNextPrayerMeasurements(windowMeasurements);
      }
    });

    // Measure relative coordinates for active background
    viewRef.current.measure((x, y, width, height) => {
      setRelativePrayerMeasurements(prev => {
        const relativeMeasurements = [...prev];
        relativeMeasurements[index] = {
          x,
          y,
          width,
          height,
          name: prayer.english
        };
        return relativeMeasurements;
      });
    });
  };

  const handlePress = () => {
    if (selectedPrayerIndex !== -1) return;
    setSelectedPrayerIndex(index);

    setOverlayContent(prev => {
      return [...prev, {
        name: `prayer-${index}`,
        component: <Prayer index={index} isOverlay={true} />,
        measurements: absolutePrayerMeasurements[index]
      }];
    });
    setOverlayVisibleToggle(true);
  };

  const animatedTextStyle = useAnimatedStyle(() => {
    // is selected
    if (isOverlay) return {
      color: 'white',
      opacity: 1,
    };

    // is passed or next
    if (isPassed || isNext) return {
      color: COLORS.textPrimary,
      opacity: textOpacity.value,
    };

    // is not passed or next
    return {
      color: COLORS.textTransparent,
      opacity: textOpacity.value,
    };
  });

  return (
    <AnimatedPressable
      ref={viewRef}
      onLayout={handleLayout}
      style={[styles.container, animatedContainerStyle]}
      onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, animatedTextStyle]}>
        {prayer.english}
      </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedTextStyle]}>
        {prayer.arabic}
      </Animated.Text>
      <PrayerTime
        index={index}
        isOverlay={isOverlay}
      />
      <Alert
        index={index}
        isOverlay={isOverlay}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: PRAYER.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    flex: 1,
    marginLeft: 20,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  }
});
