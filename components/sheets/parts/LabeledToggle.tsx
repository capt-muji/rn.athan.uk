import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, HIT_SLOP, SPACING, TEXT } from '@/shared/constants';
import { perfMark } from '@/shared/perf';

import Toggle from './Toggle';

interface LabeledToggleProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

/**
 * Labeled toggle - composes Toggle primitive with a text label.
 *
 * @example
 * <LabeledToggle label="Enable feature" value={enabled} onToggle={() => setEnabled(!enabled)} />
 */
export default function LabeledToggle({ label, value, onToggle }: LabeledToggleProps) {
  const handleToggle = () => {
    perfMark('toggle_tap', { label });
    onToggle();
  };

  return (
    // The label names the row's own switch, which carries the role and the checked state. The
    // row stays unnamed on purpose: naming it too would have a screen reader offer two controls
    // for one setting, and the switch is the one that reports its state
    <Pressable style={styles.container} onPress={handleToggle} hitSlop={HIT_SLOP.md} accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <Toggle value={value} onToggle={handleToggle} accessibilityLabel={label} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.smd,
  },
  label: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
  },
});
