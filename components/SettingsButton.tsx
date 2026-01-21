import * as Haptics from 'expo-haptics';
import { Pressable, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationScale } from '@/hooks/useAnimation';
import { TEXT } from '@/shared/constants';
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

  const computedStylesText: TextStyle = { color: '#bb9ffdd9' };

  return (
    <AnimatedPressable
      hitSlop={15}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <Text style={[styles.text, computedStylesText]}>Settings</Text>
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
    width: 85,
    alignItems: 'center',
  },
  text: {
    color: '#bb9ffdd9',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmaller,
  },
});
