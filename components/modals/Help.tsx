import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import InfoIcon from '@/assets/icons/svg/info.svg';
import { openAppSettings, openDndAccessSettings } from '@/device/notifications';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { getHelpTopics, HELP_ACTION_LABELS, type HelpAction } from '@/shared/help';

import Modal from './Modal';

/** Share of the screen the scrolling answers may take, so the card and its Close button fit every size */
const ANSWERS_HEIGHT_SHARE = 0.7;

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
    <Modal
      visible={visible}
      title='Help'
      wide
      divider
      icon={<InfoIcon width={14} height={14} color={COLORS.light.text} />}>
      <ScrollView style={{ maxHeight: height * ANSWERS_HEIGHT_SHARE }} showsVerticalScrollIndicator={false}>
        {topics.map(({ question, text, steps, action }, index) => (
          <View key={question}>
            <View style={styles.questionRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.question}>{question}</Text>
            </View>
            <Text style={styles.answer}>{text}</Text>
            {steps?.map((step, stepIndex) => (
              <View key={step} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            {action ? (
              <Pressable
                style={styles.action}
                onPress={() => runAction(action)}
                accessibilityRole='button'
                accessibilityLabel={HELP_ACTION_LABELS[action]}>
                <Text style={styles.actionText}>{HELP_ACTION_LABELS[action]}</Text>
              </Pressable>
            ) : null}
            {index < topics.length - 1 ? <View style={styles.topicDivider} /> : null}
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
  questionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
    color: COLORS.light.text,
    lineHeight: TEXT.lineHeight.default,
  },
  question: {
    flex: 1,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
    color: COLORS.light.text,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
  },
  answer: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: COLORS.light.textSecondary,
    lineHeight: TEXT.lineHeight.default,
    letterSpacing: TEXT.letterSpacing.default,
    marginTop: SPACING.xxs,
    marginLeft: SPACING.lg,
  },
  stepRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    marginLeft: SPACING.lg,
    gap: SPACING.xs,
  },
  stepNumber: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: COLORS.light.textSecondary,
  },
  stepText: {
    flex: 1,
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: COLORS.light.textSecondary,
    letterSpacing: TEXT.letterSpacing.default,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: SPACING.smd,
    marginLeft: SPACING.lg,
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
  topicDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.light.textSecondary,
    opacity: 0.15,
    marginVertical: SPACING.lg,
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
