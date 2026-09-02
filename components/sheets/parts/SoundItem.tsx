import type { AudioStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useAnimationScale } from '@/hooks/useAnimation';
import { ANIMATION, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { Icon } from '@/shared/types';

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
  isSelected: boolean;
  isPlaying: boolean;
  /** Shared sheet player status — meaningful only on the playing row */
  status: AudioStatus;
  onSelect: (index: number) => void;
  onPlayPress: (index: number) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

/**
 * Presentational sound row. The single audio player lives at the sheet level
 * (BottomSheetSound) — one AVPlayer for the whole list instead of one per
 * row, which exhausted audio resources on older devices (G.4/G.5). All
 * visuals are unchanged: selection highlight, countdown fade, press scale.
 */
export default function BottomSheetSoundItem({
  index,
  isSelected,
  isPlaying,
  status,
  onSelect,
  onPlayPress,
  onLayout,
}: Props) {
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

  const handlePress = () => {
    onSelect(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress(index);
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
          onPress={handlePlayPress}
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
