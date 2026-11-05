/**
 * The round-6 sheet body (T-623): the round-5 body composition unchanged -
 * the alert sheet's real content with the Fasting card in its slot between
 * the Athan card and Reminder 1 - carrying the round-6 ten-hue card.
 * Dev-only: nothing shipped imports here.
 */

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl, type SegmentOption } from '@/components/sheets/parts';
import { freeReminderInterval } from '@/components/sheets/parts/reminderStep';
import { takenInterval } from '@/components/sheets/screens/alertDraft';
import ReminderCard from '@/components/sheets/screens/ReminderCard';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import {
  AlertType,
  Icon,
  type PerReminderSlot,
  type ReminderInterval,
  type ReminderSetting,
  type ReminderSlot,
} from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { nextR2Selection, type R2Selection } from '../r2/model';
import { FastingCardR6, type R6Design } from './FastingCardR6';

// Resolved at call time so a locale switch reaches the labels on the next render (the shipped body's own table)
const athanOptions = (): SegmentOption[] => [
  { value: AlertType.Off, label: t('alert.option.off'), icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: t('alert.option.silent'), icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: t('alert.option.sound'), icon: Icon.SPEAKER },
];

const ATHAN_CARD_TITLE_KEY = 'alert.card.athan';
const ATHAN_CARD_HINT_KEY = 'alert.card.athanHint';
const REMINDER_TITLE_KEY = 'alert.reminder';
const REMINDER_HINT_KEY = 'alert.reminderHint';

interface R6SheetBodyProps {
  readonly design: R6Design;
  readonly seed: R2Selection;
}

export function R6SheetBody({ design, seed }: R6SheetBodyProps) {
  const [selection, setSelection] = useState<R2Selection>(seed);

  useEffect(() => {
    setSelection(seed);
  }, [seed]);

  // The live-sheet draft the frames show: the athan on, both reminders on,
  // Reminder 1 at the app's five minutes and Reminder 2 at the nearest free
  // one - exactly what the shipped body drafts when both reminders are live
  const [athan, setAthan] = useState<AlertType>(AlertType.Sound);
  const [reminders, setReminders] = useState<PerReminderSlot<ReminderSetting>>([
    { alert: AlertType.Sound, interval: 5 },
    { alert: AlertType.Sound, interval: 10 },
  ]);

  const updateReminder = useCallback((slot: ReminderSlot, change: Partial<ReminderSetting>) => {
    setReminders((current) => {
      const changed = { ...current[slot], ...change };
      return slot === 0 ? [changed, current[1]] : [current[0], changed];
    });
  }, []);

  // The shipped body's own toggle rule: an on press takes the nearest free interval
  const handleReminderToggle = useCallback(
    (slot: ReminderSlot, next: boolean) => {
      const other = reminders[slot === 0 ? 1 : 0];
      const interval = next
        ? freeReminderInterval(reminders[slot].interval, takenInterval(other))
        : reminders[slot].interval;
      updateReminder(slot, {
        alert: next
          ? reminders[slot].alert === AlertType.Off
            ? AlertType.Sound
            : reminders[slot].alert
          : AlertType.Off,
        interval,
      });
    },
    [reminders, updateReminder]
  );

  const handleReminderSoundSelect = useCallback(
    (slot: ReminderSlot, type: AlertType) => {
      updateReminder(slot, { alert: type });
    },
    [updateReminder]
  );

  const canEnableReminder = athan !== AlertType.Off;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t(ATHAN_CARD_TITLE_KEY)}</Text>
        <Text style={styles.cardHint}>{t(ATHAN_CARD_HINT_KEY)}</Text>
        <View style={styles.athanControl}>
          <SegmentedControl options={athanOptions()} selected={athan} onSelect={setAthan} />
        </View>
      </View>

      <FastingCardR6
        design={design}
        selection={selection}
        onTap={(key) => setSelection((current) => nextR2Selection(current, key))}
      />

      <ReminderCard
        title={t(REMINDER_TITLE_KEY, { n: 1 })}
        hint={t(REMINDER_HINT_KEY)}
        reminder={reminders[0]}
        sound={reminders[0].alert === AlertType.Off ? AlertType.Sound : reminders[0].alert}
        taken={takenInterval(reminders[1])}
        locked={!canEnableReminder}
        onToggle={(next) => handleReminderToggle(0, next)}
        onSelectSound={(type) => handleReminderSoundSelect(0, type)}
        onSelectInterval={(interval) => updateReminder(0, { interval: interval as ReminderInterval })}
      />

      <ReminderCard
        title={t(REMINDER_TITLE_KEY, { n: 2 })}
        hint={t(REMINDER_HINT_KEY)}
        reminder={reminders[1]}
        sound={reminders[1].alert === AlertType.Off ? AlertType.Sound : reminders[1].alert}
        taken={takenInterval(reminders[0])}
        locked={!canEnableReminder || reminders[0].alert === AlertType.Off}
        onToggle={(next) => handleReminderToggle(1, next)}
        onSelectSound={(type) => handleReminderSoundSelect(1, type)}
        onSelectInterval={(interval) => updateReminder(1, { interval: interval as ReminderInterval })}
      />
    </>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // The sheet's real card container (Alert.tsx styles.card)
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  // The sheet's real card title (Alert.tsx styles.cardTitle)
  cardTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
    marginBottom: SPACING.sm - 1,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  athanControl: {
    marginTop: SPACING.md,
  },
});
