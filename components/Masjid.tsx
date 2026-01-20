import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/assets/icons/masjid.svg';
import { useAnimationScale } from '@/hooks/useAnimation';
import { overlayAtom } from '@/stores/overlay';
import { showSettingsSheet } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 55, width = 55 }: MasjidProps) {
  const AnimScale = useAnimationScale(1);
  const overlay = useAtomValue(overlayAtom);

  const handlePress = () => {
    if (overlay.isOn) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showSettingsSheet();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => !overlay.isOn && AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}
      style={AnimScale.style}
      hitSlop={15}
      disabled={overlay.isOn}>
      <Icon style={styles.icon} height={height} width={width} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    shadowColor: '#EF9C29',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});
