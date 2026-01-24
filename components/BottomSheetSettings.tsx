import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SettingsIcon from '@/assets/icons/settings.svg';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import ColorPickerSettings from '@/components/ColorPickerSettings';
import SettingsToggle from '@/components/SettingsToggle';
import { TEXT, STYLES, COLORS, SPACING, SIZE, RADIUS } from '@/shared/constants';
import {
  hijriDateEnabledAtom,
  showSecondsAtom,
  showTimePassedAtom,
  showArabicNamesAtom,
  countdownBarShownAtom,
  setSettingsSheetModal,
  hideSettingsSheet,
  showSheet,
} from '@/stores/ui';

export default function BottomSheetSettings() {
  const { bottom: safeBottom } = useSafeAreaInsets();
  // Android: ignore bottom insets (nav bar is auto-hidden)
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;

  const [countdownBarShown, setCountdownBarShown] = useAtom(countdownBarShownAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);
  const [showSeconds, setShowSeconds] = useAtom(showSecondsAtom);
  const [showTimePassed, setShowTimePassed] = useAtom(showTimePassedAtom);
  const [showArabicNames, setShowArabicNames] = useAtom(showArabicNamesAtom);

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
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            <SettingsIcon width={14} height={14} color={COLORS.icon.primary} />
          </View>
          <Text style={styles.title}>Settings</Text>
        </View>

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
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
        <SettingsToggle label="Show hijri date" value={hijriEnabled} onToggle={() => setHijriEnabled(!hijriEnabled)} />
        <SettingsToggle label="Show seconds" value={showSeconds} onToggle={() => setShowSeconds(!showSeconds)} />
        <SettingsToggle
          label="Show time passed"
          value={showTimePassed}
          onToggle={() => setShowTimePassed(!showTimePassed)}
        />
        <SettingsToggle
          label="Show arabic names"
          value={showArabicNames}
          onToggle={() => setShowArabicNames(!showArabicNames)}
        />
        <SettingsToggle
          label="Show countdown bar"
          value={countdownBarShown}
          onToggle={() => setCountdownBarShown(!countdownBarShown)}
        />
        <ColorPickerSettings />
        <View style={{ height: bottom + 20 }} />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 10,
  },
  iconWrapper: {
    width: SIZE.iconWrapper.md,
    height: SIZE.iconWrapper.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.icon.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text.primary,
    fontSize: TEXT.sizeTitle,
    fontFamily: TEXT.family.medium,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: STYLES.prayer.height,
    paddingHorizontal: STYLES.prayer.padding.left,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  listItemLabel: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  musicButton: {
    width: SIZE.iconWrapper.sm,
    height: SIZE.iconWrapper.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.interactive.active,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicIcon: {
    color: COLORS.text.primary,
    fontSize: 14,
  },
  chevron: {
    color: COLORS.icon.primary,
    fontSize: 20,
    fontWeight: '300',
  },
});
