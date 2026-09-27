import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { openAppSettings, openDndAccessSettings } from '@/device/notifications';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { getHelpTopics, HELP_ACTION_LABELS, type HelpAction } from '@/shared/help';

import Modal from './Modal';

/** Share of the screen the scrolling answers may take, so the card and its Close button fit every size */
const ANSWERS_HEIGHT_SHARE = 0.66;

/** Slate, never the app's indigo: the modal is a light surface of its own */
const INK = COLORS.light.text;
const BODY = 'rgba(52, 78, 92, 0.72)';
const MUTED = 'rgba(52, 78, 92, 0.5)';
const CARD = 'rgba(52, 78, 92, 0.03)';

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
    <Modal visible={visible} title='Help' wide divider centreTitle>
      <ScrollView style={{ maxHeight: height * ANSWERS_HEIGHT_SHARE }} showsVerticalScrollIndicator={false}>
        {topics.map(({ question, text, steps, action }) => (
          <View key={question} style={styles.card}>
            <Text style={styles.question}>{question}</Text>
            <Text style={styles.answer}>{text}</Text>
            {steps ? (
              <View style={styles.steps}>
                {steps.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {action ? (
              <Pressable
                style={styles.action}
                onPress={() => runAction(action)}
                accessibilityRole='button'
                accessibilityLabel={HELP_ACTION_LABELS[action]}>
                <Text style={styles.actionText}>{HELP_ACTION_LABELS[action]}</Text>
                <Text style={styles.actionChevron}>›</Text>
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
  card: {
    backgroundColor: CARD,
    borderRadius: RADIUS.md,
    padding: SPACING.mid,
    marginBottom: SPACING.md,
  },
  question: {
    fontSize: 15,
    fontFamily: TEXT.family.medium,
    color: INK,
    letterSpacing: TEXT.letterSpacing.default,
  },
  answer: {
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
    color: BODY,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  steps: {
    marginTop: SPACING.smd,
    gap: SPACING.xs,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stepNumber: {
    minWidth: 10,
    fontSize: 12,
    fontFamily: TEXT.family.medium,
    color: MUTED,
  },
  stepText: {
    flex: 1,
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
    color: BODY,
    lineHeight: 19,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionText: {
    color: INK,
    fontSize: 13,
    fontFamily: TEXT.family.medium,
  },
  actionChevron: {
    color: INK,
    fontSize: 15,
    fontFamily: TEXT.family.regular,
  },
  button: {
    alignSelf: 'stretch',
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
