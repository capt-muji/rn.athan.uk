import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import SettingsIcon from '@/assets/icons/settings.svg';
import { useAnimationScale } from '@/hooks/useAnimation';
import { COLORS } from '@/shared/constants';
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
      hitSlop={15}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <SettingsIcon width={20} height={20} style={styles.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5, // Android shadow (stacking handled by render order in index.tsx)
    width: 43,
    alignItems: 'center',
  },
  icon: {
    color: COLORS.icon.muted,
  },
});
