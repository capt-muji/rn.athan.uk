import * as Haptics from 'expo-haptics';
import { memo, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useAnimationScale } from '@/hooks/useAnimation';
import { ANIMATION, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { perfMark } from '@/shared/perf';
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
  /** Whole seconds left in the playing preview — meaningful only on the playing row */
  remainingSeconds: number;
  onSelect: (index: number) => void;
  onPlayPress: (index: number) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

/**
 * Presentational sound row. The single audio player lives at the sheet level
 * (BottomSheetSound) — one AVPlayer for the whole list instead of one per
 * row, which exhausted audio resources on older devices (G.4/G.5). All
 * visuals are unchanged: selection highlight, countdown fade, press scale.
 *
 * Memoized with primitive props only: the sheet player's status object
 * changes identity many times per second during playback, and re-rendering
 * all 32 rows per tick was the sound-sheet jank (perf campaign #6) — now a
 * status tick only re-renders the playing row (and only when its whole-second
 * countdown actually changes).
 */
function SoundItemImpl({ index, isSelected, isPlaying, remainingSeconds, onSelect, onPlayPress, onLayout }: Props) {
  const isActive = isPlaying || isSelected;

  const AnimScale = useAnimationScale(1);

  // Countdown visibility is edge-synchronized with the row's state flip:
  // appear only once real remaining data exists (the player reports duration
  // ~100-300ms after the tap — appearing earlier showed stale/zero text),
  // stay through status churn (playing/duration oscillate at load — hiding on
  // those flickered), and hide the moment isPlaying flips false, which is the
  // same instant the icon swaps to play and the label deactivates.
  const [countdownVisible, setCountdownVisible] = useState(false);
  useEffect(() => {
    if (!isPlaying) {
      setCountdownVisible(false);
      return;
    }
    if (remainingSeconds > 0) setCountdownVisible(true);
  }, [isPlaying, remainingSeconds]);

  // The countdown fades over ~75ms after it hides, and remainingSeconds
  // drops to 0 the instant playback stops or the player reloads — without
  // this latch the fading text flashes "0:00" (and again on the next tap's
  // fade-in before the new duration arrives). Freeze the last positive
  // value; 0 never displays (same contract as the main countdown).
  const lastPositiveRemainingRef = useRef(1);
  if (remainingSeconds > 0) lastPositiveRemainingRef.current = remainingSeconds;
  const displaySeconds = remainingSeconds > 0 ? remainingSeconds : lastPositiveRemainingRef.current;

  // Animated values for countdown
  const countdownOpacity = useDerivedValue(() =>
    withTiming(countdownVisible ? 1 : 0, { duration: ANIMATION.durationFast })
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
    perfMark('sound_select_tap', { index });
    onSelect(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePlayPress = () => {
    perfMark('sound_play_tap', { index });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPress(index);
  };

  const activeColor = '#fff';
  const inactiveColor = 'rgba(86, 134, 189, 0.725)';

  return (
    <Pressable style={styles.option} onPress={handlePress} onLayout={onLayout}>
      <Text style={[styles.text, { color: isActive ? activeColor : inactiveColor }]}>Athan {index + 1}</Text>
      <View style={styles.rightContainer}>
        <Animated.Text style={[styles.countdown, countdownStyle]}>{formatTime(displaySeconds)}</Animated.Text>
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

export default memo(SoundItemImpl);
