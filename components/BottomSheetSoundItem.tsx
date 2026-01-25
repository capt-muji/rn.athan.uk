import { AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import IconView from '@/components/Icon';
import { useAnimationScale } from '@/hooks/useAnimation';
import { COLORS, TEXT, SPACING, RADIUS } from '@/shared/constants';
import { Icon } from '@/shared/types';
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
  const isActive = isPlaying || isSelected;

  const AnimScale = useAnimationScale(1);

  useEffect(() => {
    if (playingIndex !== index && status.playing) {
      player.pause();
    }
  }, [playingIndex, index, status.playing]);

  useEffect(() => {
    if (isPlaying && !status.playing && status.currentTime > 0 && status.duration > 0) {
      if (status.currentTime >= status.duration - 0.1) {
        setPlayingSoundIndex(null);
      }
    }
  }, [isPlaying, status.playing, status.currentTime, status.duration]);

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

    player.seekTo(0);
    player.play();
    setPlayingSoundIndex(index);
  };

  const activeColor = '#fff';
  const inactiveColor = 'rgba(86, 134, 189, 0.725)';

  const computedStyleOption: ViewStyle = {
    backgroundColor: isSelected ? COLORS.interactive.active : 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: isSelected ? COLORS.interactive.activeBorder : 'transparent',
  };

  return (
    <AnimatedPressable style={[styles.option, computedStyleOption]} onPress={handlePress}>
      <Text style={[styles.text, { color: isActive ? activeColor : inactiveColor }]}>Athan {index + 1}</Text>
      <AnimatedPressable
        style={[styles.icon, AnimScale.style]}
        onPress={playSound}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}>
        <IconView
          type={isPlaying ? Icon.PAUSE : Icon.PLAY}
          size={18}
          color={isActive ? activeColor : inactiveColor}
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
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.smd,
    paddingLeft: SPACING.md,
  },
  text: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
  },
  icon: {
    padding: SPACING.md,
  },
});
