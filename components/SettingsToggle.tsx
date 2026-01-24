import * as Haptics from 'expo-haptics';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { TEXT, STYLES, COLORS, SIZE, RADIUS, ANIMATION, HIT_SLOP } from '@/shared/constants';

interface SettingsToggleProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

export default function SettingsToggle({ label, value, onToggle }: SettingsToggleProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const toggleDotStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(value ? SIZE.toggle.translateX : 0, { duration: ANIMATION.duration }),
      },
    ],
  }));

  return (
    <Pressable style={styles.container} onPress={handlePress} hitSlop={HIT_SLOP.md}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <Animated.View style={[styles.toggleDot, toggleDotStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: STYLES.prayer.height,
    paddingHorizontal: STYLES.prayer.padding.left,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  label: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  toggle: {
    width: SIZE.toggle.width,
    height: SIZE.toggle.height,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.interactive.inactive,
    borderWidth: 1,
    borderColor: COLORS.interactive.inactiveBorder,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.interactive.active,
    borderColor: COLORS.interactive.activeBorder,
  },
  toggleDot: {
    width: SIZE.toggle.dotSize,
    height: SIZE.toggle.dotSize,
    borderRadius: SIZE.toggle.dotSize / 2,
    backgroundColor: COLORS.text.primary,
  },
});
