import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import IconView from '@/components/Icon';
import { useNotification } from '@/hooks/useNotification';
import {
  TEXT,
  SPACING,
  RADIUS,
  REMINDER_INTERVALS,
  DEFAULT_REMINDER_INTERVAL,
  COLORS,
  SIZE,
  ANIMATION,
} from '@/shared/constants';
import { AlertType, Icon, ReminderInterval } from '@/shared/types';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';

// =============================================================================
// SEGMENTED CONTROL
// =============================================================================

interface SegmentOption {
  value: AlertType;
  label: string;
  icon: Icon;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selected: AlertType;
  onSelect: (value: AlertType) => void;
  disabled?: boolean;
}

function SegmentedControl({ options, selected, onSelect, disabled }: SegmentedControlProps) {
  return (
    <View style={[segmentStyles.container, disabled && segmentStyles.disabled]}>
      {options.map((option, index) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              segmentStyles.option,
              index === 0 && segmentStyles.first,
              index === options.length - 1 && segmentStyles.last,
              isSelected && segmentStyles.selected,
            ]}
            onPress={() => {
              if (!disabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.value);
              }
            }}>
            <IconView type={option.icon} size={13} color={isSelected ? '#fff' : 'rgb(95, 133, 177)'} />
            <Text style={[segmentStyles.label, isSelected && segmentStyles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segmentStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.md - 2,
  },
  first: {},
  last: {},
  selected: {
    backgroundColor: COLORS.interactive.active,
  },
  label: {
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
    color: 'rgb(95, 133, 177)',
  },
  labelSelected: {
    color: '#fff',
  },
});

// =============================================================================
// TOGGLE (matches SettingsToggle)
// =============================================================================

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function Toggle({ value, onToggle, disabled }: ToggleProps) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? SIZE.toggle.translateX : 0, { duration: ANIMATION.duration }) }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggle();
        }
      }}
      style={[toggleStyles.track, value && toggleStyles.trackOn, disabled && toggleStyles.disabled]}>
      <Animated.View style={[toggleStyles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: SIZE.toggle.width,
    height: SIZE.toggle.height,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.interactive.inactive,
    borderWidth: 1,
    borderColor: COLORS.interactive.inactiveBorder,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: COLORS.interactive.active,
    borderColor: COLORS.interactive.activeBorder,
  },
  disabled: {
    opacity: 0.4,
  },
  thumb: {
    width: SIZE.toggle.dotSize,
    height: SIZE.toggle.dotSize,
    borderRadius: SIZE.toggle.dotSize / 2,
    backgroundColor: COLORS.text.primary,
  },
});

// =============================================================================
// STEPPER
// =============================================================================

interface StepperProps {
  value: ReminderInterval;
  onDecrement: () => void;
  onIncrement: () => void;
}

