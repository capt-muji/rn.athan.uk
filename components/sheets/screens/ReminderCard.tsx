import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, type TextLayoutEvent, View } from 'react-native';

import { type DimState, dimState, REMINDER_CARD } from '@/components/sheets/parts/dim';
import type { ToggleHandle } from '@/components/sheets/parts/Toggle';
import { useCachedGeometry } from '@/hooks/useCachedGeometry';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { en } from '@/shared/i18n/en';
import { currentLocaleId } from '@/shared/i18n/locale';
import { AlertType, Icon, type ReminderInterval, type ReminderSetting } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { SegmentedControl, type SegmentOption, Stepper, Toggle } from '../parts';
import { requiredControlWidth, segmentContentWidth } from '../parts/reminderRowLayout';
import { stepReminderInterval } from '../parts/reminderStep';

// Resolved at call time so a locale switch reaches the labels on the next render
const soundOptions = (): SegmentOption[] => [
  { value: AlertType.Silent, label: t('alert.option.silent'), icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: t('alert.option.sound'), icon: Icon.SPEAKER },
];

interface Props {
  title: string;
  hint: string;
  reminder: ReminderSetting;
  /** The sound this reminder switches back on with, kept while it is Off so the choice survives a toggle */
  sound: AlertType.Silent | AlertType.Sound;
  /** The other reminder's interval while it is on: the one minute this card must not be able to reach */
  taken: number | null;
  /** While the athan is Off, or the reminder before this one is, nothing here can fire */
  locked: boolean;
  onToggle: (next: boolean) => void;
  onSelectSound: (sound: AlertType) => void;
  onSelectInterval: (interval: ReminderInterval) => void;
}

/**
 * One reminder: its own switch, its own sound and its own minutes.
 *
 * Two of these make up the sheet's reminder half, and they are independent except for `taken`, which is what keeps
 * a prayer's two reminders off the same minute.
 */
