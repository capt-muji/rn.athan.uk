import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationScale } from '@/hooks/useAnimation';
import { showSettingsSheet } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SettingsButton() {
  const AnimScale = useAnimationScale(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showSettingsSheet();
  };

  const computedStylesContainer: ViewStyle = {
    backgroundColor: '#6941c649',
    borderColor: '#5b33b875',
    shadowColor: '#27035c',
  };

  const iconColor = '#a885f896';

  return (
    <AnimatedPressable
      hitSlop={15}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <Ionicons name="settings-outline" size={20} color={iconColor} />
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
    elevation: 10,
    width: 45,
    alignItems: 'center',
  },
});
