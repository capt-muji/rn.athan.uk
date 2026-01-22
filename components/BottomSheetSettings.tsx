import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import ColorPickerSettings from '@/components/ColorPickerSettings';
import SettingsToggle from '@/components/SettingsToggle';
import { TEXT } from '@/shared/constants';
import {
  hijriDateEnabledAtom,
  showSecondsAtom,
  countdownBarHiddenAtom,
  setSettingsSheetModal,
  hideSettingsSheet,
  showSheet,
} from '@/stores/ui';

export default function BottomSheetSettings() {
  const { bottom } = useSafeAreaInsets();

  const [countdownBarHidden, setCountdownBarHidden] = useAtom(countdownBarHiddenAtom);
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
      snapPoints={['60%']}
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
          value={countdownBarHidden}
          onToggle={() => setCountdownBarHidden(!countdownBarHidden)}
        />
        <ColorPickerSettings />
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
    backgroundColor: '#5015b5',
    borderWidth: 1,
    borderColor: '#672bcf',
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
