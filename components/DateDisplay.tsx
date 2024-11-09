import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { dateMeasurementsAtom, overlayContentAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT } from '@/constants';
import Masjid from './Masjid';

export default function DateDisplay({ isOverlay }: { isOverlay?: boolean }) {
  const [_, setDateMeasurements] = useAtom(dateMeasurementsAtom);
  const [__, setOverlayContent] = useAtom(overlayContentAtom);
  const dateRef = useRef<Text>(null);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleLayout = () => {
    if (!dateRef.current) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      setDateMeasurements({ pageX: x, pageY: y, width, height });
      if (!isOverlay) {
        setOverlayContent(prev => ({
          ...prev,
          date: {
            component: <DateDisplay isOverlay />,
            measurements: { pageX: x, pageY: y, width, height }
          }
        }));
      }
    });
  };

  return (
    <View style={styles.container}>
      <View>
        {!isOverlay && <Text style={styles.location}>London, UK</Text>}
        <Text
          ref={dateRef}
          onLayout={handleLayout}
          style={styles.date}
        >
          {formattedDate}
        </Text>
      </View>
      {!isOverlay && <Masjid />}
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
