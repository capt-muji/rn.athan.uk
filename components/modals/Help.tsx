import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { openAppSettings, openDndAccessSettings } from '@/device/notifications';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { getHelpTopics, HELP_ACTION_LABELS, type HelpAction } from '@/shared/help';

import Modal from './Modal';

/** Share of the screen the scrolling answers may take, so the card and its Close button fit every size */
const ANSWERS_HEIGHT_SHARE = 0.55;

const runAction = (action: HelpAction) => {
  if (action === 'dndAccess') {
    openDndAccessSettings();
    return;
  }
  openAppSettings();
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalHelp({ visible, onClose }: Props) {
  const { height } = useWindowDimensions();
  const topics = getHelpTopics(Platform.OS === 'android' ? 'android' : 'ios');

  return (
    <Modal visible={visible} title='Help'>
      <ScrollView style={{ maxHeight: height * ANSWERS_HEIGHT_SHARE }} showsVerticalScrollIndicator={false}>
        {topics.map(({ question, text, action }) => (
          <View key={question} style={styles.topic}>
            <Text style={styles.question}>{question}</Text>
            <Text style={styles.answer}>{text}</Text>
            {action ? (
              <Pressable
                style={styles.action}
                onPress={() => runAction(action)}
                accessibilityRole='button'
                accessibilityLabel={HELP_ACTION_LABELS[action]}>
                <Text style={styles.actionText}>{HELP_ACTION_LABELS[action]}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.button} onPress={onClose} accessibilityRole='button' accessibilityLabel='Close'>
        <Text style={styles.buttonText}>Close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topic: {
    marginBottom: SPACING.xl,
  },
  question: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
    color: COLORS.light.text,
    letterSpacing: TEXT.letterSpacing.default,
  },
  answer: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: COLORS.light.textSecondary,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
    marginTop: SPACING.xs,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.light.buttonCancel,
  },
  actionText: {
    color: COLORS.light.textSecondary,
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
  },
  button: {
    width: SIZE.modal.buttonWidth,
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.buttonPrimary,
  },
  buttonText: {
    color: COLORS.light.background,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
});
