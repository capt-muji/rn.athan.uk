import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CONTROL_WASH, type DimState, dimDisables, STEPPER_INK } from '@/components/sheets/parts/dim';
import { RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { ReminderInterval } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { stepReminderInterval } from './reminderStep';

// =============================================================================
// TYPES
// =============================================================================

export interface StepperProps {
  value: ReminderInterval;
  onDecrement: () => void;
  onIncrement: () => void;
  unit?: string;
  /** Which wrapper dim the stepper renders under; the ink and wash come from its tables */
  dim?: DimState;
  /** The other reminder's interval while it is on, so this stepper can neither reach nor offer it */
  taken?: number | null;
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
export default function Stepper({
  value,
  onDecrement,
  onIncrement,
  unit = t('reminder.unitMinutes'),
  dim = 'rest',
  taken = null,
}: StepperProps) {
  const disabled = dimDisables(dim);
  const ink = STEPPER_INK[dim];
  const nextDown = stepReminderInterval(value, -1, taken);
  const nextUp = stepReminderInterval(value, 1, taken);
  const canDecrement = !disabled && nextDown !== null;
  const canIncrement = !disabled && nextUp !== null;
  const visible = String(value);

  return (
    <View style={[styles.container, { backgroundColor: CONTROL_WASH[dim] }]}>
      <Pressable
        accessibilityRole={'button'}
        // The glyph is a minus sign, which reads as nothing useful; name the action and
        // the unit so the control is usable without seeing the value beside it
        accessibilityLabel={t('stepper.decrease', { value: nextDown ?? value, unit })}
        accessibilityState={{ disabled: !canDecrement }}
        style={styles.button}
        onPress={() => {
          if (canDecrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }
        }}>
        <Text style={[styles.buttonText, { color: canDecrement ? ink.glyph : ink.glyphBoundary }]}>{'−'}</Text>
      </Pressable>
      <View accessible={true} accessibilityLabel={t('stepper.value', { value, unit })} style={styles.valueContainer}>
        <Text style={[styles.value, { color: ink.value }]}>{visible}</Text>
        <Text style={[styles.unit, { color: ink.unit }]}>{unit}</Text>
      </View>
      <Pressable
        accessibilityRole={'button'}
        accessibilityLabel={t('stepper.increase', { value: nextUp ?? value, unit })}
        accessibilityState={{ disabled: !canIncrement }}
        style={styles.button}
        onPress={() => {
          if (canIncrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onIncrement();
          }
        }}>
        <Text style={[styles.buttonText, { color: canIncrement ? ink.glyph : ink.glyphBoundary }]}>+</Text>
      </Pressable>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  buttonText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  value: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
  },
  unit: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    marginStart: 3,
  },
});