export default function ReminderCard({
  title,
  hint,
  reminder,
  sound,
  taken,
  locked,
  onToggle,
  onSelectSound,
  onSelectInterval,
}: Props) {
  const isOn = reminder.alert !== AlertType.Off;
  // The dim is carried by colour: every element picks its solid from the state tables
  // (dim.ts), flattened from the old nested wrapper opacities
  const dim: DimState = dimState(locked, isOn);
  const optionInk = REMINDER_CARD.optionLabel[dim];

  // The rows' shared minimum control width. The floor is the per-side slack today's English layout
  // shows, so the control grows leftward by exactly the content's excess and English never moves;
  // each value seeds from its MMKV cache at mount, so a session's first open renders the settled
  // layout instead of measuring inside its own entrance, and the cache is written back only after
  // the sheet has settled open
  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, measureRowWidth] = useCachedGeometry(`reminder_row_width_${Math.round(windowWidth)}`);
  const [baselineTextWidth, measureBaselineText] = useCachedGeometry('reminder_baseline_text');
  const [activeTextWidth, measureActiveText] = useCachedGeometry(`reminder_active_text_${currentLocaleId()}`);
  const requiredControl = requiredControlWidth({
    rowWidth,
    baselineContentWidth: segmentContentWidth(baselineTextWidth),
    contentWidth: segmentContentWidth(activeTextWidth),
  });

  const handleRowLayout = useCallback(
    (e: LayoutChangeEvent) => measureRowWidth(e.nativeEvent.layout.width),
    [measureRowWidth]
  );

  // A relayout can report a narrower line than the widest the pair ever showed, and a text with no
  // lines reports none, so the running maximum is what the floor reads
  const handleBaselineTextLayout = useCallback(
    (e: TextLayoutEvent) => measureBaselineText(e.nativeEvent.lines[0]?.width ?? 0),
    [measureBaselineText]
  );
  const handleActiveTextLayout = useCallback(
    (e: TextLayoutEvent) => measureActiveText(e.nativeEvent.lines[0]?.width ?? 0),
    [measureActiveText]
  );

  const step = (direction: -1 | 1) => {
    const next = stepReminderInterval(reminder.interval, direction, taken);
    if (next !== null) onSelectInterval(next);
  };

  // The card's heading routes through the switch's own press, so the thumb
  // flips, the haptic lands and the write settles identically whichever was
  // touched
  const toggleRef = useRef<ToggleHandle>(null);

  const handleHeaderPress = () => {
    if (!locked) toggleRef.current?.press();
  };

  return (
    <View
      style={[
        styles.card,
        locked && { backgroundColor: REMINDER_CARD.background.locked, borderColor: REMINDER_CARD.border.locked },
      ]}>
      {/* The title and hint name the row's own switch, which carries the role and the checked
          state. The row stays roleless on purpose: naming it too would have a screen reader
          offer two controls for one setting, and the switch is the one that reports its state */}
      <Pressable style={styles.cardRow} onPress={handleHeaderPress}>
        <View>
          <Text style={[styles.cardTitle, { color: locked ? REMINDER_CARD.title.locked : REMINDER_CARD.title.rest }]}>
            {title}
          </Text>
          <Text style={[styles.cardHint, { color: locked ? REMINDER_CARD.hint.locked : REMINDER_CARD.hint.rest }]}>
            {hint}
          </Text>
        </View>
        <Toggle
          ref={toggleRef}
          value={isOn}
          onToggle={onToggle}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          disabled={locked}
        />
      </Pressable>

      <View style={[styles.reminderOptions, { borderTopColor: REMINDER_CARD.rule[dim] }]}>
        <View style={styles.optionRow} onLayout={handleRowLayout} testID={'reminder-sound-row'}>
          <Text style={[styles.optionLabel, { color: optionInk }]}>{t('reminder.sound')}</Text>
          <View style={[styles.controlHost, { minWidth: requiredControl }]} testID={'reminder-sound-host'}>
            <SegmentedControl
              options={soundOptions()}
              selected={sound}
              onSelect={onSelectSound}
              dim={dim}
              commitOnSettle
            />
          </View>
        </View>

        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: optionInk }]}>{t('reminder.before')}</Text>
          <View style={[styles.controlHost, { minWidth: requiredControl }]} testID={'reminder-before-host'}>
            <Stepper
              value={reminder.interval}
              onDecrement={() => step(-1)}
              onIncrement={() => step(1)}
              unit={t('reminder.unitMinutes')}
              dim={dim}
              taken={taken}
            />
          </View>
        </View>
      </View>

      {/* The floor's measurer: the English pair under the English typography and the active pair under the
          card's own, each drawn exactly as the segment labels draw so the widths reported are the widths
          the options will render */}
      <View
        testID={'reminder-measurer'}
        style={styles.measurer}
        pointerEvents={'none'}
        // TalkBack focuses alpha-0 text, so hiding by sight alone would read four phantom labels per card
        accessibilityElementsHidden={true}
        importantForAccessibility={'no-hide-descendants'}>
        <Text
          testID={'reminder-baseline-silent'}
          style={styles.measuredBaseline}
          onTextLayout={handleBaselineTextLayout}>
          {en['alert.option.silent']}
        </Text>
        <Text
          testID={'reminder-baseline-sound'}
          style={styles.measuredBaseline}
          onTextLayout={handleBaselineTextLayout}>
          {en['alert.option.sound']}
        </Text>
        <Text testID={'reminder-active-silent'} style={styles.measuredActive} onTextLayout={handleActiveTextLayout}>
          {t('alert.option.silent')}
        </Text>
        <Text testID={'reminder-active-sound'} style={styles.measuredActive} onTextLayout={handleActiveTextLayout}>
          {t('alert.option.sound')}
        </Text>
      </View>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());
// The floor's baseline pair always measures under the English typography, whatever the active locale is
const baselineTy = typographyFor('en');

const styles = StyleSheet.create({
  card: {
    backgroundColor: REMINDER_CARD.background.rest,
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: REMINDER_CARD.border.rest,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    marginBottom: SPACING.sm - 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
  },
  reminderOptions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg2,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionLabel: {
    fontSize: ty.size(13),
    fontFamily: ty.familyRegular,
    width: 100,
    // The control's minimum eats into the label column by exactly the excess, never the control's
    // own share: flexbox negotiates, so only a locale wider than English ever moves this text
    flexShrink: 1,
  },
  controlHost: {
    flexGrow: 1,
  },
  measurer: {
    position: 'absolute',
    opacity: 0,
  },
  measuredBaseline: {
    fontSize: baselineTy.size(TEXT.sizeDetail - 1),
    fontFamily: baselineTy.familyRegular,
  },
  measuredActive: {
    fontSize: ty.size(TEXT.sizeDetail - 1),
    fontFamily: ty.familyRegular,
  },
});
