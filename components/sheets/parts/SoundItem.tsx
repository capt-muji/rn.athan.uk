import * as Haptics from 'expo-haptics';
import { memo, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { IconView } from '@/components/ui';
import { useAnimationScale, useDerivedProgress } from '@/hooks/useAnimation';
import { ANIMATION, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { perfMark } from '@/shared/perf';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Solid: the old rgba pair flattened over the sheet, so the countdown never renders through alpha
const COUNTDOWN_COLOR_SELECTED = '#8695d5';
const COUNTDOWN_COLOR_UNSELECTED = '#416899';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const composed = `${mins}:${secs.toString().padStart(2, '0')}`;
  return composed;
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
  // appear the frame the row starts playing (the sheet supplies the clip's
  // tabulated seconds instantly, live status takes over on load), and hide
  // the moment isPlaying flips false — the same instant the icon swaps and
  // the label deactivates.
  const [countdownVisible, setCountdownVisible] = useState(false);
  useEffect(() => {
    if (!isPlaying) {
      setCountdownVisible(false);
      return;
    }
    if (remainingSeconds > 0) setCountdownVisible(true);
  }, [isPlaying, remainingSeconds]);

  // remainingSeconds drops to 0 while the clip's final fraction of a second
  // is still playing (and again on stop/switch) — without this latch the
  // text flashes "0:00". Freeze the last positive value; 0 never displays
  // (same contract as the main countdown).
  const lastPositiveRemainingRef = useRef(1);
  if (remainingSeconds > 0) lastPositiveRemainingRef.current = remainingSeconds;
  const displaySeconds = remainingSeconds > 0 ? remainingSeconds : lastPositiveRemainingRef.current;

  // Countdown color tweens; visibility snaps with the icon flip (a tween here
  // ran ~75ms behind the instant play/pause swap and read as desync). The progress
  // snaps on first evaluation, so a row that mounts already playing paints its
  // settled ink instead of tweening up from unselected
  const countdownColorProgress = useDerivedProgress(isSelected ? 1 : 0, { duration: ANIMATION.durationFast });

  const countdownStyle = useAnimatedStyle(() => ({
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
  const inactiveColor = '#416899';

  const name = t('soundItem.athan', { n: index + 1 });

  return (
    <Pressable
      style={styles.option}
      onPress={handlePress}
      onLayout={onLayout}
      accessibilityRole={'radio'}
      // Which athan is chosen is carried only by the row's text colour, so `selected` is the
      // one thing a screen reader has to tell the rows apart
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={name}>
      <Text style={[styles.text, { color: isActive ? activeColor : inactiveColor }]}>{name}</Text>
      <View style={styles.rightContainer}>
        {/* Rendered only while visible: the row is end-anchored, so the countdown's
            absence moves nothing, and the colour tween lives here at row level */}
        {countdownVisible && (
          <Animated.Text style={[styles.countdown, countdownStyle]}>{formatTime(displaySeconds)}</Animated.Text>
        )}
        <AnimatedPressable
          style={[styles.icon, AnimScale.style]}
          onPress={handlePlayPress}
          onPressIn={() => AnimScale.animate(0.9)}
          onPressOut={() => AnimScale.animate(1)}
          accessibilityRole={'button'}
          // The glyph is the only thing that says play or pause, and on iOS the row would
          // otherwise absorb this button so VoiceOver could never reach it
          accessibilityLabel={isPlaying ? t('soundItem.stopPreview', { name }) : t('soundItem.preview', { name })}>
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

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingStart: SPACING.md,
  },
  text: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdown: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyRegular,
    marginEnd: SPACING.xs,
  },
  icon: {
    padding: SPACING.md,
  },
});

export default memo(SoundItemImpl);
