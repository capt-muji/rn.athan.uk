import { StyleSheet, Pressable, View, Text } from 'react-native';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { overlayVisibleAtom, selectedPrayerIndexAtom, prayerMeasurementsAtom, dateMeasurementsAtom } from '@/store/store';
import Prayer from './Prayer';
import { COLORS, TEXT } from '@/constants';

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(selectedPrayerIndexAtom);
  const [measurements] = useAtom(prayerMeasurementsAtom);
  const [dateMeasurements] = useAtom(dateMeasurementsAtom);

  if (!visible || selectedIndex === null) return null;

  const handleClose = () => {
    setVisible(false);
    setSelectedIndex(null);
  };

  const prayerPosition = measurements[selectedIndex];
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Portal>
      <Pressable style={styles.overlay} onPress={handleClose}>
        {dateMeasurements && (
          <View style={[
            styles.dateContainer,
            {
              position: 'absolute',
              top: dateMeasurements.pageY,
              left: dateMeasurements.pageX,
              width: dateMeasurements.width,
            }
          ]}>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        )}
        <View style={[
          styles.prayerContainer,
          {
            position: 'absolute',
            top: prayerPosition?.pageY,
            left: 0,
            right: 0,
          }
        ]}>
          <Prayer index={selectedIndex} isOverlay />
        </View>
      </Pressable>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${COLORS.gradientStart}e6`,
    zIndex: 1000,
  },
  prayerContainer: {
    zIndex: 1001,
  },
  dateContainer: {
    zIndex: 1001,
  },
  dateText: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  }
});