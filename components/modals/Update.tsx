import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';

import Modal from './Modal';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ModalUpdate({ visible, onClose, onUpdate }: Props) {
  return (
    <Modal visible={visible} title={t('update.title')} onRequestClose={onClose}>
      <Text style={styles.message}>{t('update.message')}</Text>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
          accessibilityRole={'button'}
          accessibilityLabel={t('update.later')}>
          <Text style={styles.cancelText}>{t('update.later')}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.updateButton]}
          onPress={onUpdate}
          accessibilityRole={'button'}
          accessibilityLabel={t('update.update')}>
          <Text style={styles.updateText}>{t('update.update')}</Text>
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
    marginBottom: 36,
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
    maxWidth: SIZE.modal.buttonWidth,
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
