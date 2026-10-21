import { type ComponentRef, Fragment, useRef, useState } from 'react';
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
import { getHelpActionLabels, getHelpTopics, type HelpTopic } from '@/shared/help';
import { t } from '@/shared/i18n';
import { chevronFor, currentLocaleId, directionGlyph } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { revealTarget, scrollReveal } from './helpReveal';
import Modal from './Modal';

/** Share of the screen the scrolling list may take, so the card and its Close button fit every size */
const ANSWERS_HEIGHT_SHARE = 0.62;

const INK = COLORS.light.text;
// Solid flattens of the old rgba inks over the white card, so body text never compounds
const BODY = '#76828e';
const HAIRLINE = 'rgba(38, 64, 94, 0.1)';
const CHEVRON = '#acb3bb';

/** The one accent: it marks the row you opened, and the thing to go and change */
const ACCENT = 'rgba(13, 115, 119, 1)';
const ACCENT_TINT = 'rgba(13, 115, 119, 0.05)';

/** The panel grows and shrinks rather than appearing, so the list never jumps under a thumb */
const GROW = LinearTransition.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic));

/** Slower than the panel: a spin that keeps up with the height reads as a flick rather than a turn */
const CHEVRON_TURN = { duration: 320, easing: Easing.inOut(Easing.cubic) } as const;

/**
 * The strip's white over the card's own still-fading white composites ahead of the card (the
 * owner's round-2 frame read the strip at 0.979 against the card's 0.905), so on Android it rides
 * a coat that waits out the modal container's fade: the bare FadeIn runs 300ms, and white arriving
 * on already-opaque white shows nothing. No opacity pin sits in the row's own style, which a later
 * layout frame would clone back; the row's own FadeIn keeps the button riding the card as on iOS.
 */
const BUTTON_ROW_COAT = FadeIn.delay(300);

/** Flattens the glyph, which is tall for its width. In the animated array, since a transform replaces rather than merges */
const CHEVRON_SQUASH = 0.6;

/** The chevron's own width. The panel reserves it too, so no answer ever runs beneath the arrow */
const CHEVRON_SIZE = 20;

/**
 * One question, closed until it is asked for
 *
 * Every question starts closed and only one is open at a time: the page opens as
 * a list of causes to scan, and only the one a user recognises costs them any reading. The whole row
 * is the trigger, because a chevron alone is a small target on a phone.
 */
