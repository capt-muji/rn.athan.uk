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
import { usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, SIZE, SPACING, STYLES } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, Icon, type ScheduleType } from '@/shared/types';
import { getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { canonicalPrayerIndex, getPrayerAlertAtom } from '@/stores/notifications';
import { showAlertSheet } from '@/stores/ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type AlertIconType = Icon.BELL_RING | Icon.BELL_SLASH | Icon.SPEAKER;

const ALERT_CONFIGS: { icon: AlertIconType; type: AlertType }[] = [
  { icon: Icon.BELL_SLASH, type: AlertType.Off },
  { icon: Icon.BELL_RING, type: AlertType.Silent },
  { icon: Icon.SPEAKER, type: AlertType.Sound },
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
 */
export default function Alert({ type, index }: Props) {
  // =============================================================================
  // STATE & REFS
  // =============================================================================

  const [isPressed, setIsPressed] = useState(false);

  // `index` is CHRONOLOGICAL — List hands each row its position in the
  // datetime-sorted day — while the alert atoms and the scheduler are both
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

  const iconIndex = displayedAlert;

  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));

  const previousDisplayDate = usePrevious(Schedule.displayDate);
  const isCascadeRoll =
    previousDisplayDate !== Schedule.displayDate &&
    !isSelectedForOverlay &&
    !isPressed &&
    !Schedule.isLastPrayerPassed &&
    Schedule.nextPrayerIndex === 0 &&
    index !== 0;
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
    playSwapBounce(alertAtom, setDisplayedAlert);
  }, [alertAtom, playSwapBounce]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check permissions before opening sheet
    if (alertAtom === AlertType.Off) {
      await ensurePermissions();
    }

    // Open bottom sheet. The sheet seeds and commits through five store calls
    // keyed off this index, so handing it the canonical one fixes all five here.
    showAlertSheet({
      type,
      index: alertIndex,
      prayerEnglish: Prayer.english,
      prayerArabic: Prayer.arabic,
    });
  }, [type, alertIndex, Prayer.english, Prayer.arabic, alertAtom, ensurePermissions]);

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
