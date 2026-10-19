import { useAtomValue } from 'jotai';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import { prayerLabel, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import {
  type AlertMenuState,
  AlertType,
  Icon,
  type PerReminderSlot,
  REMINDER_SLOTS,
  type ReminderSetting,
  type ReminderSlot,
} from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { type AlertSheetState, alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

import { SegmentedControl, type SegmentOption, Sheet, VolumeNote } from '../parts';
import { freeReminderInterval } from '../parts/reminderStep';
import {
  initialReminderInterval,
  initialReminderType,
  selectionNeedsPermission,
  takenInterval,
  toggledReminder,
} from './alertDraft';
import ReminderCard from './ReminderCard';

// Resolved at call time so a locale switch reaches the labels on the next render
const alertOptions = (): SegmentOption[] => [
  { value: AlertType.Off, label: t('alert.option.off'), icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: t('alert.option.silent'), icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: t('alert.option.sound'), icon: Icon.SPEAKER },
];

// Nothing the user can do fixes a time the timetable did not give, so this explains and reassures without asking
// for an action: the saved setting returns by itself on the next occurrence with a readable time
// The hard lines are all within about 12dp of each other, so the centred block reads as an even paragraph, and at
// the default font size (and up to Android's Large) each fits a 360dp phone inside the padding below without
// wrapping a second time
const unavailableMessage = (): string => t('alert.unavailable');

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

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SHEET_PERF_NAME = 'sheet_alert';

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
    await commitAlertMenuChanges(sheetState.type, sheetState.index, sheetState.prayerId, originalState, currentState);
  }, [sheetState, commitAlertMenuChanges]);

  return (
    <Sheet
      setRef={setAlertSheetModal}
      title={sheetState ? prayerLabel(sheetState.prayerId) : ''}
      subtitle={t('sheet.closeToSave')}
      icon={<IconView type={Icon.BELL_RING} size={16} color={SHEET_ICON_COLOR} />}
      enableDynamicSizing
      contentCap={0.85}
      onDismiss={handleDismiss}
      perfName={SHEET_PERF_NAME}>
      {sheetState?.isUnavailable && (
        // No body is mounted, so its ref stays empty and the dismiss commits nothing
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>{unavailableMessage()}</Text>
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
      <VolumeNote />
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
 * commit (the AlertMenu pattern).
 *
 * While the mounted athan is Off, each reminder DRAFTS Off and a Silent pill
 * whatever the store holds, so the slide-off keeps today's pixels; the stored
 * choices live in the preserved ref alone until the athan turns back on.
 */
const AlertSheetBody = forwardRef<AlertSheetBodyRef, AlertSheetBodyProps>(({ sheetState, ensurePermissions }, ref) => {
  // The store's own settings for this prayer, snapshotted once at mount: the baseline the commit
  // rolls back to, and the preserved choices the off-to-on move restores from
  const [mountedState] = useState<AlertMenuState>(() => {
    const saved = (slot: ReminderSlot): ReminderSetting => ({
      alert: getReminderAlertType(sheetState.type, sheetState.index, slot),
      interval: initialReminderInterval(getReminderInterval(sheetState.type, sheetState.index, slot)),
    });

    return { atTimeAlert: getPrayerAlertType(sheetState.type, sheetState.index), reminders: [saved(0), saved(1)] };
  });

  const [atTimeAlert, setAtTimeAlert] = useState<AlertType>(mountedState.atTimeAlert);

  const [reminders, setReminders] = useState<PerReminderSlot<ReminderSetting>>(() =>
    mapSlots(mountedState.reminders, (reminder) => ({
      ...reminder,
      alert: atTimeAlert === AlertType.Off ? AlertType.Off : reminder.alert,
    }))
  );

  // Kept while a reminder is Off, so a toggle never loses the sound last chosen. Derived from the
  // draft, so a mounted Off athan opens on the Silent pill the slide-off shows
  const [sounds, setSounds] = useState<Record<ReminderSlot, AlertType.Silent | AlertType.Sound>>(() => ({
    0: initialReminderType(reminders[0].alert),
    1: initialReminderType(reminders[1].alert),
  }));

  // The reminder choices held while the athan is Off: the stored values at mount, re-snapshotted
  // from the live draft at every in-session move into Off. Intervals cannot move while the
  // reminders are locked off, so the alerts alone are what a restore needs
  const preservedAlertsRef = useRef<PerReminderSlot<AlertType>>([
    mountedState.reminders[0].alert,
    mountedState.reminders[1].alert,
  ]);

  useImperativeHandle(ref, () => ({
    getOriginalState: () => mountedState,
    getCurrentState: () => ({
      atTimeAlert,
      // Store truth at close: the draft displays Off beside an Off athan, so the preserved
      // choices stand in and the commit writes them
      reminders:
        atTimeAlert === AlertType.Off
          ? mapSlots(reminders, (reminder, slot) => ({ ...reminder, alert: preservedAlertsRef.current[slot] }))
          : reminders,
    }),
  }));

  const canEnableReminder = atTimeAlert !== AlertType.Off;

  const updateReminder = useCallback((slot: ReminderSlot, change: Partial<ReminderSetting>) => {
    setReminders((current) =>
      mapSlots(current, (reminder, index) => (index === slot ? { ...reminder, ...change } : reminder))
    );
  }, []);

  const handleAlertSelect = useCallback(
    async (type: AlertType) => {
      // Read before the permission await: the selection that lands is the one this press started
      const leavingOff = atTimeAlert === AlertType.Off && type !== AlertType.Off;
      if (selectionNeedsPermission({ selected: type, atTimeAlert })) {
        // A denied prompt must leave the control where it was. commitAlertMenuChanges
        // re-checks permissions at dismiss and saves nothing without them, so moving
        // the selection anyway left the user believing the athan was armed for this
        // prayer when nothing would ever fire. Returning here is also what removes
        // that second, now-redundant prompt at dismiss.
        if (!(await ensurePermissions())) return;
      }
      setAtTimeAlert(type);

      // The athan is back on: each reminder returns to the choice it held before the athan went
      // off, and the pill reads the sound that reminder fires with
      if (leavingOff) {
        const preserved = preservedAlertsRef.current;
        setReminders((current) => mapSlots(current, (reminder, slot) => ({ ...reminder, alert: preserved[slot] })));
        setSounds((current) => {
          const restored = { ...current };
          for (const slot of REMINDER_SLOTS) {
            const alert = preserved[slot];
            if (alert !== AlertType.Off) restored[slot] = alert;
          }
          return restored;
        });
        return;
      }

      // Into Off: the choices on screen are preserved, then the draft slides off exactly as today
      if (type === AlertType.Off && atTimeAlert !== AlertType.Off) {
        preservedAlertsRef.current = [reminders[0].alert, reminders[1].alert];
        setReminders((current) => mapSlots(current, (reminder) => ({ ...reminder, alert: AlertType.Off })));
      }
    },
    [atTimeAlert, ensurePermissions, reminders]
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
        <Text style={styles.cardTitle}>{t('alert.card.athan')}</Text>
        <Text style={styles.cardHint}>{t('alert.card.athanHint')}</Text>
        <View style={{ marginTop: SPACING.md }}>
          <SegmentedControl
            key={`athan-${sheetState.type}-${sheetState.index}`}
            options={alertOptions()}
            selected={atTimeAlert}
            onSelect={handleAlertSelect}
          />
        </View>
      </View>

      <ReminderCard
        title={t('alert.reminder', { n: 1 })}
        hint={t('alert.reminderHint')}
        reminder={reminders[0]}
        sound={sounds[0]}
        taken={takenInterval(reminders[1])}
        locked={!canEnableReminder}
        onToggle={() => handleReminderToggle(0)}
        onSelectSound={(type) => handleReminderSoundSelect(0, type)}
        onSelectInterval={(interval) => updateReminder(0, { interval })}
      />

      <ReminderCard
        title={t('alert.reminder', { n: 2 })}
        hint={t('alert.reminderHint')}
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

const ty = typographyFor(currentLocaleId());

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
  cardTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
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
    color: 'rgba(86, 134, 189, 0.725)',
  },
  reminderOptions: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.07)',
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
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: 'rgba(86, 134, 189, 0.725)',
    textAlign: 'center',
    lineHeight: ty.lineHeight(22),
  },
});
