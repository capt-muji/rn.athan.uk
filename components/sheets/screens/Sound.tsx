import { AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Sheet, SoundItem } from '../parts';

import { ALL_AUDIOS } from '@/assets/audio';
import { IconView } from '@/components/ui';
import * as Device from '@/device/notifications';
import { TEXT, SPACING, RADIUS, COLORS, ANIMATION } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { soundPreferenceAtom, rescheduleAllNotifications, setSoundPreference } from '@/stores/notifications';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

const ITEM_GAP = SPACING.xs;

export default function BottomSheetSound() {
  const selectedSound = useAtomValue(soundPreferenceAtom);
  const [tempSoundSelection, setTempSoundSelection] = useState<number | null>(null);
  const [itemHeight, setItemHeight] = useState(0);
  const hasInitialized = useRef(false);
  const translateY = useSharedValue(0);

  const currentSelection = tempSoundSelection ?? selectedSound;

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
  }, [currentSelection, itemHeight]);

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
  }, [tempSoundSelection]);

  return (
    <Sheet
      setRef={setBottomSheetModal}
      title="Select Athan"
      subtitle="Close to save"
      icon={<IconView type={Icon.SPEAKER} size={16} color="rgba(165, 180, 252, 0.8)" />}
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
          {ALL_AUDIOS.map((audio, index) => (
            <SoundItem
              key={index}
              index={index}
              audio={audio as AudioSource}
              onSelect={setTempSoundSelection}
              tempSelection={tempSoundSelection}
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
