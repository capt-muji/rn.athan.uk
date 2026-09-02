import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { ANIMATION, COLORS, RADIUS, SIZE } from '@/shared/constants';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Raw toggle switch primitive for binary on/off states.
 *
 * Features:
 * - Animated thumb with smooth sliding transition
 * - Haptic feedback on toggle
 * - Disabled state with reduced opacity
 *
 * @example
 * <Toggle value={isOn} onToggle={() => setIsOn(!isOn)} />
 */
export default function Toggle({ value, onToggle, disabled }: ToggleProps) {
  // Derived, not effect-driven: every value flip re-runs the timing from the
  // thumb's live position on the UI thread, so the knob always converges on
  // the current value. The previous effect + JS-side shared-value
  // assignments raced under fast toggling — the G.3 knob desync and the
  // suspected rapid-press crash (G.8) both live in that race window.
  // First evaluation snaps instead of animating: a toggle mounted in the ON
  // state (persisted preferences) must appear settled, not slide in — the
  // mount behavior of the previous implementation, preserved exactly.
  const isFirstEvaluation = useSharedValue(true);
  const translateX = useDerivedValue(() => {
    const target = value ? SIZE.toggle.translateX : 0;
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return target;
    }
    return withTiming(target, { duration: ANIMATION.duration });
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} style={[styles.track, value && styles.trackOn, disabled && styles.disabled]}>
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
