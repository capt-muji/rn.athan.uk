import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { TEXT, SPACING, RADIUS, REMINDER_INTERVALS } from '@/shared/constants';
import { ReminderInterval } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface StepperProps {
  value: ReminderInterval;
  onDecrement: () => void;
  onIncrement: () => void;
  unit?: string;
  disabled?: boolean;
}

// =============================================================================
// STEPPER
// =============================================================================

/**
 * Increment/decrement stepper for reminder intervals.
 * Buttons disable at boundary values (5min and 30min).
 *
 * @example
 * <Stepper
 *   value={reminderInterval}
 *   onDecrement={handleDecrement}
 *   onIncrement={handleIncrement}
 *   unit="min"
 * />
 */
export default function Stepper({ value, onDecrement, onIncrement, unit = 'min', disabled }: StepperProps) {
  const currentIndex = REMINDER_INTERVALS.indexOf(value);
  const canDecrement = !disabled && currentIndex > 0;
  const canIncrement = !disabled && currentIndex < REMINDER_INTERVALS.length - 1;

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Pressable
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={() => {
          if (canDecrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }
        }}>
        <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>−</Text>
      </Pressable>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Pressable
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={() => {
          if (canIncrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onIncrement();
          }
        }}>
        <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  disabled: {
    opacity: 0.4,
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
