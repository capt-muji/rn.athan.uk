import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import { COLORS, SCREEN, TEXT } from '@/constants';
import Masjid from './Masjid';
import { useAtom } from 'jotai';
import { dateMeasurementsAtom } from '@/store/store';

export default function DateDisplay() {
  const [_, setDateMeasurements] = useAtom(dateMeasurementsAtom);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setDateMeasurements({ x, y, width, height });
  };

  return (
    <View style={styles.container}>
      <View onLayout={handleLayout}>
        <Text style={styles.location}>London, UK</Text>
        <Text style={styles.date}>{formattedDate}</Text>
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
