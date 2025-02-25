import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import Modal from '@/components/Modal';
import { TEXT } from '@/shared/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalTimesExplained({ visible, onClose }: Props) {
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsDisabled(true);
      const timer = setTimeout(() => setIsDisabled(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} title="Information">
      <View style={styles.container}>
        <View style={styles.timeRow}>
          <Text style={styles.timeTitle}>Last Third:</Text>
          <Text style={styles.timeDescription}>10 mins after the last third of the night begins</Text>
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
      <Pressable
        style={[styles.closeButton, isDisabled && styles.buttonDisabled]}
        onPress={onClose}
        disabled={isDisabled}>
        <Text style={[styles.closeText, isDisabled && styles.buttonTextDisabled]}>Close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 10,
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timeTitle: {
    width: 90,
    fontSize: TEXT.sizeSmall - 1,
    fontFamily: TEXT.family.medium,
    color: '#1a1a1a',
    textAlign: 'left',
    paddingHorizontal: 8,
  },
  timeDescription: {
    flex: 1,
    fontSize: TEXT.sizeSmall - 1,
    fontFamily: TEXT.family.regular,
    color: '#344e5c',
  },
  closeButton: {
    marginTop: 30,
    paddingVertical: 16,
    backgroundColor: '#000',
    borderRadius: 10,
    width: '75%',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: '#d4dae2',
  },
  buttonTextDisabled: {
    color: '#738799',
  },
});
