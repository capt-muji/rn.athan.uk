import { AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationColor, useAnimationFill, useAnimationScale } from '@/hooks/useAnimation';
import { ANIMATION, COLORS, SCREEN, STYLES, TEXT, SPACING, RADIUS } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';
import { soundPreferenceAtom } from '@/stores/notifications';
import { playingSoundIndexAtom, setPlayingSoundIndex } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  index: number;
  audio: AudioSource;
  onSelect: (index: number) => void;
  tempSelection: number | null;
}

export default function BottomSheetSoundItem({ index, audio, onSelect, tempSelection }: Props) {
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);

  const player = useAudioPlayer(audio);
  const status = useAudioPlayerStatus(player);

  const isPlaying = playingIndex === index;
  const isSelected = index === (tempSelection ?? selectedSound);

  const textAnimation = useAnimationColor(isPlaying || isSelected ? 1 : 0, {
    fromColor: COLORS.text.secondary,
    toColor: COLORS.text.primary,
  });
  const iconAnimation = useAnimationFill(isPlaying ? 1 : 0, {
    fromColor: COLORS.text.secondary,
    toColor: COLORS.text.primary,
  });

  const AnimScale = useAnimationScale(1);

  // Stop playing when another sound is selected
  useEffect(() => {
    if (playingIndex !== index && status.playing) {
      player.pause();
    }
  }, [playingIndex, index, status.playing]);

  // Detect when playback finishes
  useEffect(() => {
    if (isPlaying && !status.playing && status.currentTime > 0 && status.duration > 0) {
      // Check if playback finished (near the end)
      if (status.currentTime >= status.duration - 0.1) {
        setPlayingSoundIndex(null);
      }
    }
  }, [isPlaying, status.playing, status.currentTime, status.duration]);

  useEffect(() => {
    textAnimation.animate(isPlaying || isSelected ? 1 : 0, { duration: ANIMATION.duration });
    iconAnimation.animate(isPlaying || isSelected ? 1 : 0, { duration: ANIMATION.duration });
  }, [isPlaying, isSelected]);

  const handlePress = () => {
    onSelect(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const playSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPlaying) {
      player.pause();
      setPlayingSoundIndex(null);
      return;
    }

    // Reset to beginning and play
    player.seekTo(0);
    player.play();
    setPlayingSoundIndex(index);
  };

  const computedStyleOption: ViewStyle = {
    backgroundColor: isSelected ? COLORS.interactive.active : 'transparent',
    borderWidth: 1,
    borderColor: isSelected ? COLORS.interactive.activeBorder : 'transparent',
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
    borderRadius: RADIUS.md,
    marginHorizontal: SCREEN.paddingHorizontal,
    height: STYLES.prayer.height,
    paddingLeft: SPACING.xl,
  },
  text: {
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  icon: {
    padding: SPACING.xl,
  },
});
