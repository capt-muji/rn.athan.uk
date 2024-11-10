import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayContentAtom, overlayVisibleAtom, PageCoordinates, selectedPrayerIndexAtom, todaysPrayersAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT, ANIMATION } from '@/constants';
import Masjid from './Masjid';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface DateDisplayProps {
  isOverlay?: boolean;
}

export default function DateDisplay({ isOverlay = false }: DateDisplayProps) {
  const [, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
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

  useEffect(() => {
    if (!isOverlay && baseTextStyle?.opacity) {
      baseTextStyle.opacity = withTiming(overlayVisible ? 0 : 1, { duration: ANIMATION.duration });
    }
  }, [overlayVisible, isOverlay]);

  const overlayTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(overlayVisible ? TEXT.opacity : 0, {
      duration: ANIMATION.duration
    }),
    color: COLORS.textSecondary,
  }));

  const baseTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(overlayVisible ? 0 : 1, {
      duration: ANIMATION.duration
    }),
    color: COLORS.textPrimary,
  }));

  useEffect(() => {
    if (overlayVisible && selectedPrayerIndex !== -1) {  // Changed from null to -1
      const prayer = todaysPrayers[selectedPrayerIndex];
      if (!prayer) return;

      setOverlayContent(prev => {
        const exists = prev.some(item => item.name === 'date');
        if (exists) return prev;

        return [...prev, {
          name: 'date',
          component: (
            <Animated.Text style={[styles.date, overlayTextStyle]}>
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

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text
          ref={dateRef}
          onLayout={handleLayout}
          style={[styles.date, baseTextStyle]}
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
