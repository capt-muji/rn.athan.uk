import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import ALERT_ICONS from '@/assets/icons/svg/alerts';
import { useAlertAnimations } from '@/hooks/useAlertAnimations';
import { useNotification } from '@/hooks/useNotification';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { STYLES, SPACING, SIZE, ANIMATION } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, Icon, ScheduleType } from '@/shared/types';
import { getPrayerAlertAtom } from '@/stores/notifications';
import { overlayAtom } from '@/stores/overlay';
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
  isOverlay?: boolean;
}

/**
 * Alert component for prayer notification preferences
 *
 * Opens a bottom sheet on press with:
 * - At-time alert options (Off/Silent/Sound)
 * - Reminder toggle with options when enabled
 * - Reminder interval selection (5-30 min)
 */
export default function Alert({ type, index, isOverlay = false }: Props) {
  // =============================================================================
  // STATE & REFS
  // =============================================================================

  const [isPressed, setIsPressed] = useState(false);

  // Atoms
  const alertAtom = useAtomValue(getPrayerAlertAtom(type, index));
  const refreshUI = useAtomValue(refreshUIAtom);
  const overlay = useAtomValue(overlayAtom);

  // =============================================================================
  // CUSTOM HOOKS
  // =============================================================================

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const { ensurePermissions } = useNotification();
  const { AnimScale, AnimFill } = useAlertAnimations({
    initialColorPos: Prayer.ui.initialColorPos,
  });

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  const iconIndex = alertAtom;

  const isSelectedForOverlay = useMemo(
    () => overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type,
    [overlay.isOn, overlay.selectedPrayerIndex, overlay.scheduleType, index, type]
  );

  // =============================================================================
  // ANIMATION EFFECTS
  // =============================================================================

  // Force animation to respect new state immediately when refreshing
  useEffect(() => {
    AnimFill.animate(Prayer.ui.initialColorPos);
  }, [refreshUI]);

  // Animate when next prayer changes
  useEffect(() => {
    if (Prayer.isNext) AnimFill.animate(1);
  }, [Prayer.isNext]);

  // Cascade animation when date changes and we're at first prayer
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

  // Update fill color based on selection/pressed state
  useEffect(() => {
    const colorPos = isSelectedForOverlay || Prayer.isOverlay || isPressed ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos, { duration: ANIMATION.durationVeryFast });
  }, [isSelectedForOverlay, isPressed, Prayer.isOverlay]);

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
          <Svg viewBox="0 0 256 256" width={SIZE.icon.md} height={SIZE.icon.md}>
            <AnimatedPath d={ALERT_ICONS[ALERT_CONFIGS[iconIndex].icon]} animatedProps={AnimFill.animatedProps} />
          </Svg>
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
