import { BottomSheetModal, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { AudioSource } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, ListRenderItemInfo, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_AUDIOS } from '@/assets/audio';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import BottomSheetSoundItem from '@/components/BottomSheetSoundItem';
import IconView from '@/components/Icon';
import * as Device from '@/device/notifications';
import { TEXT, SPACING, RADIUS } from '@/shared/constants';
import { Icon } from '@/shared/types';
import { rescheduleAllNotifications, setSoundPreference } from '@/stores/notifications';
import { setBottomSheetModal, setPlayingSoundIndex } from '@/stores/ui';

interface AudioItem {
  id: string;
  audio: AudioSource;
}

export default function BottomSheetSound() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

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
        onSelect={setTempSoundSelection}
        tempSelection={tempSoundSelection}
      />
    ),
    [tempSoundSelection]
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
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Select Athan</Text>
            <Text style={styles.subtitle}>Choose your notification sound</Text>
          </View>
          <View style={styles.headerIcon}>
            <IconView type={Icon.SPEAKER} size={16} color="rgba(165, 180, 252, 0.8)" />
          </View>
        </View>

        {/* Sound List Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Sounds</Text>
          <Text style={styles.cardHint}>Tap to select, press play to preview</Text>
          <BottomSheetFlatList<AudioItem>
            data={data}
            keyExtractor={(item: AudioItem) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottom + SPACING.xl }]}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: TEXT.family.medium,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: SPACING.xxs,
  },
  subtitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
    marginTop: SPACING.xs,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
    paddingBottom: 0,
  },
  cardTitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: '#d8eaf8',
    marginBottom: SPACING.sm - 1,
  },
  cardHint: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
  },

  // List
  list: {
    marginTop: SPACING.md,
    marginHorizontal: -SPACING.sm,
  },
  listContent: {
    gap: SPACING.xs,
  },
});
