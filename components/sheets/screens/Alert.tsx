import { useAtomValue } from 'jotai';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconView } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import {
  DEFAULT_REMINDER_INTERVAL,
  RADIUS,
  REMINDER_INTERVALS,
  SPACING,
  TEXT,
  validateReminderInterval,
} from '@/shared/constants';
import { type AlertMenuState, AlertType, Icon, type ReminderInterval } from '@/shared/types';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { type AlertSheetState, alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

import { SegmentedControl, type SegmentOption, Sheet, Stepper, Toggle } from '../parts';

const ALERT_OPTIONS: SegmentOption[] = [
  { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

const REMINDER_TYPE_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

interface AlertSheetBodyRef {
  /** Values snapshotted at mount — the change-detection baseline for the deferred commit */
  getOriginalState: () => AlertMenuState;
  /** Live draft values at the moment of the call */
  getCurrentState: () => AlertMenuState;
}

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
      scrollable={false}
      onDismiss={handleDismiss}
      perfName='sheet_alert'>
      {sheetState && (
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
  const [reminderAlert, setReminderAlert] = useState<AlertType>(() =>
    getReminderAlertType(sheetState.type, sheetState.index)
  );
  const [reminderType, setReminderType] = useState<AlertType.Silent | AlertType.Sound>(() => {
    const reminder = getReminderAlertType(sheetState.type, sheetState.index);
    return reminder === AlertType.Sound ? AlertType.Sound : AlertType.Silent;
  });
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval>(() => {
    // The declared ReminderInterval is a cast the store makes over a raw MMKV
    // number, so it is a claim rather than a guarantee. The old `|| DEFAULT`
    // caught 0 and undefined but let any other stale number through: it would
    // paint in the Stepper with both arrows dead, because REMINDER_INTERVALS
    // .indexOf returns -1 and neither branch moves off it, and it would be
    // committed straight into the reminder offset. Reachable the day
    // REMINDER_INTERVALS changes, which is exactly when the cast stops holding.
    const stored = getReminderInterval(sheetState.type, sheetState.index);
    return validateReminderInterval(stored) ? stored : DEFAULT_REMINDER_INTERVAL;
  });

  const originalStateRef = useRef<AlertMenuState>({
    atTimeAlert,
    reminderAlert,
    reminderInterval,
  });

  useImperativeHandle(ref, () => ({
    getOriginalState: () => originalStateRef.current,
    getCurrentState: () => ({ atTimeAlert, reminderAlert, reminderInterval }),
  }));

  const isReminderOn = reminderAlert !== AlertType.Off;
  const canEnableReminder = atTimeAlert !== AlertType.Off;

  const handleAlertSelect = useCallback(
    async (type: AlertType) => {
      if (type !== AlertType.Off && atTimeAlert === AlertType.Off) {
        // A denied prompt must leave the control where it was. commitAlertMenuChanges
        // re-checks permissions at dismiss and saves nothing without them, so moving
        // the selection anyway left the user believing the athan was armed for this
        // prayer when nothing would ever fire. Returning here is also what removes
        // that second, now-redundant prompt at dismiss.
        if (!(await ensurePermissions())) return;
      }
      setAtTimeAlert(type);
      if (type === AlertType.Off) {
        setReminderAlert(AlertType.Off);
      }
    },
    [atTimeAlert, ensurePermissions]
  );

  const handleReminderToggle = useCallback(() => {
    if (!canEnableReminder) return;
    setReminderAlert(isReminderOn ? AlertType.Off : reminderType);
  }, [canEnableReminder, isReminderOn, reminderType]);

  const handleReminderTypeSelect = useCallback((type: AlertType) => {
    setReminderAlert(type);
    setReminderType(type as AlertType.Silent | AlertType.Sound);
  }, []);

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

      {/* Reminder Card */}
      <View style={[styles.card, !canEnableReminder && styles.cardDisabled]}>
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardTitle}>Reminder</Text>
            <Text style={styles.cardHint}>Notification before prayer time</Text>
          </View>
          <Toggle value={isReminderOn} onToggle={handleReminderToggle} disabled={!canEnableReminder} />
        </View>

        <View style={[styles.reminderOptions, !isReminderOn && styles.optionsDisabled]}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Sound</Text>
            <SegmentedControl
              key={`reminder-${sheetState.type}-${sheetState.index}`}
              options={REMINDER_TYPE_OPTIONS}
              selected={reminderType}
              onSelect={handleReminderTypeSelect}
              disabled={!isReminderOn}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Before</Text>
            <Stepper
              value={reminderInterval}
              onDecrement={() => {
                const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
                if (idx > 0) setReminderInterval(REMINDER_INTERVALS[idx - 1] as ReminderInterval);
              }}
              onIncrement={() => {
                const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
                if (idx < REMINDER_INTERVALS.length - 1)
                  setReminderInterval(REMINDER_INTERVALS[idx + 1] as ReminderInterval);
              }}
              unit='min'
              disabled={!isReminderOn}
            />
          </View>
        </View>
      </View>
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
});
