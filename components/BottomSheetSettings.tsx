import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import Glow from '@/components/Glow';
import SettingsToggle from '@/components/SettingsToggle';
import { COLORS, TEXT } from '@/shared/constants';
import {
  hijriDateEnabledAtom,
  progressBarHiddenAtom,
  setSettingsSheetModal,
  hideSettingsSheet,
  showSheet,
} from '@/stores/ui';

export default function BottomSheetSettings() {
  const { bottom } = useSafeAreaInsets();

  const [progressBarHidden, setProgressBarHidden] = useAtom(progressBarHiddenAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);

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
        <Glow
          color={'#28045b'}
          baseOpacity={1}
          size={Dimensions.get('window').width * 3}
          style={{
            bottom: -Dimensions.get('window').width * 1.5,
            left: -Dimensions.get('window').width * 1.25,
          }}
        />
        <Text style={[styles.text, styles.title]}>Settings</Text>

        <SettingsToggle
          label="Hide countdown bar"
          value={progressBarHidden}
          onToggle={() => setProgressBarHidden(!progressBarHidden)}
        />
        <SettingsToggle label="Hijri date" value={hijriEnabled} onToggle={() => setHijriEnabled(!hijriEnabled)} />

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
  text: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  athanButton: {
    backgroundColor: '#3623ab',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  athanButtonText: {
    color: 'white',
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.size,
  },
});
