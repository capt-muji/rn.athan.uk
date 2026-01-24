import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import SettingsIcon from '@/assets/icons/settings.svg';
import { useAnimationScale } from '@/hooks/useAnimation';
import { COLORS, SIZE, RADIUS, SHADOW, ELEVATION, HIT_SLOP, SPACING } from '@/shared/constants';
import { showSettingsSheet } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsButton() {
  const AnimScale = useAnimationScale(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showSettingsSheet();
  };

  const computedStylesContainer: ViewStyle = {
    backgroundColor: COLORS.settingsButton.background,
    borderColor: COLORS.settingsButton.border,
    shadowColor: COLORS.shadow.button,
  };

  return (
    <AnimatedPressable
      hitSlop={HIT_SLOP.lg}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <SettingsIcon width={SIZE.icon.md} height={SIZE.icon.md} style={styles.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.gap,
    borderRadius: RADIUS.rounded,
    borderWidth: 1,
    ...SHADOW.button,
    elevation: ELEVATION.subtle, // Android shadow (stacking handled by render order in index.tsx)
    width: SIZE.button.icon,
    alignItems: 'center',
  },
  icon: {
    color: COLORS.icon.muted,
  },
});
