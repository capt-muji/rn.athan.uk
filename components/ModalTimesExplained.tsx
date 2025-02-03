import { StyleSheet, Text, View } from 'react-native';

import Modal from '@/components/Modal';
import { TEXT } from '@/shared/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalTimesExplained({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} onClose={onClose} title="Prayer Times">
      <View style={styles.container}>
        <View style={styles.timeRow}>
          <Text style={styles.timeTitle}>Last Third:</Text>
          <Text style={styles.timeDescription}>10 mins after last third begins</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeTitle}>Duha:</Text>
          <Text style={styles.timeDescription}>20 mins after Sunrise</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeTitle}>Suhoor:</Text>
          <Text style={styles.timeDescription}>40 mins before Fajr</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeTitle}>Istijaba:</Text>
          <Text style={styles.timeDescription}>59 mins before Magrib (Fridays)</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timeTitle: {
    width: 80, // Fixed width for all titles
    fontSize: TEXT.sizeSmall - 1,
    fontFamily: TEXT.family.medium,
    color: '#1a1a1a',
  },
  timeDescription: {
    flex: 1,
    fontSize: TEXT.sizeSmall - 1,
    fontFamily: TEXT.family.regular,
    color: '#344e5c',
  },
});
