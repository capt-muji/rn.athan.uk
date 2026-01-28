import { AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useDerivedValue, interpolateColor } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useAnimationScale } from '@/hooks/useAnimation';
import { TEXT, SPACING, RADIUS, ANIMATION } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { soundPreferenceAtom } from '@/stores/notifications';
import { playingSoundIndexAtom, setPlayingSoundIndex } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COUNTDOWN_COLOR_SELECTED = 'rgba(165, 180, 252, 0.8)';
const COUNTDOWN_COLOR_UNSELECTED = 'rgba(86, 134, 189, 0.725)';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface Props {
  index: number;
  audio: AudioSource;
  onSelect: (index: number) => void;
  tempSelection: number | null;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export default function BottomSheetSoundItem({ index, audio, onSelect, tempSelection, onLayout }: Props) {
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);

  const player = useAudioPlayer(audio);
  const status = useAudioPlayerStatus(player);

  const isPlaying = playingIndex === index;
  const isSelected = index === (tempSelection ?? selectedSound);
  const isActive = isPlaying || isSelected;

  const AnimScale = useAnimationScale(1);

  const remainingTime = status.duration > 0 ? status.duration - status.currentTime : 0;
  const showCountdown = isPlaying && status.playing && remainingTime > 0;

  // Animated values for countdown
  const countdownOpacity = useDerivedValue(() =>
    withTiming(showCountdown ? 1 : 0, { duration: ANIMATION.durationFast })
  );

  const countdownColorProgress = useDerivedValue(() =>
    withTiming(isSelected ? 1 : 0, { duration: ANIMATION.durationFast })
  );

  const countdownStyle = useAnimatedStyle(() => ({
    opacity: countdownOpacity.value,
    color: interpolateColor(
      countdownColorProgress.value,
      [0, 1],
      [COUNTDOWN_COLOR_UNSELECTED, COUNTDOWN_COLOR_SELECTED]
    ),
  }));

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

  return (
    <Pressable style={styles.option} onPress={handlePress} onLayout={onLayout}>
      <Text style={[styles.text, { color: isActive ? activeColor : inactiveColor }]}>Athan {index + 1}</Text>
      <View style={styles.rightContainer}>
        <Animated.Text style={[styles.countdown, countdownStyle]}>{formatTime(remainingTime)}</Animated.Text>
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.md,
  },
  text: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdown: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginRight: SPACING.xs,
  },
  icon: {
    padding: SPACING.md,
  },
});
