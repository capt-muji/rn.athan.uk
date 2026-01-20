import * as Haptics from 'expo-haptics';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { TEXT, STYLES } from '@/shared/constants';

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
        translateX: withTiming(value ? 18 : 0, { duration: 200 }),
      },
    ],
  }));

  return (
    <Pressable style={styles.container} onPress={handlePress} hitSlop={10}>
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
    borderBottomColor: '#ffffff10',
  },
  label: {
    color: 'white',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e2e63',
    borderWidth: 1,
    borderColor: '#3b3977',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#6023c9',
    borderColor: '#7e3bf1',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
});
