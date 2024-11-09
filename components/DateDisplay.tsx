import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayContentAtom, overlayVisibleAtom, PageCoordinates } from '@/store/store';
import { COLORS, SCREEN, TEXT } from '@/constants';
import Masjid from './Masjid';

export default function DateDisplay() {
  const [_, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [__, setOverlayContent] = useAtom(overlayContentAtom);
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
    if (overlayVisible) {
      setOverlayContent(prev => [...prev, {
        name: 'date',
        component: dateComponent,
        measurements: measurementsRef.current!
      }]);
    }
  }, [overlayVisible]);

  const handleLayout = () => {
    if (!dateRef.current) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      measurementsRef.current = measurements;
      setDateMeasurements(measurements);
    });
  };

  const dateComponent = (
    <Text ref={dateRef} onLayout={handleLayout} style={styles.date}>
      {formattedDate}
    </Text>
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
    zIndex: 1,
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
