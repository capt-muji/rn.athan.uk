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

  const backgroundOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOverlay) {
      backgroundOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOverlay]);

  const isSelected = isOverlay && index === selectedPrayerIndex;

  const containerStyle = useAnimatedStyle(() => ({
    borderRadius: PRAYER.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    ...(isSelected && isNext && {
      backgroundColor: COLORS.primary,
      shadowColor: COLORS.primaryShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
    })
  }));

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
      const exists = prev.some(item => item.name === `prayer-${index}`);
      if (exists) return prev;

      return [...prev, {
        name: `prayer-${index}`,
        component: <Prayer index={index} isOverlay={true} />,
        measurements: absolutePrayerMeasurements[index]
      }];
    });
    setOverlayVisibleToggle(true);
  };

  // Update the textColor logic
  const textColor = isSelected
    ? 'white'
    : isPassed || isNext
      ? COLORS.textPrimary
      : COLORS.textTransparent;

  const animatedStyle = useAnimatedStyle(() => {
    if (!isOverlay) {
      return {
        opacity: isPassed || isNext ? 1 : TEXT.transparent
      };
    }

    // Skip animation for non-visible prayers
    if (!isPassed && !isNext && !isSelected) {
      return {
        opacity: 0
      };
    }

    // Skip animation for passed/next prayers in overlay
    if (isPassed || isNext) {
      return {
        opacity: 1
      };
    }

    return {
      opacity: withTiming(
        overlayVisibleToggle ? 1 : 0,
        { duration: ANIMATION.duration }
      )
    };
  });

  return (
    <AnimatedPressable
      ref={viewRef}
      onLayout={handleLayout}
      style={containerStyle}
      onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, { color: textColor }, animatedStyle]}>
        {prayer.english}
      </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, { color: textColor }, animatedStyle]}>
        {prayer.arabic}
      </Animated.Text>
      <PrayerTime
        index={index}
        isOverlay={isOverlay}
        isSelected={isSelected}
      />
      <Alert
        index={index}
        isOverlay={isOverlay}
        isSelected={isSelected}
      />
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
    flex: 1,
    textAlign: 'right',
  }
});
