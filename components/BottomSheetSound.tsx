import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, ListRenderItemInfo, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_AUDIOS } from '@/assets/audio';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import * as Device from '@/device/notifications';
import { COLORS, TEXT } from '@/shared/constants';
import { rescheduleAllNotifications, setSoundPreference } from '@/stores/notifications';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

interface AudioItem {
  id: string;
  audio: AudioSource;
}

export default function BottomSheetSound() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  // Android: ignore bottom insets (nav bar is auto-hidden)
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

  // Temporary state to track selection before committing
  // This allows us to preview the selection without triggering notification updates
  const [tempSoundSelection, setTempSoundSelection] = useState<number | null>(null);

  const data = useMemo(
    () => ALL_AUDIOS.map((audio, index) => ({ id: index.toString(), audio: audio as AudioSource })),
    []
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AudioItem>) => (
      <BottomSheetSoundItem
        index={parseInt(item.id)}
        audio={item.audio}
        // onSelect updates the temporary selection when user taps an item
        // This doesn't trigger any notification updates yet
        onSelect={setTempSoundSelection}
        // tempSelection is used for UI feedback while the sheet is open
        // Falls back to the actual stored preference if no temporary selection
        tempSelection={tempSoundSelection}
      />
    ),
    [tempSoundSelection]
  );

  const clearAudio = useCallback(() => setPlayingSoundIndex(null), []);

  const handleDismiss = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearAudio();

    // Only update preferences and notifications when sheet closes
    // and user has made a selection
    if (tempSoundSelection === null) return;

    // Update the persisted sound preference with user's selection
    setSoundPreference(tempSoundSelection);
    await Device.updateAndroidChannel(tempSoundSelection);
    await rescheduleAllNotifications();

    // Clear temporary selection state since changes are now persisted
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
      <View style={bottomSheetStyles.container}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            <Text style={styles.musicIcon}>♪</Text>
          </View>
          <Text style={styles.title}>Select Athan</Text>
        </View>

        <BottomSheetFlatList<AudioItem>
          data={data}
          keyExtractor={(item: AudioItem) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: bottom + 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    gap: 10,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.icon.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicIcon: {
    color: COLORS.icon.primary,
    fontSize: 14,
  },
  title: {
    color: 'white',
    fontSize: TEXT.size + 2,
    fontFamily: TEXT.family.medium,
  },
  text: {
    color: COLORS.text.secondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
});
