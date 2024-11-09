import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayContentAtom, overlayVisibleAtom, overlayClosingAtom, PageCoordinates, selectedPrayerIndexAtom, todaysPrayersAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT } from '@/constants';
import Masjid from './Masjid';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface DateDisplayProps {
  isOverlay?: boolean;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

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

  useEffect(() => {
    if (overlayVisible && selectedPrayerIndex !== null) {
      const prayer = todaysPrayers[selectedPrayerIndex];
      if (!prayer) return;

      setOverlayContent(prev => {
        const exists = prev.some(item => item.name === 'date');
        if (exists) return prev;

        return [...prev, {
          name: 'date',
          component: <AnimatedText
            style={[styles.date, dateTextStyle]}
          >
            {prayer.passed ? 'Tomorrow' : 'Today'}
          </AnimatedText>,
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
    opacity: isOverlay || (overlayVisible && !overlayClosing) ? TEXT.opacity : 1
  }));

  const getDisplayText = () => {
    if (!isOverlay) return formattedDate;
    if (selectedPrayerIndex === null) return formattedDate;

    const prayer = todaysPrayers[selectedPrayerIndex];
    return prayer?.passed ? 'Tomorrow' : 'Today';
  };

  const dateComponent = (
    <AnimatedText
      ref={dateRef}
      onLayout={handleLayout}
      style={[styles.date, dateTextStyle]}
    >
      {getDisplayText()}
    </AnimatedText>
  );

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        {dateComponent}
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
