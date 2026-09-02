import { type AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ATHAN_AUDIOS } from '@/assets/audio';
import { IconView } from '@/components/ui';
import * as Device from '@/device/notifications';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { rescheduleAllNotifications, setSoundPreference, soundPreferenceAtom } from '@/stores/notifications';
import { playingSoundIndexAtom, setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

import { Sheet, SoundItem } from '../parts';

const ITEM_GAP = SPACING.xs;

export default function BottomSheetSound() {
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const playingIndex = useAtomValue(playingSoundIndexAtom);
  const [tempSoundSelection, setTempSoundSelection] = useState<number | null>(null);
  const [itemHeight, setItemHeight] = useState(0);
  const hasInitialized = useRef(false);
  const translateY = useSharedValue(0);

  const currentSelection = tempSoundSelection ?? selectedSound;

  // ONE player for the whole sheet (was one per row — 32 concurrent
  // AVPlayers exhausted audio resources on older devices, G.4/G.5). The hook
  // releases and recreates the player when the source changes, so exactly
  // one instance is ever alive.
  const playingSource = playingIndex !== null ? (ATHAN_AUDIOS[playingIndex] as AudioSource) : null;
  const player = useAudioPlayer(playingSource);
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);

  // Playback is armed from an effect: switching rows swaps the player
  // instance, so play() must run after the new source exists.
  useEffect(() => {
    if (playingIndex === null || !pendingPlayRef.current) return;
    pendingPlayRef.current = false;
    player.seekTo(0);
    player.play();
  }, [playingIndex, player]);

  // Clip finished — clear the playing row (was per-item before the
  // single-player refactor)
  useEffect(() => {
    const isPlaying = playingIndex !== null;
    if (isPlaying && !status.playing && status.currentTime > 0 && status.duration > 0) {
      if (status.currentTime >= status.duration - 0.1) {
        setPlayingSoundIndex(null);
      }
    }
  }, [playingIndex, status.playing, status.currentTime, status.duration]);

  const handlePlayPress = useCallback(
    (index: number) => {
      if (playingIndex === index) {
        player.pause();
        setPlayingSoundIndex(null);
        return;
      }
      pendingPlayRef.current = true;
      setPlayingSoundIndex(index);
    },
    [playingIndex, player]
  );

  // Measure first item to get consistent height
  const handleItemLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (itemHeight === 0) {
        setItemHeight(e.nativeEvent.layout.height);
      }
    },
    [itemHeight]
  );

  // Update translateY: no animation on first render, animate on subsequent changes
  useEffect(() => {
    if (itemHeight === 0) return;

    const targetY = currentSelection * (itemHeight + ITEM_GAP);

    if (!hasInitialized.current) {
      translateY.value = targetY;
      hasInitialized.current = true;
    } else {
      translateY.value = withTiming(targetY, { duration: ANIMATION.duration });
    }
  }, [currentSelection, itemHeight, translateY]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
      height: itemHeight,
      opacity: itemHeight > 0 ? 1 : 0,
    }),
    [itemHeight]
  );

  const clearAudio = useCallback(() => setPlayingSoundIndex(null), []);

  const handleDismiss = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearAudio();

    if (tempSoundSelection === null) return;

    setSoundPreference(tempSoundSelection);
    await Device.updateAndroidChannel(tempSoundSelection);
    await rescheduleAllNotifications();

    setTempSoundSelection(null);
  }, [tempSoundSelection, clearAudio]);

  return (
    <Sheet
      setRef={setBottomSheetModal}
      title='Select Athan'
      subtitle='Close to save'
      icon={<IconView type={Icon.SPEAKER} size={16} color='rgba(165, 180, 252, 0.8)' />}
      snapPoints={['80%']}
      onDismiss={handleDismiss}
      onAnimate={clearAudio}>
      {/* Sound List Card */}
      <View style={styles.card}>
        <Text style={styles.cardHint}>Notification sound</Text>

        <View style={styles.listContainer}>
          {/* Sliding indicator */}
          <Animated.View style={[styles.indicator, indicatorStyle]} />

          {/* Sound items */}
          {ATHAN_AUDIOS.map((_, index) => (
            <SoundItem
              // biome-ignore lint/suspicious/noArrayIndexKey: ATHAN_AUDIOS is a static sound list, never reordered or filtered
              key={index}
              index={index}
              isSelected={index === currentSelection}
              isPlaying={playingIndex === index}
              status={status}
              onSelect={setTempSoundSelection}
              onPlayPress={handlePlayPress}
              onLayout={index === 0 ? handleItemLayout : undefined}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
  },
  cardHint: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
  },

  // List
  listContainer: {
    marginTop: SPACING.md,
    gap: ITEM_GAP,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
});