const Topic = ({
  topic,
  open,
  onToggle,
  onRowLayout,
}: {
  topic: HelpTopic;
  open: boolean;
  onToggle: () => void;
  onRowLayout: (question: string, layout: { y: number; height: number }) => void;
}) => {
  const turn = useSharedValue(open ? 1 : 0);

  turn.value = withTiming(open ? 1 : 0, CHEVRON_TURN);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * -180}deg` }, { scaleY: CHEVRON_SQUASH }],
  }));

  const { question, text, steps, action } = topic;

  return (
    <Pressable
      accessibilityRole={'button'}
      accessibilityState={{ expanded: open }}
      accessibilityLabel={question}
      onPress={onToggle}
      onLayout={(event) => onRowLayout(question, event.nativeEvent.layout)}>
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
                      <Text style={styles.stepMark}>{directionGlyph('\u00bb', '\u00ab')}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {action ? (
                <Pressable
                  style={styles.action}
                  onPress={() => openDndAccessSettings()}
                  accessibilityRole={'button'}
                  accessibilityLabel={getHelpActionLabels()[action]}>
                  <Text style={styles.actionText}>{getHelpActionLabels()[action]}</Text>
                  <Text style={[styles.actionText, styles.actionChevron]}>{chevronFor()}</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
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
  const listRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const listHeightRef = useRef(0);
  const listOffsetRef = useRef(0);

  /**
   * A row that grows past the ScrollView's window opens invisibly (the 3T's list overflows the
   * viewport even closed), so the list scrolls the least distance that brings the open answer's
   * bottom inside the window it sits in. Answers that already fit never move the list.
   */
  const handleRowLayout = (question: string, layout: { y: number; height: number }) => {
    if (openQuestion !== question) return;
    const target = revealTarget(layout, listHeightRef.current, listOffsetRef.current);
    if (target !== null) scrollReveal(listRef.current, target);
  };

  return (
    <Modal
      visible={visible}
      title={t('help.title')}
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
        ref={listRef}
        style={[styles.list, { maxHeight: height * ANSWERS_HEIGHT_SHARE }]}
        onLayout={(event) => {
          listHeightRef.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          listOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {topics.map((topic) => (
          <Fragment key={topic.question}>
            <Topic
              topic={topic}
              open={openQuestion === topic.question}
              onToggle={() => setOpenQuestion(openQuestion === topic.question ? null : topic.question)}
              onRowLayout={handleRowLayout}
            />
            {/* A child of the list, never a row's last pixel: Android's pixel-grid snap eats a
                hairline that closes a wrap-content row, every second row at a fractional density;
                outside the row it always renders */}
            <Animated.View layout={GROW} style={styles.rule} />
          </Fragment>
        ))}
      </ScrollView>
      {/* Animated with the list, or it teleports to its new position while the rows above it slide */}
      <Animated.View
        layout={GROW}
        entering={FadeIn}
        style={[styles.buttonRow, Platform.OS !== 'android' && styles.buttonRowOpaque]}>
        {/* Android's strip white rides a coat below, not this row's own background, so the entrance
            never paints it ahead of the card; iOS keeps the row's own white, its accepted entrance */}
        {Platform.OS === 'android' ? <Animated.View entering={BUTTON_ROW_COAT} style={styles.buttonRowCoat} /> : null}
        <Pressable
          style={styles.button}
          onPress={onClose}
          accessibilityRole={'button'}
          accessibilityLabel={t('modal.close')}>
          <Text style={styles.buttonText}>{t('modal.close')}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const ty = typographyFor(currentLocaleId());

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
    // Near-black on the muted grey circle, owner-ruled: reads as engraving rather than a
    // light bulb. Solid: the old 0.7 ink flattened over the badge's own colour
    color: '#727e8f',
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
    paddingStart: SPACING.header,
    paddingEnd: SPACING.header,
  },
  question: {
    flex: 1,
    fontSize: ty.size(15),
    // The Arabic script line box, because the pinned 20 point box clipped the question's dots and descenders
    lineHeight: ty.scriptLineHeight?.(15) ?? ty.lineHeight(20),
    fontFamily: ty.familyMedium,
    color: INK,
    letterSpacing: ty.letterSpacing(TEXT.letterSpacing.default),
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
    paddingStart: SPACING.header,
    // Ends where the question does, so the text column is identical open or closed, at any width
    paddingEnd: SPACING.header + CHEVRON_SIZE,
  },

  cause: {
    fontSize: ty.size(TEXT.sizeDetail - 1),
    fontFamily: ty.familyRegular,
    color: BODY,
    lineHeight: ty.lineHeight(20),
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
    fontSize: ty.size(TEXT.sizeDetail - 1),
    fontFamily: ty.familyMedium,
    color: INK,
    lineHeight: ty.lineHeight(20),
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
    fontSize: ty.size(13),
    fontFamily: ty.familyMedium,
  },
  actionChevron: {
    // The codepoint carries the direction (chevronFor); Android mirrors a lone neutral
    // glyph inside an RTL paragraph, so the paragraph itself stays LTR
    direction: 'ltr',
  },
  buttonRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: SPACING.section - SPACING.mid,
  },
  /** iOS carries the settled white on the row itself, the entrance it has always had */
  buttonRowOpaque: {
    // Opaque through the button's air, matching the card: a closing row slides beneath it
    // instead of flashing through the transparent gap above the button
    backgroundColor: COLORS.light.background,
  },
  /** Android's settled white, on a coat that fills the strip behind the button */
  buttonRowCoat: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.light.background,
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
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
  },
});
