import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import CloseIcon from '@/assets/icons/svg/close.svg';
import InfoBare from '@/assets/icons/svg/info-bare.svg';
import SettingsIcon from '@/assets/icons/svg/settings.svg';
import { IconView } from '@/components/ui';
import { requestQiblaPermission, showQiblaLocationDialog } from '@/device/qibla';
import { checkForUpdates } from '@/device/updates';
import { ANIMATION, COLORS, HIT_SLOP, RADIUS, SIZE, SPACING, TEXT } from '@/shared/constants';
import { t } from '@/shared/i18n';
import { chevronFor, currentLocaleId, localeDirection } from '@/shared/i18n/locale';
import { isDecorationSeason } from '@/shared/time';
import { Icon } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { currentVisibleWhatsNew } from '@/shared/whatsNew';
import {
  countdownBarShownAtom,
  decorationsEnabledAtom,
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
} from '@/stores/ui';

import { SettingsToggle, Sheet } from '../parts';
import ColorPicker from './ColorPicker';

// The string guard reads attribute-held literals as copy; these are code values, so they travel as constants
const SHEET_ICON_COLOR = 'rgba(165, 180, 252, 0.8)';
const SETTINGS_PERF_NAME = 'sheet_settings';
// The settled row's green, the owner's "purple to a green colour": one row's settled state, not a palette role
const UPTODATE_BADGE = '#16a34a';
const UPTODATE_BADGE_BORDER = '#22c55e';
// The failed check's red, the green tick's mirror (owner order 2026-10-27): same one-row scope
const FAILED_BADGE = '#dc2626';
const FAILED_BADGE_BORDER = '#ef4444';

/** The update row's four looks, scoped to one opening of the sheet */
type UpdateRowState = 'idle' | 'checking' | 'upToDate' | 'failed';

export default function BottomSheetSettings() {
  const [countdownBarShown, setCountdownBarShown] = useAtom(countdownBarShownAtom);
  const [hijriEnabled, setHijriEnabled] = useAtom(hijriDateEnabledAtom);
  const [showSeconds, setShowSeconds] = useAtom(showSecondsAtom);
  const [showTimePassed, setShowTimePassed] = useAtom(showTimePassedAtom);
  const [decorationsEnabled, setDecorationsEnabled] = useAtom(decorationsEnabledAtom);
  const showDecorationToggle = useMemo(() => isDecorationSeason(), []);
  const [updateRowState, setUpdateRowState] = useState<UpdateRowState>('idle');
  const isChecking = updateRowState === 'checking';
  const isUpToDate = updateRowState === 'upToDate';
  const isFailed = updateRowState === 'failed';
  const updateRowLabel = isChecking
    ? t('settings.checkingUpdates')
    : isUpToDate
      ? t('settings.upToDate')
      : isFailed
        ? t('settings.updateCheckFailed')
        : t('settings.checkUpdates');

  // One check per opening of the sheet (owner order 2026-10-27). The spend and the session
  // counter live in refs so a press reads them synchronously, and closing the sheet re-arms
  const checkSpentRef = useRef(false);
  const sheetSessionRef = useRef(0);

  // Closing the sheet ends its session: the budget re-arms, the row rests, and an answer still
  // in flight lands nowhere - the session counter has moved past it
  const handleSheetDismiss = () => {
    sheetSessionRef.current++;
    checkSpentRef.current = false;
    setUpdateRowState('idle');
  };

  // The two arrows turn clockwise, round and round, for exactly as long as the check runs. The
  // RTL face mirrors the row whole: the glyph flips in its wrapper, and a mirrored clockwise
  // turn is the anti-clockwise read
  const isRtlLayout = localeDirection(currentLocaleId()) === 'rtl';
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!isChecking) {
      // A settle that keeps the ring (a failed check) rests it at its authored angle, not wherever the turn stopped
      spin.value = 0;
      return;
    }
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

  // The row's own entry into the one update flow. The sheet session's budget is spent on the
  // press - which is what blocks a second check while one runs - and handed back by a
  // failure: only a verdict (up to date, or update-found) keeps it spent, so a failed check
  // stays retryable without the sheet closing (owner order 2026-10-27). Manual skips only
  // that call's throttle read, so the launch check keeps its 24-hour window.
  // checkForUpdates never rejects, so the promise has no rejection path to handle
  const handleCheckUpdatesPress = () => {
    if (checkSpentRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkSpentRef.current = true;
    const session = sheetSessionRef.current;
    setUpdateRowState('checking');
    checkForUpdates({ manual: true }).then((result) => {
      // The sheet closed on this check: its answer belongs to a session that has ended
      if (session !== sheetSessionRef.current) return;
      if (result.modal) {
        // The modal renders under this sheet, so the sheet closes first - the What's New and
        // Help rows trust the same 150ms - and the row rests: the modal owns the message
        hideSettingsSheet();
        setTimeout(() => setPopupUpdateEnabled(true), 150);
        setUpdateRowState('idle');
        return;
      }
      if (result.failed) {
        // No verdict was reached, so the budget returns and the row owns the message itself
        checkSpentRef.current = false;
        setUpdateRowState('failed');
        return;
      }
      // A store that answered current is the one answer the modal cannot show; Play's own
      // update flow (update-found on Android) rests the row the same way, its overlay owning
      // the message
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
      onDismiss={handleSheetDismiss}
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
            carry a chevron, the up-to-date verdict settles the badge green with a tick, and a
            failed check settles it red with an X while the circle stays so the row reads retryable */}
        <Pressable
          style={styles.whatsNewButton}
          onPress={handleCheckUpdatesPress}
          hitSlop={HIT_SLOP.md}
          accessibilityLabel={updateRowLabel}
          accessibilityRole={'button'}>
          <View
            style={[styles.infoButton, isUpToDate && styles.infoButtonSettled, isFailed && styles.infoButtonFailed]}>
            {isUpToDate ? (
              <CheckIcon width={9} height={9} style={{ color: COLORS.text.primary }} />
            ) : isFailed ? (
              <CloseIcon width={9} height={9} style={{ color: COLORS.text.primary }} />
            ) : (
              <IconView type={Icon.DOWNLOAD} size={9} color={COLORS.text.primary} />
            )}
          </View>
          <Text style={styles.whatsNewLabel}>{updateRowLabel}</Text>
          {isUpToDate ? null : (
            // The wrapper carries the RTL mirror: a flipped glyph under a clockwise turn reads
            // anti-clockwise, the mirrored face's turn
            <View style={isRtlLayout ? styles.refreshMirrored : undefined}>
              <IconView type={Icon.REFRESH} size={SIZE.icon.sm} color={COLORS.icon.primary} animatedStyle={spinStyle} />
            </View>
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
  infoButtonFailed: {
    backgroundColor: FAILED_BADGE,
    borderColor: FAILED_BADGE_BORDER,
  },
  refreshMirrored: {
    transform: [{ scaleX: -1 }],
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
