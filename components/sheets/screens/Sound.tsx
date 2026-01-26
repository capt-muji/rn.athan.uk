import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Platform, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header, SoundItem, renderSheetBackground, renderBackdrop, bottomSheetStyles } from '../parts';

import { ALL_AUDIOS } from '@/assets/audio';
import { IconView } from '@/components/ui';
import * as Device from '@/device/notifications';
import { TEXT, SPACING, RADIUS, COLORS, ANIMATION } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { soundPreferenceAtom, rescheduleAllNotifications, setSoundPreference } from '@/stores/notifications';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

const ITEM_GAP = SPACING.xs;

export default function BottomSheetSound() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

  const selectedSound = useAtomValue(soundPreferenceAtom);
  const [tempSoundSelection, setTempSoundSelection] = useState<number | null>(null);
  const [itemHeight, setItemHeight] = useState(0);

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

  const indicatorStyle = useAnimatedStyle(() => {
    const translateY = currentSelection * (itemHeight + ITEM_GAP);
    return {
      transform: [{ translateY: withTiming(translateY, { duration: ANIMATION.duration }) }],
      height: itemHeight,
      opacity: itemHeight > 0 ? 1 : 0,
    };
  }, [currentSelection, itemHeight]);

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
    <BottomSheetModal
      ref={(ref) => setBottomSheetModal(ref)}
      snapPoints={['80%']}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      onAnimate={clearAudio}
      style={bottomSheetStyles.modal}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      <BottomSheetScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottom + SPACING.xxxl }}>
        <Header
          title="Select Athan"
          subtitle="Close to save"
          icon={<IconView type={Icon.SPEAKER} size={16} color="rgba(165, 180, 252, 0.8)" />}
        />

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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.xl,
  },

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
