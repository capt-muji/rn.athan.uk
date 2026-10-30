import * as Haptics from 'expo-haptics';
import { forwardRef, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { ToggleHandle } from '@/components/sheets/parts/Toggle';
import { COLORS, HIT_SLOP, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { perfMark } from '@/shared/perf';
import { typographyFor } from '@/shared/typography';

import Toggle from './Toggle';

interface LabeledToggleProps {
  label: string;
  value: boolean;
  onToggle: (next: boolean) => void;
}

/**
 * Labeled toggle - composes Toggle primitive with a text label.
 *
 * @example
 * <LabeledToggle label="Enable feature" value={enabled} onToggle={(next) => setEnabled(next)} />
 */
const LabeledToggle = forwardRef<unknown, LabeledToggleProps>(({ label, value, onToggle }) => {
  // The one place both presses meet: the row's label routes through the switch's
  // own press, so the thumb flips, the haptic lands and the write settles
  // identically whichever was touched - the feedback rides the switch's own
  // press path, once either way
  const toggleRef = useRef<ToggleHandle>(null);

  const handleLabelPress = () => toggleRef.current?.press();

  const handleSwitchPress = () => {
    perfMark('toggle_tap', { label });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    // The label names the row's own switch, which carries the role and the checked state. The
    // row stays unnamed on purpose: naming it too would have a screen reader offer two controls
    // for one setting, and the switch is the one that reports its state
    <Pressable style={styles.container} onPress={handleLabelPress} hitSlop={HIT_SLOP.md} accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <Toggle
        ref={toggleRef}
        value={value}
        onToggle={onToggle}
        onPress={handleSwitchPress}
        accessibilityLabel={label}
      />
    </Pressable>
  );
});

export default LabeledToggle;

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.smd,
  },
  label: {
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
});
