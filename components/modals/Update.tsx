import { StyleSheet, Text, View, Pressable } from 'react-native';

import Modal from './Modal';

import { COLORS, TEXT, SPACING, RADIUS } from '@/shared/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ModalUpdate({ visible, onClose, onUpdate }: Props) {
  return (
    <Modal visible={visible} title="Update Available!">
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
    color: COLORS.light.textSecondary,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
    marginBottom: SPACING.xxl,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.light.buttonCancel,
  },
  updateButton: {
    backgroundColor: COLORS.light.buttonPrimary,
  },
  cancelText: {
    color: COLORS.light.textSecondary,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
  updateText: {
    color: COLORS.light.background,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
});
