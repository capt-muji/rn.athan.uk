import { useAtomValue } from 'jotai';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import {
  type AlertMenuState,
  AlertType,
  Icon,
  type PerReminderSlot,
  type ReminderSetting,
  type ReminderSlot,
} from '@/shared/types';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { type AlertSheetState, alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

import { SegmentedControl, type SegmentOption, Sheet } from '../parts';
import { freeReminderInterval } from '../parts/reminderStep';
import {
  initialReminderInterval,
  initialReminderType,
  selectionNeedsPermission,
  takenInterval,
  toggledReminder,
} from './alertDraft';
import ReminderCard from './ReminderCard';

const ALERT_OPTIONS: SegmentOption[] = [
  { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

// Nothing the user can do fixes a time the timetable did not give, so this explains and reassures without asking
// for an action: the saved setting returns by itself on the next occurrence with a readable time
// The hard lines are all within about 12dp of each other, so the centred block reads as an even paragraph, and at
// the default font size (and up to Android's Large) each fits a 360dp phone inside the padding below without
// wrapping a second time
const UNAVAILABLE_MESSAGE = [
  "This prayer's time isn't available",
  'right now, so no alert will go off.',
  '',
  'Your alert setting is kept and will',
  'return once a time is available.',
].join('\n');

interface AlertSheetBodyRef {
  /** Values snapshotted at mount — the change-detection baseline for the deferred commit */
  getOriginalState: () => AlertMenuState;
  /** Live draft values at the moment of the call */
  getCurrentState: () => AlertMenuState;
}

/** Both slots through one change, so a writer never has to assert the pair's shape back */
const mapSlots = (
  reminders: PerReminderSlot<ReminderSetting>,
  change: (reminder: ReminderSetting, slot: ReminderSlot) => ReminderSetting
): PerReminderSlot<ReminderSetting> => [change(reminders[0], 0), change(reminders[1], 1)];

interface AlertSheetBodyProps {
  sheetState: AlertSheetState;
  ensurePermissions: () => Promise<boolean>;
}

export default function BottomSheetAlert() {
  const sheetState = useAtomValue(alertSheetStateAtom);
  const { commitAlertMenuChanges, ensurePermissions } = useNotification();
  const bodyRef = useRef<AlertSheetBodyRef>(null);

  // Fires synchronously before React unmounts the modal content (@gorhom
  // BottomSheetModal calls onDismiss right after scheduling the unmount), so
  // the body ref is still live here — see AlertSheetBody below
  const handleDismiss = useCallback(async () => {
    if (!sheetState) return;
    const body = bodyRef.current;
    if (!body) return;

    const originalState = body.getOriginalState();
    const currentState = body.getCurrentState();
    await commitAlertMenuChanges(
      sheetState.type,
      sheetState.index,
      sheetState.prayerEnglish,
      sheetState.prayerArabic,
      originalState,
      currentState
    );
  }, [sheetState, commitAlertMenuChanges]);

  return (
    <Sheet
      setRef={setAlertSheetModal}
      title={sheetState?.prayerEnglish ?? ''}
      subtitle='Close to save'
      icon={<IconView type={Icon.BELL_RING} size={16} color='rgba(165, 180, 252, 0.8)' />}
      enableDynamicSizing
      contentCap={0.85}
      onDismiss={handleDismiss}
      perfName='sheet_alert'>
      {sheetState?.isUnavailable && (
        // No body is mounted, so its ref stays empty and the dismiss commits nothing
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>{UNAVAILABLE_MESSAGE}</Text>
        </View>
      )}
      {sheetState && !sheetState.isUnavailable && (
        <AlertSheetBody
          key={`${sheetState.type}:${sheetState.index}`}
          ref={bodyRef}
          sheetState={sheetState}
          ensurePermissions={ensurePermissions}
        />
      )}
    </Sheet>
  );
}

// =============================================================================
// SHEET BODY
// =============================================================================

/**
 * Alert sheet content, keyed per prayer by the parent so it remounts on every
 * open (the modal unmounts its content on dismiss, and the key covers prayer
 * changes while mounted).
 *
 * Draft state initializes AT MOUNT from the synchronous MMKV-backed store
 * getters, so the values are correct in the same render that mounts the
 * content — an effect-driven load painted the Off defaults first and
 * corrected them after, which surfaced as the first-frame flash. The parent
 * reads the draft via the imperative handle at dismiss for the deferred
 * commit (the AlertMenu pattern, ai/AGENTS.md §Component Communication).
 */
const AlertSheetBody = forwardRef<AlertSheetBodyRef, AlertSheetBodyProps>(({ sheetState, ensurePermissions }, ref) => {
  const [atTimeAlert, setAtTimeAlert] = useState<AlertType>(() =>
    getPrayerAlertType(sheetState.type, sheetState.index)
  );
  const [reminders, setReminders] = useState<PerReminderSlot<ReminderSetting>>(() => {
    const saved = (slot: ReminderSlot): ReminderSetting => ({
      alert: getReminderAlertType(sheetState.type, sheetState.index, slot),
      interval: initialReminderInterval(getReminderInterval(sheetState.type, sheetState.index, slot)),
    });

    return [saved(0), saved(1)];
  });

  // Kept while a reminder is Off, so a toggle never loses the sound last chosen
  const [sounds, setSounds] = useState<Record<ReminderSlot, AlertType.Silent | AlertType.Sound>>(() => ({
    0: initialReminderType(getReminderAlertType(sheetState.type, sheetState.index, 0)),
    1: initialReminderType(getReminderAlertType(sheetState.type, sheetState.index, 1)),
  }));

  const originalStateRef = useRef<AlertMenuState>({ atTimeAlert, reminders });

  useImperativeHandle(ref, () => ({
    getOriginalState: () => originalStateRef.current,
    getCurrentState: () => ({ atTimeAlert, reminders }),
  }));

  const canEnableReminder = atTimeAlert !== AlertType.Off;

  const updateReminder = useCallback((slot: ReminderSlot, change: Partial<ReminderSetting>) => {
    setReminders((current) =>
      mapSlots(current, (reminder, index) => (index === slot ? { ...reminder, ...change } : reminder))
    );
  }, []);

  const handleAlertSelect = useCallback(
    async (type: AlertType) => {
      if (selectionNeedsPermission({ selected: type, atTimeAlert })) {
        // A denied prompt must leave the control where it was. commitAlertMenuChanges
        // re-checks permissions at dismiss and saves nothing without them, so moving
        // the selection anyway left the user believing the athan was armed for this
        // prayer when nothing would ever fire. Returning here is also what removes
        // that second, now-redundant prompt at dismiss.
        if (!(await ensurePermissions())) return;
      }
      setAtTimeAlert(type);
      if (type === AlertType.Off) {
        setReminders((current) => mapSlots(current, (reminder) => ({ ...reminder, alert: AlertType.Off })));
      }
    },
    [atTimeAlert, ensurePermissions]
  );

  const handleReminderToggle = useCallback(
    (slot: ReminderSlot) => {
      const other = reminders[slot === 0 ? 1 : 0];
      const next = toggledReminder({
        canEnableReminder: canEnableReminder && (slot === 0 || reminders[0].alert !== AlertType.Off),
        isReminderOn: reminders[slot].alert !== AlertType.Off,
        reminderType: sounds[slot],
      });
      if (next === null) return;

      // Switching on beside a reminder already holding this minute moves to the nearest free one, which is the
      // only moment a value can change without a press on its own stepper
      const interval =
        next === AlertType.Off
          ? reminders[slot].interval
          : freeReminderInterval(reminders[slot].interval, takenInterval(other));

      updateReminder(slot, { alert: next, interval });
    },
    [canEnableReminder, reminders, sounds, updateReminder]
  );

  const handleReminderSoundSelect = useCallback(
    (slot: ReminderSlot, type: AlertType) => {
      setSounds((current) => ({ ...current, [slot]: type as AlertType.Silent | AlertType.Sound }));
      updateReminder(slot, { alert: type });
    },
    [updateReminder]
  );

  return (
    <>
      {/* Prayer Alert Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Athan</Text>
        <Text style={styles.cardHint}>Notification at prayer time</Text>
        <View style={{ marginTop: SPACING.md }}>
          <SegmentedControl
            key={`athan-${sheetState.type}-${sheetState.index}`}
            options={ALERT_OPTIONS}
            selected={atTimeAlert}
            onSelect={handleAlertSelect}
          />
        </View>
      </View>

      <ReminderCard
        title='Reminder 1'
        hint='Notification before prayer time'
        reminder={reminders[0]}
        sound={sounds[0]}
        taken={takenInterval(reminders[1])}
        locked={!canEnableReminder}
        onToggle={() => handleReminderToggle(0)}
        onSelectSound={(type) => handleReminderSoundSelect(0, type)}
        onSelectInterval={(interval) => updateReminder(0, { interval })}
      />

      <ReminderCard
        title='Reminder 2'
        hint='Notification before prayer time'
        reminder={reminders[1]}
        sound={sounds[1]}
        taken={takenInterval(reminders[0])}
        locked={!canEnableReminder || reminders[0].alert === AlertType.Off}
        onToggle={() => handleReminderToggle(1)}
        onSelectSound={(type) => handleReminderSoundSelect(1, type)}
        onSelectInterval={(interval) => updateReminder(1, { interval })}
      />
    </>
  );
});

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Cards - shadcn inspired with indigo theme
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
  // Centred both ways in a box about as tall as the options it stands in for. The short lines keep the block
  // narrow and well inside the title's edge; the padding only guarantees that on the narrowest phones
  unavailable: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl,
    marginBottom: SPACING.md,
  },
  // The header subtitle's own dim colour and size
  unavailableText: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
