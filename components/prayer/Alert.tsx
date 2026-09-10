import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import ALERT_ICONS from '@/assets/icons/svg/alerts';
import { useAlertAnimations } from '@/hooks/useAlertAnimations';
import { useNotification } from '@/hooks/useNotification';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, SIZE, SPACING, STYLES } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, Icon, type ScheduleType } from '@/shared/types';
import { getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { getPrayerAlertAtom } from '@/stores/notifications';
import { refreshUIAtom, showAlertSheet } from '@/stores/ui';

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

  // Atoms
  const alertAtom = useAtomValue(getPrayerAlertAtom(type, index));
  const refreshUI = useAtomValue(refreshUIAtom);

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
  const Prayer = usePrayer(type, index);
  const { ensurePermissions } = useNotification();
  const { AnimScale, AnimFill, AnimSwap } = useAlertAnimations({
    initialColorPos: Prayer.ui.initialColorPos,
  });
  const playSwapBounce = AnimSwap.play;

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  const iconIndex = displayedAlert;

  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));

  // =============================================================================
  // ANIMATION EFFECTS
  // =============================================================================

  // Force animation to respect new state immediately when refreshing
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshUI is a deliberate re-fire signal; initialColorPos and isSelectedForOverlay are read from the fresh render closure at signal time
  useEffect(() => {
    const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos);
  }, [refreshUI]);

  // Animate when next prayer changes
  useEffect(() => {
    if (Prayer.isNext) AnimFill.animate(1);
  }, [Prayer.isNext, AnimFill.animate]);

  // Cascade animation when date changes and we're at first prayer
  // biome-ignore lint/correctness/useExhaustiveDependencies: displayDate is the deliberate cascade trigger; the remaining values are read once per date change by design
  useEffect(() => {
    if (
      !isSelectedForOverlay &&
      !isPressed &&
      !Schedule.isLastPrayerPassed &&
      Schedule.nextPrayerIndex === 0 &&
      index !== 0
    ) {
      const delay = getCascadeDelay(index, type);
      AnimFill.animate(0, { delay });
    }
  }, [Schedule.displayDate, isSelectedForOverlay]);

  // Update fill color based on selection state.
  // 150ms ≈ the original overlay's perceived row-rise pace (x19: 87→254 over ~150ms)
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on selection only; initialColorPos changes are handled by the refresh/next/cascade effects
  useEffect(() => {
    const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos, { duration: ANIMATION.durationFade });
  }, [isSelectedForOverlay]);

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

    // Open bottom sheet
    showAlertSheet({
      type,
      index,
      prayerEnglish: Prayer.english,
      prayerArabic: Prayer.arabic,
    });
  }, [type, index, Prayer.english, Prayer.arabic, alertAtom, ensurePermissions]);

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
              <AnimatedPath d={ALERT_ICONS[ALERT_CONFIGS[iconIndex].icon]} animatedProps={AnimFill.animatedProps} />
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
