import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, Dimensions, View, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_AUDIOS } from '@/assets/audio';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import Glow from '@/components/Glow';
import * as Device from '@/device/notifications';
import { COLORS, TEXT } from '@/shared/constants';
import { rescheduleAllNotifications, setSoundPreference } from '@/stores/notifications';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

interface AudioItem {
  id: string;
  audio: AudioSource;
}

export default function BottomSheetSound() {
  const { bottom } = useSafeAreaInsets();

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
        <Glow
          color={'#28045b'}
          baseOpacity={1}
          size={Dimensions.get('window').width * 3}
          style={{
            bottom: -Dimensions.get('window').width * 1.5,
            left: -Dimensions.get('window').width * 1.25,
          }}
        />
        <Text style={[styles.text, styles.title]}>Select Athan</Text>

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
  title: {
    color: 'white',
    paddingVertical: 20,
    paddingHorizontal: 30,
    fontSize: TEXT.size + 2,
    fontFamily: TEXT.family.medium,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
});
