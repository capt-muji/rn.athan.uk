import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import SettingsToggle from '@/components/SettingsToggle';
import { TEXT } from '@/shared/constants';
import {
  hijriDateEnabledAtom,
  showSecondsAtom,
  progressBarHiddenAtom,
  setSettingsSheetModal,
  hideSettingsSheet,
  showSheet,
} from '@/stores/ui';

export default function BottomSheetSettings() {
  const { bottom } = useSafeAreaInsets();

  const [progressBarHidden, setProgressBarHidden] = useAtom(progressBarHiddenAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);
  const [showSeconds, setShowSeconds] = useAtom(showSecondsAtom);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleAthanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    setTimeout(() => showSheet(), 150);
  };

  return (
    <BottomSheetModal
      ref={(ref) => setSettingsSheetModal(ref)}
      snapPoints={['55%']}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      style={bottomSheetStyles.modal}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      <View style={bottomSheetStyles.container}>
        <Text style={[styles.title]}>Settings</Text>

        <SettingsToggle
          label="Hide countdown bar"
          value={progressBarHidden}
          onToggle={() => setProgressBarHidden(!progressBarHidden)}
        />
        <SettingsToggle label="Show seconds" value={showSeconds} onToggle={() => setShowSeconds(!showSeconds)} />
        <SettingsToggle label="Show Hijri date" value={hijriEnabled} onToggle={() => setHijriEnabled(!hijriEnabled)} />

        <Pressable style={styles.athanButton} onPress={handleAthanPress}>
          <Text style={styles.athanButtonText}>Change Athan Sound</Text>
        </Pressable>

        <View style={{ height: bottom + 20 }} />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: {
    color: 'white',
    padding: 20,
    fontSize: TEXT.size + 2,
    fontFamily: TEXT.family.medium,
  },
  athanButton: {
    backgroundColor: '#6023c9',
    borderWidth: 1,
    borderColor: '#7e3bf1',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  athanButtonText: {
    color: '#f8f4ff',
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.size,
  },
});
