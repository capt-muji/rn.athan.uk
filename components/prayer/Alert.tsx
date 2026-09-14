import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import ALERT_ICONS from '@/assets/icons/svg/alerts';
import { useAlertAnimations } from '@/hooks/useAlertAnimations';
import { useDerivedFill } from '@/hooks/useAnimation';
import { useNotification } from '@/hooks/useNotification';
import { getShownAlert, isShownOccurrenceUnavailable, usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { isCascadeRow, useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, SIZE, SPACING, STYLES } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, Icon, type ScheduleType } from '@/shared/types';
import { getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { canonicalPrayerIndex, getPrayerAlertAtom } from '@/stores/notifications';
import { showAlertSheet } from '@/stores/ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type AlertIconType = Icon.BELL_RING | Icon.BELL_SLASH | Icon.SPEAKER;

// `spoken` is the state's screen-reader name: visually the state is carried
// only by the glyph shape and its fill colour, and this is the control that
// decides whether a prayer alerts at all. Kept on ALERT_CONFIGS so the icon and
// the wording for a state cannot drift apart — the array index IS the AlertType.
const ALERT_CONFIGS: { icon: AlertIconType; type: AlertType; spoken: string }[] = [
  { icon: Icon.BELL_SLASH, type: AlertType.Off, spoken: 'off' },
  { icon: Icon.BELL_RING, type: AlertType.Silent, spoken: 'silent' },
  { icon: Icon.SPEAKER, type: AlertType.Sound, spoken: 'sound' },
];

interface Props {
  type: ScheduleType;
  index: number;
}

/**
 * Alert component for prayer notification preferences
 *
 * Opens a bottom sheet on press with:
 * - At-time alert options (Off/Silent/Sound)
 * - Reminder toggle with options when enabled
 * - Reminder interval selection (5-30 min)
 *
 * While the occurrence on screen has no readable time, the sheet shows only a message saying why no alert
 * can go off, and the bell draws Off (R5).
 */
export default function Alert({ type, index }: Props) {
  // =============================================================================
  // STATE & REFS
  // =============================================================================

  const [isPressed, setIsPressed] = useState(false);

  // `index` is the row's position in the day as the sequence holds it, while
  // the alert atoms and the scheduler are both
  // CANONICAL, keyed off EXTRAS_ENGLISH/PRAYERS_ENGLISH order. Resolve by name
  // so the bell, the sheet it opens and the scheduler cannot drift apart if the
  // two orders ever stop coinciding. usePrayer has to run before the atom read
  // for that; the hook order stays unconditional, which is all React requires.
  const Prayer = usePrayer(type, index);
  const alertIndex = canonicalPrayerIndex(type, Prayer.english, index);

  // Atoms
  const alertAtom = useAtomValue(getPrayerAlertAtom(type, alertIndex));

  // Glyph shown this frame — lags the atom through the change-bounce so the
  // swap lands inside the animation (trough for exit-style candidates), not
  // as an instant snap at the atom flip. Initialized to the atom: mount is
  // settled, first frame shows the correct glyph.
  const [displayedAlert, setDisplayedAlert] = useState<AlertType>(alertAtom);
  const prevAlertRef = useRef<AlertType>(alertAtom);

  // =============================================================================
  // CUSTOM HOOKS
  // =============================================================================

  const Schedule = useSchedule(type);
  const { ensurePermissions } = useNotification();
  const { AnimScale, AnimSwap } = useAlertAnimations();
  const playSwapBounce = AnimSwap.play;

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  const NextOccurrencePrayer = usePrayer(type, index, true);
  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));

  // The same occurrence Time.tsx draws: the bell is unavailable exactly when the time on screen is --:--, since
  // nothing can ever fire for it (R5), and its press explains that. The saved preference is only read, never changed
  const isUnavailable = isShownOccurrenceUnavailable(isSelectedForOverlay, Prayer, NextOccurrencePrayer);

  const iconIndex = getShownAlert(isUnavailable, displayedAlert);

  const previousDisplayDate = usePrevious(Schedule.displayDate);
  const isCascadeRoll =
    previousDisplayDate !== Schedule.displayDate &&
    !isSelectedForOverlay &&
    !isPressed &&
    !Schedule.isLastPrayerPassed &&
    isCascadeRow(Schedule, index);
  const previousIsSelected = usePrevious(isSelectedForOverlay);
  const isSelectionChange = previousIsSelected !== undefined && previousIsSelected !== isSelectedForOverlay;

  // Timings mirror Prayer.tsx: selection 150ms, next-prayer advance and cascade 1000ms
  const fillPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
  const fillProps = useDerivedFill(fillPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  // =============================================================================
  // ANIMATION EFFECTS
  // =============================================================================

  // Change-bounce: the icon pops ONLY when the alert value itself changes
  // (sheet-dismiss commit, or a commit rollback flipping it back — the replay
  // on revert is correct). First evaluation snaps: mount and plain re-renders
  // stay settled (the Toggle first-evaluation pattern), and a sheet that
  // closes without changes plays nothing. The glyph swap is handed to the
  // bounce, which fires it at the dip trough.
  useEffect(() => {
    if (prevAlertRef.current === alertAtom) return;
    prevAlertRef.current = alertAtom;
    // A bell that cannot be used draws Off whatever is saved, so a bounce would move a glyph that stays the same
    if (isUnavailable) {
      setDisplayedAlert(alertAtom);
      return;
    }
    playSwapBounce(alertAtom, setDisplayedAlert);
  }, [alertAtom, isUnavailable, playSwapBounce]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // With no readable time there is nothing to set, so the sheet only says why, and no permission is asked for
    if (!isUnavailable && alertAtom === AlertType.Off) {
      await ensurePermissions();
    }

    // Open bottom sheet. The sheet seeds and commits through five store calls
    // keyed off this index, so handing it the canonical one fixes all five here.
    showAlertSheet({
      type,
      index: alertIndex,
      prayerEnglish: Prayer.english,
      prayerArabic: Prayer.arabic,
      isUnavailable,
    });
  }, [type, alertIndex, Prayer.english, Prayer.arabic, alertAtom, ensurePermissions, isUnavailable]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          setIsPressed(true);
          AnimScale.animate(0.9);
        }}
        onPressOut={() => {
          setIsPressed(false);
          AnimScale.animate(1);
        }}
        accessibilityRole='button'
        // Named from the atom, not from `displayedAlert`: the glyph lags the
        // committed value through the change-bounce, and a screen reader must
        // hear the setting that is actually stored
        accessibilityLabel={
          isUnavailable
            ? `${Prayer.english} notification: unavailable`
            : `${Prayer.english} notification: ${ALERT_CONFIGS[alertAtom].spoken}`
        }
        accessibilityHint={
          isUnavailable ? 'Explains why no alert can be set for this prayer' : 'Opens the alert options for this prayer'
        }
        style={styles.iconContainer}>
        <Animated.View style={AnimScale.style}>
          <Animated.View style={AnimSwap.style}>
            <Svg viewBox='0 0 256 256' width={SIZE.icon.md} height={SIZE.icon.md}>
              <AnimatedPath d={ALERT_ICONS[ALERT_CONFIGS[iconIndex].icon]} animatedProps={fillProps} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  iconContainer: {
    paddingRight: STYLES.prayer.padding.right,
    paddingLeft: SPACING.mid - 1,
    justifyContent: 'center',
  },
});
