import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, HIT_SLOP, SPACING, TEXT } from '@/shared/constants';

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
  return (
    <Pressable style={styles.container} onPress={onToggle} hitSlop={HIT_SLOP.md}>
      <Text style={styles.label}>{label}</Text>
      <Toggle value={value} onToggle={onToggle} />
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
