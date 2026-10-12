import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';

import Modal from './Modal';

/** The Help modal's list share (owner, 2026-10-12): bounds the message so the card can never grow past the screen, never reached by today's copy */
const MESSAGE_HEIGHT_SHARE = 0.62;

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ModalUpdate({ visible, onClose, onUpdate }: Props) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} title={t('update.title')} onRequestClose={onClose}>
      <ScrollView
        style={[styles.messageScroll, { maxHeight: height * MESSAGE_HEIGHT_SHARE }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.message}>{t('update.message')}</Text>
      </ScrollView>
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
    marginTop: SPACING.xs,
  },
  // Stretched so the centred text keeps the card's full width: unstretched, the scroller hugs the text
  messageScroll: {
    alignSelf: 'stretch',
    marginBottom: 36,
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
