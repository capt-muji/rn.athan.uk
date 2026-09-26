import { StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import { AlertType, Icon, type ReminderInterval, type ReminderSetting } from '@/shared/types';

import { SegmentedControl, type SegmentOption, Stepper, Toggle } from '../parts';
import { stepReminderInterval } from '../parts/reminderStep';

const SOUND_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
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

  const step = (direction: -1 | 1) => {
    const next = stepReminderInterval(reminder.interval, direction, taken);
    if (next !== null) onSelectInterval(next);
  };

  return (
    <View style={[styles.card, locked && styles.cardDisabled]}>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardHint}>{hint}</Text>
        </View>
        <Toggle value={isOn} onToggle={onToggle} disabled={locked} />
      </View>

      <View style={[styles.reminderOptions, !isOn && styles.optionsDisabled]}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Sound</Text>
          <SegmentedControl options={SOUND_OPTIONS} selected={sound} onSelect={onSelectSound} disabled={!isOn} />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Before</Text>
          <Stepper
            value={reminder.interval}
            onDecrement={() => step(-1)}
            onIncrement={() => step(1)}
            unit='min'
            disabled={!isOn}
            taken={taken}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardDisabled: {
    opacity: 0.25,
  },
  cardTitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: '#d8eaf8',
    marginBottom: SPACING.sm - 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHint: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
  },
  reminderOptions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.07)',
    gap: SPACING.sm,
  },
  optionsDisabled: {
    opacity: 0.25,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: TEXT.family.regular,
    color: 'rgb(146, 184, 228)',
    width: 100,
  },
});
