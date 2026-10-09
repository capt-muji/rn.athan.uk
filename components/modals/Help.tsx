import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { openDndAccessSettings } from '@/device/notifications';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { getHelpTopics, HELP_ACTION_LABELS, type HelpTopic } from '@/shared/help';

import Modal from './Modal';

/** Share of the screen the scrolling list may take, so the card and its Close button fit every size */
const ANSWERS_HEIGHT_SHARE = 0.62;

const INK = COLORS.light.text;
const BODY = 'rgba(48, 66, 84, 0.66)';
const HAIRLINE = 'rgba(38, 64, 94, 0.1)';
const CHEVRON = 'rgba(48, 66, 84, 0.4)';

/** The one accent: it marks the row you opened, and the thing to go and change */
const ACCENT = 'rgba(13, 115, 119, 1)';
const ACCENT_TINT = 'rgba(13, 115, 119, 0.05)';

/** The panel grows and shrinks rather than appearing, so the list never jumps under a thumb */
const GROW = LinearTransition.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic));

/** Slower than the panel: a spin that keeps up with the height reads as a flick rather than a turn */
const CHEVRON_TURN = { duration: 320, easing: Easing.inOut(Easing.cubic) } as const;

/** Flattens the glyph, which is tall for its width. In the animated array, since a transform replaces rather than merges */
const CHEVRON_SQUASH = 0.6;

/** The chevron's own width. The panel reserves it too, so no answer ever runs beneath the arrow */
const CHEVRON_SIZE = 20;

/**
 * One question, closed until it is asked for
 *
 * Every question starts closed and only one is open at a time (owner, 2026-09-27): the page opens as
 * a list of causes to scan, and only the one a user recognises costs them any reading. The whole row
 * is the trigger, because a chevron alone is a small target on a phone.
 */
const Topic = ({ topic, open, onToggle }: { topic: HelpTopic; open: boolean; onToggle: () => void }) => {
  const turn = useSharedValue(open ? 1 : 0);

  turn.value = withTiming(open ? 1 : 0, CHEVRON_TURN);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * -180}deg` }, { scaleY: CHEVRON_SQUASH }],
  }));

  const { question, text, steps, action } = topic;

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ expanded: open }}
      accessibilityLabel={question}
      onPress={onToggle}>
      <Animated.View layout={GROW} style={[styles.row, open && styles.rowOpen]}>
        <View style={styles.head}>
          <Text style={styles.question}>{question}</Text>
          <Animated.Text style={[styles.chevron, chevronStyle]}>{'\u2304'}</Animated.Text>
        </View>

        {open ? (
          <Animated.View entering={FadeIn.duration(ANIMATION.duration)} exiting={FadeOut.duration(80)}>
            <View style={styles.panel}>
              <Text style={styles.cause}>{text}</Text>

              {steps ? (
                <View style={styles.fix}>
                  {steps.map((step) => (
                    <View key={step} style={styles.stepRow}>
                      <Text style={styles.stepMark}>{'\u00bb'}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {action ? (
                <Pressable
                  style={styles.action}
                  onPress={() => openDndAccessSettings()}
                  accessibilityRole='button'
                  accessibilityLabel={HELP_ACTION_LABELS[action]}>
                  <Text style={styles.actionText}>{HELP_ACTION_LABELS[action]}</Text>
                  <Text style={styles.actionText}>{'\u203a'}</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* A child rule, not a border on this view: the layout animation redraws borders as part of
            the animating frame and can drop the last row's on close, while a child renders at
            whatever the animated height is */}
        <View style={styles.rule} />
      </Animated.View>
    </Pressable>
  );
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalHelp({ visible, onClose }: Props) {
  const { height } = useWindowDimensions();
  const topics = getHelpTopics(Platform.OS === 'android' ? 'android' : 'ios');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      title='Help'
      wide
      divider
      trailingIcon
      onRequestClose={onClose}
      icon={
        <View style={styles.titleBadge}>
          <Text style={styles.titleBadgeGlyph}>?</Text>
        </View>
      }>
      {/* Stretched because the modal centres its children: unstretched, a flexible column measures zero */}
      <ScrollView
        style={[styles.list, { maxHeight: height * ANSWERS_HEIGHT_SHARE }]}
        showsVerticalScrollIndicator={false}>
        {topics.map((topic) => (
          <Topic
            key={topic.question}
            topic={topic}
            open={openQuestion === topic.question}
            onToggle={() => setOpenQuestion(openQuestion === topic.question ? null : topic.question)}
          />
        ))}
      </ScrollView>
      {/* Animated with the list, or it teleports to its new position while the rows above it slide */}
      <Animated.View layout={GROW} style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={onClose} accessibilityRole='button' accessibilityLabel='Close'>
          <Text style={styles.buttonText}>Close</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
    // The rows bleed to the modal's edges, so an open row's tint fills the width rather than floating
    marginHorizontal: -SPACING.lg2,
  },
  titleBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    // Muted grey, owner-ruled: quiet against the dark card, unlike the near-black it replaced
    backgroundColor: 'rgba(203, 213, 225, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  titleBadgeGlyph: {
    // Near-black on the muted grey circle, owner-ruled: reads as engraving rather than a light bulb
    color: 'rgba(71, 85, 105, 0.7)',
    fontSize: 10,
    lineHeight: 16,
    fontFamily: TEXT.family.medium,
    paddingBottom: 1.5,
  },
  row: {
    overflow: 'hidden',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
  },
  rowOpen: {
    backgroundColor: ACCENT_TINT,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    // Wide enough that a question wraps before it ever crowds the chevron
    gap: SPACING.header + SPACING.xs,
    paddingVertical: SPACING.mid,
    paddingLeft: SPACING.header,
    paddingRight: SPACING.header,
  },
  question: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: TEXT.family.medium,
    color: INK,
    letterSpacing: TEXT.letterSpacing.default,
  },
  chevron: {
    width: CHEVRON_SIZE,
    // Centred both ways because rotation pivots about the box, so an off-centre glyph swings
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 20,
    color: CHEVRON,
  },
  panel: {
    paddingBottom: SPACING.lg2,
    paddingLeft: SPACING.header,
    // Ends where the question does, so the text column is identical open or closed, at any width
    paddingRight: SPACING.header + CHEVRON_SIZE,
  },

  cause: {
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
    color: BODY,
    lineHeight: 20,
  },
  fix: {
    marginTop: SPACING.smd,
    gap: SPACING.xs,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stepMark: {
    fontSize: 13,
    lineHeight: 20,
    color: ACCENT,
  },
  stepText: {
    flex: 1,
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.medium,
    color: INK,
    lineHeight: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  actionText: {
    color: ACCENT,
    fontSize: 13,
    fontFamily: TEXT.family.medium,
  },
  buttonRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    // Opaque through the button's air, matching the card: a closing row slides beneath it
    // instead of flashing through the transparent gap above the button
    backgroundColor: COLORS.light.background,
    paddingTop: SPACING.section - SPACING.mid,
  },
  button: {
    width: SIZE.modal.buttonWidth,
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
