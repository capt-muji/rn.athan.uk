import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationColor, useAnimationFill } from '@/hooks/useAnimations';
import { COLORS, TEXT } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom, setSoundPreference } from '@/stores/notifications';

interface Props {
  index: number;
}

export default function ActionSheetSoundItem({ index }: Props) {
  const selectedSound = useAtomValue(soundPreferenceAtom);

  const isSelected = index === selectedSound;

  const textAnimation = useAnimationColor(isSelected ? 1 : 0, { fromColor: COLORS.textSecondary, toColor: 'white' });
  const iconAnimation = useAnimationFill(isSelected ? 1 : 0, { fromColor: COLORS.textSecondary, toColor: 'white' });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSoundPreference(index);
  };

  return (
    <Pressable style={styles.option} onPress={handlePress}>
      <Animated.Text style={[styles.text, textAnimation.style]}>Athan {index + 1}</Animated.Text>
      <Pressable style={styles.icon}>
        <Icon type={AlertIcon.PLAY} size={22} animatedProps={iconAnimation.animatedProps} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  text: {
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  icon: {},
});
