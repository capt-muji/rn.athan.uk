import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayContentAtom, PageCoordinates, selectedPrayerIndexAtom, todaysPrayersAtom, overlayStartOpeningAtom, overlayStartClosingAtom, overlayFinishedClosingAtom, overlayFinishedOpeningAtom, overlayVisibleToggleAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT, ANIMATION } from '@/constants';
import Masjid from './Masjid';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';

export default function DateDisplay() {
  const [, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [overlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
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

  const prayer = todaysPrayers[selectedPrayerIndex];

  const originalOpacity = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);

  const todaysStyle = useAnimatedStyle(() => ({
    opacity: originalOpacity.value
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value
  }));

  useEffect(() => {
    if (selectedPrayerIndex !== -1 && overlayStartOpening && overlayVisibleToggle) {
      originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
      overlayOpacity.value = withDelay(150, withTiming(0.5, { duration: ANIMATION.duration }));

      setOverlayContent(prev => {
        return [...prev, {
          name: 'date',
          component: (
            <Animated.Text style={[styles.date, styles.overlayText, overlayStyle]}>
              {prayer.passed ? 'Tomorrow' : 'Today'}
            </Animated.Text>
          ),
          measurements: measurementsRef.current!
        }];
      });
    }
  }, [overlayStartOpening]);

  useEffect(() => {
    if (overlayStartClosing) {
      overlayOpacity.value = withTiming(0, { duration: ANIMATION.duration });
      originalOpacity.value = withDelay(250, withTiming(1, { duration: ANIMATION.duration }));
    }
  }, [overlayStartClosing]);

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
          style={[styles.date, todaysStyle]}
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
  overlayText: {
    color: COLORS.textSecondary,
  }
});