function Stepper({ value, onDecrement, onIncrement }: StepperProps) {
  const currentIndex = REMINDER_INTERVALS.indexOf(value);
  const canDecrement = currentIndex > 0;
  const canIncrement = currentIndex < REMINDER_INTERVALS.length - 1;

  return (
    <View style={stepperStyles.container}>
      <Pressable
        style={[stepperStyles.button, !canDecrement && stepperStyles.buttonDisabled]}
        onPress={() => {
          if (canDecrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }
        }}>
        <Text style={[stepperStyles.buttonText, !canDecrement && stepperStyles.buttonTextDisabled]}>−</Text>
      </Pressable>
      <View style={stepperStyles.valueContainer}>
        <Text style={stepperStyles.value}>{value}</Text>
        <Text style={stepperStyles.unit}>min</Text>
      </View>
      <Pressable
        style={[stepperStyles.button, !canIncrement && stepperStyles.buttonDisabled]}
        onPress={() => {
          if (canIncrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onIncrement();
          }
        }}>
        <Text style={[stepperStyles.buttonText, !canIncrement && stepperStyles.buttonTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  button: {
    paddingVertical: SPACING.smd,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md - 2,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: 'rgb(234, 242, 250)',
  },
  buttonTextDisabled: {
    color: 'rgb(50, 98, 150)',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  value: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: '#fff',
  },
  unit: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgb(95, 133, 177)',
    marginLeft: 3,
  },
});

// =============================================================================
// COMPACT TYPE SELECTOR
// =============================================================================

interface TypeSelectorProps {
  selected: AlertType;
  onSelect: (value: AlertType) => void;
}

function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  return (
    <View style={typeSelectorStyles.container}>
      <Pressable
        style={[typeSelectorStyles.option, selected === AlertType.Silent && typeSelectorStyles.selected]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(AlertType.Silent);
        }}>
        <IconView
          type={Icon.BELL_RING}
          size={13}
          color={selected === AlertType.Silent ? '#ffffff' : 'rgb(95, 133, 177)'}
        />
        <Text style={[typeSelectorStyles.label, selected === AlertType.Silent && typeSelectorStyles.labelSelected]}>
          Silent
        </Text>
      </Pressable>
      <Pressable
        style={[typeSelectorStyles.option, selected === AlertType.Sound && typeSelectorStyles.selected]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(AlertType.Sound);
        }}>
        <IconView type={Icon.SPEAKER} size={13} color={selected === AlertType.Sound ? '#fff' : 'rgb(95, 133, 177)'} />
        <Text style={[typeSelectorStyles.label, selected === AlertType.Sound && typeSelectorStyles.labelSelected]}>
          Sound
        </Text>
      </Pressable>
    </View>
  );
}

const typeSelectorStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.md - 2,
  },
  selected: {
    backgroundColor: COLORS.interactive.active,
  },
  label: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgb(95, 133, 177)',
  },
  labelSelected: {
    color: '#fff',
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ALERT_OPTIONS: SegmentOption[] = [
  { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

export default function BottomSheetAlert() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

  const sheetState = useAtomValue(alertSheetStateAtom);
  const { commitAlertMenuChanges, ensurePermissions } = useNotification();

  const [atTimeAlert, setAtTimeAlert] = useState<AlertType>(AlertType.Off);
  const [reminderAlert, setReminderAlert] = useState<AlertType>(AlertType.Off);
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
    setReminderAlert(isReminderOn ? AlertType.Off : AlertType.Silent);
  }, [canEnableReminder, isReminderOn]);

  const handleReminderTypeSelect = useCallback((type: AlertType) => {
    setReminderAlert(type);
  }, []);

  return (
    <BottomSheetModal
      ref={(ref) => setAlertSheetModal(ref)}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleDismiss}
      style={bottomSheetStyles.modal}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      <BottomSheetView style={[styles.content, { paddingBottom: bottom + SPACING.xxxl }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{sheetState?.prayerEnglish ?? ''}</Text>
            <Text style={styles.subtitle}>Notification settings</Text>
          </View>
          <View style={styles.headerIcon}>
            <IconView type={Icon.BELL_RING} size={16} color="rgba(165, 180, 252, 0.8)" />
          </View>
        </View>

        {/* Prayer Alert Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Athan</Text>
          <Text style={styles.cardHint}>Notification at the prayer time</Text>
          <SegmentedControl options={ALERT_OPTIONS} selected={atTimeAlert} onSelect={handleAlertSelect} />
        </View>

        {/* Reminder Card */}
        <View style={[styles.card, !canEnableReminder && styles.cardDisabled]}>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardTitle}>Reminder</Text>
              <Text style={styles.cardHint}>Notification before prayer</Text>
            </View>
            <Toggle value={isReminderOn} onToggle={handleReminderToggle} disabled={!canEnableReminder} />
          </View>

          {isReminderOn && (
            <View style={styles.reminderOptions}>
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Sound</Text>
                <TypeSelector selected={reminderAlert} onSelect={handleReminderTypeSelect} />
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
                />
              </View>
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.xl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: TEXT.family.medium,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: SPACING.xxs,
  },
  subtitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
    marginTop: SPACING.xs,
  },

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
    opacity: 0.4,
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
    marginBottom: SPACING.md,
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
    fontSize: 13,
    fontFamily: TEXT.family.regular,
    color: 'rgb(146, 184, 228)',
    width: 100,
  },
});
