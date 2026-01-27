import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS, SIZE, RADIUS, ANIMATION } from '@/shared/constants';

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
  const isFirstRender = useRef(true);
  const translateX = useSharedValue(value ? SIZE.toggle.translateX : 0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    translateX.value = withTiming(value ? SIZE.toggle.translateX : 0, { duration: ANIMATION.duration });
  }, [value]);

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
