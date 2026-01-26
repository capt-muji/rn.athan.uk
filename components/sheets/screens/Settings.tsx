import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ColorPicker from './ColorPicker';
import { Header, SettingsToggle, renderSheetBackground, renderBackdrop, bottomSheetStyles } from '../parts';

import SettingsIcon from '@/assets/icons/svg/settings.svg';
import { TEXT, COLORS, SPACING, SIZE, RADIUS, HIT_SLOP } from '@/shared/constants';
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
      snapPoints={['70%']}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      style={bottomSheetStyles.modal}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      <BottomSheetScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottom + SPACING.xxxl }}>
        <Header
          title="Settings"
          subtitle="Set your preferences"
          icon={<SettingsIcon width={16} height={16} color="rgba(165, 180, 252, 0.8)" />}
        />

        {/* Sound Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sound</Text>
          <Pressable
            style={styles.athanButton}
            onPress={handleAthanPress}
            hitSlop={HIT_SLOP.md}
            accessibilityLabel="Change athan"
            accessibilityRole="button">
            <View style={styles.musicButton}>
              <Text style={styles.musicIcon}>♪</Text>
            </View>
            <Text style={styles.athanLabel}>Change athan</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Display Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Display</Text>
          <View style={styles.toggleList}>
            <SettingsToggle
              label="Show hijri date"
              value={hijriEnabled}
              onToggle={() => setHijriEnabled(!hijriEnabled)}
            />
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
          </View>
        </View>

        {/* Countdown Bar Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Countdown Bar</Text>
          <View style={styles.toggleList}>
            <SettingsToggle
              label="Show countdown bar"
              value={countdownBarShown}
              onToggle={() => setCountdownBarShown(!countdownBarShown)}
            />
            <ColorPicker />
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

  // Cards
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: 'rgba(86, 134, 189, 0.725)',
  },

  // Toggle list
  toggleList: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },

  // Athan button
  athanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingRight: SPACING.md,
  },
  musicButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.interactive.active,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicIcon: {
    color: COLORS.text.primary,
    fontSize: 10,
  },
  athanLabel: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text.primary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeDetail,
  },
  chevron: {
    color: COLORS.icon.primary,
    fontSize: SIZE.icon.md,
    fontWeight: '300',
    lineHeight: SIZE.icon.md,
  },
});
