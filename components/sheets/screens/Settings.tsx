import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import CheckIcon from '@/assets/icons/svg/check.svg';
import InfoBare from '@/assets/icons/svg/info-bare.svg';
import SettingsIcon from '@/assets/icons/svg/settings.svg';
import { IconView } from '@/components/ui';
import { requestQiblaPermission, showQiblaLocationDialog } from '@/device/qibla';
import { checkForUpdates } from '@/device/updates';
import { ANIMATION, COLORS, HIT_SLOP, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { chevronFor, currentLocaleId } from '@/shared/i18n/locale';
import { isDecorationSeason } from '@/shared/time';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { currentVisibleWhatsNew } from '@/shared/whatsNew';
import {
  countdownBarShownAtom,
  decorationsEnabledAtom,
  getManualUpdateCheckSpent,
  hideSettingsSheet,
  hijriDateEnabledAtom,
  setPopupHelpEnabled,
  setPopupUpdateEnabled,
  setPopupWhatsNewEnabled,
  setSettingsSheetModal,
  setSoundListReady,
  showLanguageSheet,
  showQiblaSheet,
  showSecondsAtom,
  showSheet,
  showTimePassedAtom,
  spendManualUpdateCheck,
  updateCheckRowStateAtom,
} from '@/stores/ui';

import { SettingsToggle, Sheet } from '../parts';
import ColorPicker from './ColorPicker';

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SETTINGS_PERF_NAME = 'sheet_settings';
// The settled row's green, the owner's "purple to a green colour": one row's settled state, not a palette role
const UPTODATE_BADGE = '#16a34a';
const UPTODATE_BADGE_BORDER = '#22c55e';

export default function BottomSheetSettings() {
  const [countdownBarShown, setCountdownBarShown] = useAtom(countdownBarShownAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);
  const [showSeconds, setShowSeconds] = useAtom(showSecondsAtom);
  const [showTimePassed, setShowTimePassed] = useAtom(showTimePassedAtom);
  const [decorationsEnabled, setDecorationsEnabled] = useAtom(decorationsEnabledAtom);
  const showDecorationToggle = useMemo(() => isDecorationSeason(), []);
  const [updateRowState, setUpdateRowState] = useAtom(updateCheckRowStateAtom);
  const isChecking = updateRowState === 'checking';
  const isUpToDate = updateRowState === 'upToDate';
  const updateRowLabel = isChecking
    ? t('settings.checkingUpdates')
    : isUpToDate
      ? t('settings.upToDate')
      : t('settings.checkUpdates');

  // The two arrows turn clockwise, round and round, for exactly as long as the check runs
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!isChecking) return;
    spin.value = withRepeat(withTiming(360, { duration: ANIMATION.durationSlow, easing: Easing.linear }), -1);
    return () => cancelAnimation(spin);
  }, [isChecking, spin]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  const handleAthanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    showSheet();
  };

  const handleLanguagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    showLanguageSheet();
  };

  // The permission is settled BEFORE the sheet opens, which is the owner's order: a compass that opens and then
  // asks shows the user an empty instrument with the system dialog sitting over it. A refusal opens nothing
  const handleQiblaPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!(await requestQiblaPermission())) return showQiblaLocationDialog();

    hideSettingsSheet();
    showQiblaSheet();
  };

  // Re-opens the What's New modal for the installed version - display-only,
  // never touches the shown-version tracker
  const handleWhatsNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    setTimeout(() => setPopupWhatsNewEnabled(true), 150);
  };

  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideSettingsSheet();
    setTimeout(() => setPopupHelpEnabled(true), 150);
  };

  // The row's own entry into the one update flow. The launch budget is spent on the press itself -
  // a check that never answers still spends it - and manual skips only that call's throttle read,
  // so the launch check keeps its 24-hour window. checkForUpdates never rejects, so no answer
  // path is leftUnhandled
  const handleCheckUpdatesPress = () => {
    if (getManualUpdateCheckSpent()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    spendManualUpdateCheck();
    setUpdateRowState('checking');
    checkForUpdates({ manual: true }).then((result) => {
      if (result.modal) {
        // The modal renders under this sheet, so the sheet closes first - the What's New and
        // Help rows trust the same 150ms - and the row rests: the modal owns the message
        hideSettingsSheet();
        setTimeout(() => setPopupUpdateEnabled(true), 150);
        setUpdateRowState('idle');
        return;
      }
      // A store that answered current is the one answer the modal cannot show; anything else
      // stays silent, and the resting label returns
      setUpdateRowState(result.upToDate ? 'upToDate' : 'idle');
    });
  };

  return (
    <Sheet
      setRef={setSettingsSheetModal}
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      icon={<SettingsIcon width={16} height={16} color={SHEET_ICON_COLOR} />}
      snapPoints={['85%']}
      perfName={SETTINGS_PERF_NAME}
      // The sound sheet is only reachable through this sheet: warming its
      // 32-row list on our first full open builds it invisibly, one tap
      // before it is needed (and off the launch path)
      onFirstPresent={setSoundListReady}>
      {/* Prayer Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.prayer')}</Text>
        <Pressable
          style={styles.athanButton}
          onPress={handleAthanPress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={t('settings.changeAthan')}
          accessibilityRole={'button'}>
          <View style={styles.musicButton}>
            <IconView type={Icon.MUSIC_NOTE} size={9} color={COLORS.text.primary} />
          </View>
          <Text style={styles.athanLabel}>{t('settings.changeAthan')}</Text>
          <Text style={styles.chevron}>{chevronFor()}</Text>
        </Pressable>
        <Pressable
          style={styles.athanButton}
          onPress={handleQiblaPress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={t('settings.qibla')}
          accessibilityRole={'button'}>
          <View style={styles.musicButton}>
            <IconView type={Icon.COMPASS} size={9} color={COLORS.text.primary} />
          </View>
          <Text style={styles.athanLabel}>{t('settings.qibla')}</Text>
          <Text style={styles.chevron}>{chevronFor()}</Text>
        </Pressable>
      </View>

      {/* Display Card - Language leads the Other card: the pick is app-level, not a display setting */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.display')}</Text>
        <View style={styles.toggleList}>
          <SettingsToggle
            label={t('settings.showHijriDate')}
            value={hijriEnabled}
            onToggle={() => setHijriEnabled(!hijriEnabled)}
          />
          <SettingsToggle
            label={t('settings.showSeconds')}
            value={showSeconds}
            onToggle={() => setShowSeconds(!showSeconds)}
          />
          <SettingsToggle
            label={t('settings.showTimePassed')}
            value={showTimePassed}
            onToggle={() => setShowTimePassed(!showTimePassed)}
          />
          {showDecorationToggle && (
            <SettingsToggle
              label={t('settings.showDecorations')}
              value={decorationsEnabled}
              onToggle={() => setDecorationsEnabled(!decorationsEnabled)}
            />
          )}
        </View>
      </View>

      {/* Countdown Bar Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.countdownBar')}</Text>
        <View style={styles.toggleList}>
          <SettingsToggle
            label={t('settings.showCountdownBar')}
            value={countdownBarShown}
            onToggle={() => setCountdownBarShown(!countdownBarShown)}
          />
          <ColorPicker />
        </View>
      </View>

      {/* Other Card - the What's new row alone is hidden on a silent release, so Help sits above it
          and always stays reachable */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.other')}</Text>
        <Pressable
          style={styles.whatsNewButton}
          onPress={handleLanguagePress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={t('settings.language')}
          accessibilityRole={'button'}>
          <View style={styles.infoButton}>
            <IconView type={Icon.GLOBE} size={9} color={COLORS.text.primary} />
          </View>
          <Text style={styles.whatsNewLabel}>{t('settings.language')}</Text>
          <Text style={styles.chevron}>{chevronFor()}</Text>
        </Pressable>
        <Pressable
          style={styles.whatsNewButton}
          onPress={handleHelpPress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={t('settings.help')}
          accessibilityRole={'button'}>
          <View style={styles.infoButton}>
            <IconView type={Icon.QUESTION} size={9} color={COLORS.text.primary} />
          </View>
          <Text style={styles.whatsNewLabel}>{t('settings.help')}</Text>
          <Text style={styles.chevron}>{chevronFor()}</Text>
        </Pressable>
        {currentVisibleWhatsNew() ? (
          <Pressable
            style={styles.whatsNewButton}
            onPress={handleWhatsNewPress}
            hitSlop={HIT_SLOP.md}
            accessibilityLabel={t('settings.whatsNew')}
            accessibilityRole={'button'}>
            <View style={styles.infoButton}>
              <InfoBare width={9} height={9} style={{ color: COLORS.text.primary }} />
            </View>
            <Text style={styles.whatsNewLabel}>{t('settings.whatsNewLabel')}</Text>
            <Text style={styles.chevron}>{chevronFor()}</Text>
          </Pressable>
        ) : null}
        {/* The row acts in place: the download glyph asks, the two-arrow circle where other rows
            carry a chevron, and the up-to-date verdict settles the badge green with a tick */}
        <Pressable
          style={styles.whatsNewButton}
          onPress={handleCheckUpdatesPress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={updateRowLabel}
          accessibilityRole={'button'}>
          <View style={[styles.infoButton, isUpToDate && styles.infoButtonSettled]}>
            {isUpToDate ? (
              <CheckIcon width={9} height={9} style={{ color: COLORS.text.primary }} />
            ) : (
              <IconView type={Icon.DOWNLOAD} size={9} color={COLORS.text.primary} />
            )}
          </View>
          <Text style={styles.whatsNewLabel}>{updateRowLabel}</Text>
          {isChecking ? (
            <IconView type={Icon.REFRESH} size={SIZE.icon.sm} color={COLORS.icon.primary} animatedStyle={spinStyle} />
          ) : isUpToDate ? null : (
            <IconView type={Icon.REFRESH} size={SIZE.icon.sm} color={COLORS.icon.primary} />
          )}
        </Pressable>
      </View>
    </Sheet>
  );
}

const ty = typographyFor(currentLocaleId());

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
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.sheetSubtitle,
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
    paddingEnd: SPACING.md,
  },
  whatsNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingEnd: SPACING.md,
  },
  infoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.interactive.active,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonSettled: {
    backgroundColor: UPTODATE_BADGE,
    borderColor: UPTODATE_BADGE_BORDER,
  },
  whatsNewLabel: {
    flex: 1,
    marginStart: SPACING.sm,
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
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
  athanLabel: {
    flex: 1,
    marginStart: SPACING.sm,
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
  chevron: {
    color: COLORS.icon.primary,
    fontSize: SIZE.icon.md,
    fontWeight: '300',
    lineHeight: SIZE.icon.md,
    // The codepoint carries the direction (chevronFor); Android mirrors a lone neutral
    // glyph inside an RTL paragraph, so the paragraph itself stays LTR
    direction: 'ltr',
  },
});
