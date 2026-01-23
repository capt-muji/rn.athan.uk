import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import ColorPickerSettings from '@/components/ColorPickerSettings';
import SettingsToggle from '@/components/SettingsToggle';
import { TEXT, STYLES } from '@/shared/constants';
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

        <Pressable
          style={styles.listItem}
          onPress={handleAthanPress}
          hitSlop={10}
          accessibilityLabel="Change athan"
          accessibilityHint="Opens athan sound selection"
          accessibilityRole="button">
          <Text style={styles.listItemLabel}>Change athan</Text>
          <View style={styles.rightContainer}>
            <Pressable
              style={styles.musicButton}
              onPress={handleAthanPress}
              hitSlop={10}
              accessibilityLabel="Change athan"
              accessibilityHint="Opens athan sound selection">
              <Text style={styles.musicIcon}>♪</Text>
            </Pressable>
          </View>
        </Pressable>
        <SettingsToggle label="Show Hijri date" value={hijriEnabled} onToggle={() => setHijriEnabled(!hijriEnabled)} />
        <SettingsToggle label="Show seconds" value={showSeconds} onToggle={() => setShowSeconds(!showSeconds)} />
        <SettingsToggle
          label="Hide countdown bar"
          value={countdownBarHidden}
          onToggle={() => setCountdownBarHidden(!countdownBarHidden)}
        />
        <ColorPickerSettings />
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: STYLES.prayer.height,
    paddingHorizontal: STYLES.prayer.padding.left,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  listItemLabel: {
    color: 'white',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  musicButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5015b5',
    borderWidth: 1,
    borderColor: '#672bcf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicIcon: {
    color: 'white',
    fontSize: 14,
    marginTop: -2,
  },
});
