import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type DimState, dimState, REMINDER_CARD } from '@/components/sheets/parts/dim';
import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { AlertType, Icon, type ReminderInterval, type ReminderSetting } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { SegmentedControl, type SegmentOption, Stepper, Toggle } from '../parts';
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
  onToggle: () => void;
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

  const step = (direction: -1 | 1) => {
    const next = stepReminderInterval(reminder.interval, direction, taken);
    if (next !== null) onSelectInterval(next);
  };

  const handleHeaderPress = () => {
    if (!locked) onToggle();
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
        <Toggle value={isOn} onToggle={onToggle} disabled={locked} />
      </Pressable>

      <View style={[styles.reminderOptions, { borderTopColor: REMINDER_CARD.rule[dim] }]}>
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: optionInk }]}>{t('reminder.sound')}</Text>
          <SegmentedControl options={soundOptions()} selected={sound} onSelect={onSelectSound} dim={dim} />
        </View>

        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: optionInk }]}>{t('reminder.before')}</Text>
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
  );
}

const ty = typographyFor(currentLocaleId());

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
  },
});
