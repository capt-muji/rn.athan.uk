/* eslint-disable @typescript-eslint/no-require-imports */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationColor, useAnimationFill, useAnimationScale } from '@/hooks/useAnimations';
import { ANIMATION, SCREEN, STYLES, TEXT } from '@/shared/constants';
import logger from '@/shared/logger';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom, setSoundPreference } from '@/stores/notifications';
import { playingSoundIndexAtom, setPlayingSoundIndex } from '@/stores/ui';

const SOUNDS = [
  require('../assets/audio/athan1.wav'),
  require('../assets/audio/athan2.wav'),
  require('../assets/audio/athan3.wav'),
  require('../assets/audio/athan4.wav'),
  require('../assets/audio/athan5.wav'),
  require('../assets/audio/athan6.wav'),
  require('../assets/audio/athan7.wav'),
  require('../assets/audio/athan8.wav'),
  require('../assets/audio/athan9.wav'),
  require('../assets/audio/athan10.wav'),
  require('../assets/audio/athan11.wav'),
  require('../assets/audio/athan12.wav'),
  require('../assets/audio/athan13.wav'),
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  index: number;
}

export default function BottomSheetSoundItem({ index }: Props) {
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const isPlaying = playingIndex === index;
  const isSelected = index === selectedSound;

  const textAnimation = useAnimationColor(isPlaying ? 1 : 0, {
    fromColor: isSelected ? 'white' : '#425ea7',
    toColor: 'white',
  });
  const iconAnimation = useAnimationFill(isPlaying ? 1 : 0, {
    fromColor: isSelected ? 'white' : '#425ea7',
    toColor: 'white',
  });

  textAnimation.animate(isPlaying ? 1 : 0, { duration: ANIMATION.duration });
  iconAnimation.animate(isPlaying ? 1 : 0, { duration: ANIMATION.duration });

  const AnimScale = useAnimationScale(1);

  if (playingIndex !== index && sound) sound.stopAsync();

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const handlePress = () => {
    setSoundPreference(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const playSound = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (sound) {
        await sound.stopAsync();

        if (isPlaying) return setPlayingSoundIndex(null);
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound: playbackObject } = await Audio.Sound.createAsync(SOUNDS[index], {
        shouldPlay: true,
      });

      setSound(playbackObject);
      setPlayingSoundIndex(index);

      playbackObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlayingSoundIndex(null);
      });

      await playbackObject.playAsync();
    } catch (error) {
      logger.error('Error playing sound:', error);
      setPlayingSoundIndex(null);
    }
  };

  const computedStyleOption = {
    backgroundColor: isSelected ? '#3623ab' : 'transparent',
  };

  return (
    <AnimatedPressable style={[styles.option, computedStyleOption]} onPress={handlePress}>
      <Animated.Text style={[styles.text, textAnimation.style]}>Athan {index + 1}</Animated.Text>
      <AnimatedPressable
        style={[styles.icon, AnimScale.style]}
        onPress={playSound}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}>
        <Icon
          type={isPlaying ? AlertIcon.PAUSE : AlertIcon.PLAY}
          size={22}
          animatedProps={iconAnimation.animatedProps}
        />
      </AnimatedPressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: STYLES.prayer.border.borderRadius,
    marginHorizontal: SCREEN.paddingHorizontal,
    height: STYLES.prayer.height,
    paddingLeft: 20,
  },
  text: {
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  icon: {
    padding: 20,
  },
});
