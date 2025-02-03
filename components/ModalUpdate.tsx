import { StyleSheet, Text, View, Pressable } from 'react-native';

import Modal from '@/components/Modal';
import { TEXT } from '@/shared/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  version?: string;
};

export default function ModalUpdate({ visible, onClose, onUpdate }: Props) {
  return (
    <Modal visible={visible} onClose={onClose} title="Update Available!" hideCloseButton>
      <Text style={styles.message}>
        A new version is available.
        {'\n'}Would you like to update now?
      </Text>
      <View style={styles.buttonContainer}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
          <Text style={styles.cancelText}>Later</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.updateButton]} onPress={onUpdate}>
          <Text style={styles.updateText}>Update</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    textAlign: 'center',
    color: '#344e5c',
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: 24,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  updateButton: {
    backgroundColor: '#000',
  },
  cancelText: {
    color: '#344e5c',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
  updateText: {
    color: '#fff',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
});
