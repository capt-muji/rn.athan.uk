import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';

import ColorPicker from './ColorPicker';
import { Sheet, SettingsToggle } from '../parts';

import SettingsIcon from '@/assets/icons/svg/settings.svg';
import { TEXT, COLORS, SPACING, SIZE, RADIUS, HIT_SLOP } from '@/shared/constants';
import { isDecorationSeason } from '@/shared/time';
import {
  hijriDateEnabledAtom,
  showSecondsAtom,
  showTimePassedAtom,
  showArabicNamesAtom,
  decorationsEnabledAtom,
  countdownBarShownAtom,
  setSettingsSheetModal,
  hideSettingsSheet,
  showSheet,
} from '@/stores/ui';

export default function BottomSheetSettings() {
  const [countdownBarShown, setCountdownBarShown] = useAtom(countdownBarShownAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);
  const [showSeconds, setShowSeconds] = useAtom(showSecondsAtom);
  const [showTimePassed, setShowTimePassed] = useAtom(showTimePassedAtom);
  const [showArabicNames, setShowArabicNames] = useAtom(showArabicNamesAtom);
  const [decorationsEnabled, setDecorationsEnabled] = useAtom(decorationsEnabledAtom);
  const showDecorationToggle = useMemo(() => isDecorationSeason(), []);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleAthanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    setTimeout(() => showSheet(), 150);
  };

  return (
    <Sheet
      setRef={setSettingsSheetModal}
      title="Settings"
      subtitle="Set your preferences"
      icon={<SettingsIcon width={16} height={16} color="rgba(165, 180, 252, 0.8)" />}
      snapPoints={['70%']}
      onDismiss={handleDismiss}>
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
          {showDecorationToggle && (
            <SettingsToggle
              label="Show decorations"
              value={decorationsEnabled}
              onToggle={() => setDecorationsEnabled(!decorationsEnabled)}
            />
          )}
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
    fontSize: Platform.OS === 'android' ? 14 : 10,
    marginTop: Platform.OS === 'android' ? -2.5 : 0,
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
