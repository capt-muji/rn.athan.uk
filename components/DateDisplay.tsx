import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayContentAtom, overlayVisibleAtom, overlayClosingAtom, PageCoordinates, selectedPrayerIndexAtom, todaysPrayersAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT, ANIMATION } from '@/constants';
import Masjid from './Masjid';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface DateDisplayProps {
  isOverlay?: boolean;
}

export default function DateDisplay({ isOverlay = false }: DateDisplayProps) {
  const [_, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayClosing] = useAtom(overlayClosingAtom);
  const [__, setOverlayContent] = useAtom(overlayContentAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const dateRef = useRef<Text>(null);
  const measurementsRef = useRef<PageCoordinates | null>(null);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const baseTextOpacity = useSharedValue(1);
  const overlayTextOpacity = useSharedValue(0);

  useEffect(() => {
    if (overlayVisible && !isOverlay) {
      baseTextOpacity.value = withTiming(0, { duration: ANIMATION.duration });
    } else if (!overlayVisible && !isOverlay) {
      baseTextOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    }
  }, [overlayVisible, isOverlay]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayClosing ? withTiming(0, { duration: ANIMATION.duration }) : withTiming(1, { duration: ANIMATION.duration })
  }));

  useEffect(() => {
    if (overlayVisible && selectedPrayerIndex !== null) {
      const prayer = todaysPrayers[selectedPrayerIndex];
      if (!prayer) return;

      setOverlayContent(prev => {
        const exists = prev.some(item => item.name === 'date');
        if (exists) return prev;

        return [...prev, {
          name: 'date',
          component: (
            <Animated.Text style={[
              styles.date,
              {
                color: COLORS.textSecondary,
                opacity: overlayClosing ? 0 : 0.5
              }
            ]}>
              {prayer.passed ? 'Tomorrow' : 'Today'}
            </Animated.Text>
          ),
          measurements: measurementsRef.current!
        }];
      });
    }
  }, [overlayVisible, selectedPrayerIndex]);

  const handleLayout = () => {
    if (!dateRef.current) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      measurementsRef.current = measurements;
      setDateMeasurements(measurements);
    });
  };

  const dateTextStyle = useAnimatedStyle(() => ({
    color: isOverlay || (overlayVisible && !overlayClosing) ? COLORS.textSecondary : COLORS.textPrimary,
    opacity: isOverlay ? overlayTextOpacity.value : baseTextOpacity.value
  }));

  const getDisplayText = () => {
    if (!isOverlay) return formattedDate;
    if (selectedPrayerIndex === null) return formattedDate;

    const prayer = todaysPrayers[selectedPrayerIndex];
    return prayer?.passed ? 'Tomorrow' : 'Today';
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text
          ref={dateRef}
          onLayout={handleLayout}
          style={[styles.date, dateTextStyle]}
        >
          {formattedDate}
        </Animated.Text>
      </View>
      <Masjid />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN.paddingHorizontal,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size - 2,
    fontFamily: TEXT.famiy.regular,
    marginBottom: 5,
    opacity: TEXT.opacity
  },
  date: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});
