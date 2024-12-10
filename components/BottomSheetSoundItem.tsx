import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationBackgroundColor, useAnimationColor, useAnimationFill } from '@/hooks/useAnimations';
import { ANIMATION, SCREEN, STYLES, TEXT } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom, setSoundPreference } from '@/stores/notifications';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  index: number;
}

export default function BottomSheetSoundItem({ index }: Props) {
  const selectedSound = useAtomValue(soundPreferenceAtom);

  const isSelected = index === selectedSound;

  const textAnimation = useAnimationColor(isSelected ? 1 : 0, { fromColor: '#425ea7', toColor: 'white' });
  const iconAnimation = useAnimationFill(isSelected ? 1 : 0, { fromColor: '#425ea7', toColor: 'white' });
  const backgroundAnimation = useAnimationBackgroundColor(isSelected ? 1 : 0, {
    fromColor: 'transparent',
    toColor: '#3623ab',
  });

  textAnimation.animate(isSelected ? 1 : 0, { duration: ANIMATION.duration });
  iconAnimation.animate(isSelected ? 1 : 0, { duration: ANIMATION.duration });
  backgroundAnimation.animate(isSelected ? 1 : 0, { duration: ANIMATION.duration });

  const handlePress = () => {
    setSoundPreference(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const playSound = async () => {
    console.log('playing sound');
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound: playbackObject } = await Audio.Sound.createAsync(require('../assets/audio/athan1.wav'), {
        shouldPlay: true,
      });

      await playbackObject.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  return (
    <AnimatedPressable style={[styles.option, backgroundAnimation.style]} onPress={handlePress}>
      <Animated.Text style={[styles.text, textAnimation.style]}>Athan {index + 1}</Animated.Text>
      <Pressable style={styles.icon} onPress={playSound}>
        <Icon type={AlertIcon.PLAY} size={22} animatedProps={iconAnimation.animatedProps} />
      </Pressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: STYLES.prayer.border.borderRadius,
    marginHorizontal: SCREEN.paddingHorizontal,
    height: STYLES.prayer.height,
  },
  text: {
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  icon: {},
});
