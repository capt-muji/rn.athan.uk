import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { todaysPrayersAtom, nextPrayerIndexAtom, absoluteActivePrayerMeasurementsAtom, absolutePrayerMeasurementsAtom, overlayVisibleAtom, selectedPrayerIndexAtom, relativePrayerMeasurementsAtom, overlayContentAtom, overlayClosingAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN, PRAYER, ANIMATION } from '@/constants';
import Alert from './Alert';

interface Props {
  index: number;
  isOverlay?: boolean;  // Add this prop
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Prayer({ index, isOverlay = false }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setActiveMeasurements] = useAtom(absoluteActivePrayerMeasurementsAtom);
  const [absolutePrayerMeasurements, setAbsolutePrayerMeasurements] = useAtom(absolutePrayerMeasurementsAtom);
  const [, setRelativePrayerMeasurements] = useAtom(relativePrayerMeasurementsAtom);
  const [, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
  const [overlayClosing] = useAtom(overlayClosingAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const backgroundOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOverlay && overlayClosing) {
      backgroundOpacity.value = withTiming(0, { duration: 300 });
    } else if (isOverlay) {
      backgroundOpacity.value = withTiming(0.60, { duration: 300 });
    }
  }, [isOverlay, overlayClosing]);

  const containerStyle = useAnimatedStyle(() => ({
    // backgroundColor: `rgba(0,0,0,${backgroundOpacity.value})`,
    backgroundColor: `rgba(44,19,84,${backgroundOpacity.value})`,
    borderRadius: PRAYER.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
  }));

  const handleLayout = () => {
    if (!viewRef.current) return;

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
        setActiveMeasurements(windowMeasurements);
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
    // Check if this prayer is already in overlay content
    setOverlayContent(prev => {
      const exists = prev.some(item => item.name === `prayer-${index}`);
      if (exists) return prev;

      return [...prev, {
        name: `prayer-${index}`,
        component: <Prayer index={index} isOverlay={true} />, // Pass isOverlay prop here
        measurements: absolutePrayerMeasurements[index]
      }];
    });
    setOverlayVisible(true);
  };

  const textColor = isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent;

  const animatedStyle = useAnimatedStyle(() => {
    const shouldBeFullOpacity = isPassed || isNext;
    const baseOpacity = shouldBeFullOpacity ? 1 : TEXT.transparent;

    return {
      opacity: withTiming(baseOpacity, { duration: ANIMATION.duration })
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
      <Animated.Text style={[styles.text, styles.time, { color: textColor }, animatedStyle]}>
        {prayer.time}
      </Animated.Text>
      <Alert index={index} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Remove container and overlayContainer styles as they're now handled by containerStyle
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
    marginLeft: 20,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
  time: {
    flex: 1,
    textAlign: 'center',
    marginLeft: 25,
    marginRight: 10,
  }
});
