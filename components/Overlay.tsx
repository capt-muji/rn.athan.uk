import { StyleSheet, Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { overlayVisibleAtom, selectedPrayerIndexAtom, prayerMeasurementsAtom } from '@/store/store';
import Prayer from './Prayer';
import { COLORS } from '@/constants';

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(selectedPrayerIndexAtom);
  const [measurements] = useAtom(prayerMeasurementsAtom);

  if (!visible || selectedIndex === null) return null;

  const handleClose = () => {
    setVisible(false);
    setSelectedIndex(null);
  };

  const prayerPosition = measurements[selectedIndex];
  
  return (
    <Portal>
      <Pressable style={styles.overlay} onPress={handleClose}>
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
  }
});