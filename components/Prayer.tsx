import { StyleSheet, View, Pressable } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { todaysPrayersAtom, tomorrowsPrayersAtom, nextPrayerIndexAtom, absoluteNextPrayerMeasurementsAtom, absolutePrayerMeasurementsAtom, overlayVisibleToggleAtom, selectedPrayerIndexAtom, relativePrayerMeasurementsAtom, overlayContentAtom, overlayStartOpeningAtom, lastSelectedPrayerIndexAtom, overlayControlsAtom } from '@/store/store';
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
  const [, setLastSelectedPrayerIndex] = useAtom(lastSelectedPrayerIndexAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
  const [overlayControls] = useAtom(overlayControlsAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const tomorrowPrayer = tomorrowsPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const textOpacity = useSharedValue(isPassed || isNext ? 1 : TEXT.opacity);

  useEffect(() => {
    // Update text opacity only
    if (index === nextPrayerIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    } else if (!isPassed) {
      textOpacity.value = TEXT.opacity;
    }
  }, [nextPrayerIndex]);

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;

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
    if (isOverlay) {
      overlayControls.close?.();
      return;
    }

    // Remove the selectedPrayerIndex check to allow re-clicking
    setSelectedPrayerIndex(index);
    setLastSelectedPrayerIndex(index);

    setOverlayContent([{
      name: `prayer-${index}`,
      component: <Prayer index={index} isOverlay={true} />,
      measurements: absolutePrayerMeasurements[index]
    }]);

    overlayControls.open?.();
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
      style={[styles.container]}
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
