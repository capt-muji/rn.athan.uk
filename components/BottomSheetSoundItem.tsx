import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationBackgroundColor, useAnimationColor, useAnimationFill } from '@/hooks/useAnimations';
import { ANIMATION, SCREEN, STYLES, TEXT } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom, setSoundPreference } from '@/stores/notifications';
import { playingSoundIndexAtom, setPlayingSoundIndex } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  index: number;
}

export default function BottomSheetSoundItem({ index }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);
  const isPlaying = playingIndex === index;

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

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (playingIndex !== index && sound) {
      sound.stopAsync();
    }
  }, [playingIndex, sound, index]);

  const handlePress = () => {
    setSoundPreference(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const playSound = async () => {
    console.log('playing sound');
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        setPlayingSoundIndex(null);
        return;
      }

      if (sound) {
        await sound.stopAsync();
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound: playbackObject } = await Audio.Sound.createAsync(require('../assets/audio/athan1.wav'), {
        shouldPlay: true,
      });

      setSound(playbackObject);
      setPlayingSoundIndex(index);

      playbackObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingSoundIndex(null);
        }
      });

      await playbackObject.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
      setPlayingSoundIndex(null);
    }
  };

  return (
    <AnimatedPressable style={[styles.option, backgroundAnimation.style]} onPress={handlePress}>
      <Animated.Text style={[styles.text, textAnimation.style]}>Athan {index + 1}</Animated.Text>
      <Pressable style={styles.icon} onPress={playSound}>
        <Icon
          type={isPlaying ? AlertIcon.PAUSE : AlertIcon.PLAY}
          size={22}
          animatedProps={iconAnimation.animatedProps}
        />
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
