import { StyleSheet, View, Pressable } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, absoluteNextPrayerMeasurementsAtom, absolutePrayerMeasurementsAtom, selectedPrayerIndexAtom, overlayControlsAtom, overlayVisibleToggleAtom } from '@/store/store';
import { COLORS, TEXT, PRAYER, ANIMATION, SCREEN, OVERLAY } from '@/constants';
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
  const [, setAbsolutePrayerMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [, setNextPrayerMeasurements] = useAtom(absoluteNextPrayerMeasurementsAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setOverlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const tomorrowPrayer = tomorrowsPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const textOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);

  useEffect(() => {
    if (index === nextPrayerIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    } else if (!isPassed) {
      textOpacity.value = TEXT.opacity;
    }
  }, [nextPrayerIndex]);

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;

    viewRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };

      setAbsolutePrayerMeasurements(prev => {
        const newMeasurements = [...prev];
        newMeasurements[index] = measurements;
        return newMeasurements;
      });

      if (isNext) {
        setNextPrayerMeasurements(measurements);
      }
    });
  };

  const handlePress = () => {
    if (isOverlay) {
      setOverlayVisibleToggle(false);
      return;
    }

    setSelectedPrayerIndex(index);
    setOverlayVisibleToggle(true);
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

  return (
    <AnimatedPressable
      ref={viewRef}
      onLayout={handleLayout}
      style={[
        styles.container,
        !isOverlay && styles.spacing,
      ]}
      onPress={handlePress}
    >
      <Animated.Text style={[styles.text, styles.english, animatedTextStyle]}>
        {prayer.english}
      </Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, animatedTextStyle]}>
        {prayer.arabic}
      </Animated.Text>
      <PrayerTime index={index} isOverlay={isOverlay} />
      <Alert index={index} isOverlay={isOverlay} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: PRAYER.borderRadius,
    flexDirection: 'row',
    alignItems: 'center'
  },
  spacing: {
    marginHorizontal: SCREEN.paddingHorizontal,
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