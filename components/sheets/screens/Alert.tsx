import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Sheet, SegmentedControl, Stepper, Toggle, type SegmentOption } from '../parts';

import { IconView } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import { TEXT, SPACING, RADIUS, REMINDER_INTERVALS, DEFAULT_REMINDER_INTERVAL } from '@/shared/constants';
import { AlertType, Icon, ReminderInterval } from '@/shared/types';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

const ALERT_OPTIONS: SegmentOption[] = [
  { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

const REMINDER_TYPE_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

export default function BottomSheetAlert() {
  const sheetState = useAtomValue(alertSheetStateAtom);
  const { commitAlertMenuChanges, ensurePermissions } = useNotification();

  const [atTimeAlert, setAtTimeAlert] = useState<AlertType>(AlertType.Off);
  const [reminderAlert, setReminderAlert] = useState<AlertType>(AlertType.Off);
  const [reminderType, setReminderType] = useState<AlertType.Silent | AlertType.Sound>(AlertType.Silent);
  const [reminderInterval, setReminderInterval] = useState<ReminderInterval>(DEFAULT_REMINDER_INTERVAL);
  const [originalState, setOriginalState] = useState<{
    atTimeAlert: AlertType;
    reminderAlert: AlertType;
    reminderInterval: ReminderInterval;
  } | null>(null);

  const isReminderOn = reminderAlert !== AlertType.Off;
  const canEnableReminder = atTimeAlert !== AlertType.Off;

  useEffect(() => {
    if (sheetState) {
      const prayerAlert = getPrayerAlertType(sheetState.type, sheetState.index);
      const reminder = getReminderAlertType(sheetState.type, sheetState.index);
      const interval =
        (getReminderInterval(sheetState.type, sheetState.index) as ReminderInterval) || DEFAULT_REMINDER_INTERVAL;

      setAtTimeAlert(prayerAlert);
      setReminderAlert(reminder);
      setReminderType(reminder === AlertType.Sound ? AlertType.Sound : AlertType.Silent);
      setReminderInterval(interval);
      setOriginalState({ atTimeAlert: prayerAlert, reminderAlert: reminder, reminderInterval: interval });
    }
  }, [sheetState]);

  const handleDismiss = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sheetState && originalState) {
      await commitAlertMenuChanges(
        sheetState.type,
        sheetState.index,
        sheetState.prayerEnglish,
        sheetState.prayerArabic,
        originalState,
        { atTimeAlert, reminderAlert, reminderInterval }
      );
    }
  }, [sheetState, originalState, atTimeAlert, reminderAlert, reminderInterval, commitAlertMenuChanges]);

  const handleAlertSelect = useCallback(
    async (type: AlertType) => {
      if (type !== AlertType.Off && atTimeAlert === AlertType.Off) {
        await ensurePermissions();
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
    <Sheet
      setRef={setAlertSheetModal}
      title={sheetState?.prayerEnglish ?? ''}
      subtitle="Close to save"
      icon={<IconView type={Icon.BELL_RING} size={16} color="rgba(165, 180, 252, 0.8)" />}
      enableDynamicSizing
      scrollable={false}
      onDismiss={handleDismiss}>
      {/* Prayer Alert Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Athan</Text>
        <Text style={styles.cardHint}>Notification at prayer time</Text>
        <View style={{ marginTop: SPACING.md }}>
          <SegmentedControl
            key={sheetState ? `athan-${sheetState.type}-${sheetState.index}` : 'athan'}
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
              key={sheetState ? `reminder-${sheetState.type}-${sheetState.index}` : 'reminder'}
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
              unit="min"
              disabled={!isReminderOn}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}

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
