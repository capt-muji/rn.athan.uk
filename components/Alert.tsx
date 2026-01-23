import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAlertAnimations } from '@/hooks/useAlertAnimations';
import { useAlertPopupState } from '@/hooks/useAlertPopupState';
import { useNotification } from '@/hooks/useNotification';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, TEXT, STYLES } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, AlertIcon, ScheduleType } from '@/shared/types';
import { getPrayerAlertAtom, setPrayerAlertType } from '@/stores/notifications';
import { overlayAtom } from '@/stores/overlay';
import { refreshUIAtom } from '@/stores/ui';

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: 'Off', type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: 'Silent', type: AlertType.Silent },
  { icon: AlertIcon.SPEAKER, label: 'Sound', type: AlertType.Sound },
];

interface Props {
  type: ScheduleType;
  index: number;
  isOverlay?: boolean;
}

/**
 * Alert component for prayer notification preferences
 *
 * Cycles through Off → Silent → Sound alert types on press.
 * Shows animated popup feedback when changing alert type.
 *
 * @see useAlertAnimations - Animation logic
 * @see useAlertPopupState - Popup timing logic
 */
export default function Alert({ type, index, isOverlay = false }: Props) {
  // State
  const alertAtom = useAtomValue(getPrayerAlertAtom(type, index));
  const [iconIndex, setIconIndex] = useState(alertAtom);
  const [popupIconIndex, setPopupIconIndex] = useState(alertAtom);

  // Atoms
  const refreshUI = useAtomValue(refreshUIAtom);
  const overlay = useAtomValue(overlayAtom);

  // Custom hooks
  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const { handleAlertChange, ensurePermissions } = useNotification();
  const { AnimScale, AnimOpacity, AnimBounce, AnimFill, resetPopupAnimations, hidePopup } = useAlertAnimations({
    initialColorPos: Prayer.ui.initialColorPos,
  });
  const { isPopupActive, showPopup, clearTimeouts } = useAlertPopupState({
    onShow: resetPopupAnimations,
    onHide: hidePopup,
  });

  // Memoized values
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
      !isPopupActive &&
      !Schedule.isLastPrayerPassed &&
      Schedule.nextPrayerIndex === 0 &&
      index !== 0
    ) {
      const delay = getCascadeDelay(index, type);
      AnimFill.animate(0, { delay });
    }
  }, [Schedule.displayDate, isSelectedForOverlay]);

  // Update fill color based on selection state
  useEffect(() => {
    const colorPos = isSelectedForOverlay || Prayer.isOverlay || isPopupActive ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos, { duration: 50 });
  }, [isSelectedForOverlay, isPopupActive, Prayer.isOverlay]);

  // =============================================================================
  // STATE SYNC EFFECTS
  // =============================================================================

  // Sync alert preferences with state
  useEffect(() => {
    setIconIndex(alertAtom);
    setPopupIconIndex(alertAtom);
  }, [alertAtom]);

  // Disable popup on overlay open/close
  useEffect(() => {
    clearTimeouts();
    AnimOpacity.value.value = 0;
  }, [overlay.isOn]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    const nextAlertType = ALERT_CONFIGS[nextIndex].type;

    // Check permissions if enabling notifications
    if (nextAlertType !== AlertType.Off) {
      const hasPermission = await ensurePermissions();
      if (!hasPermission) return;
    }

    // Update UI state immediately (optimistic update)
    setPopupIconIndex(nextIndex);
    setIconIndex(nextIndex);

    // Show popup with animations
    showPopup();

    // Persist the change (debounced)
    const success = await handleAlertChange(type, index, Prayer.english, Prayer.arabic, nextAlertType);

    if (success) {
      setPrayerAlertType(type, index, nextAlertType);
    } else {
      // Revert on failure
      setPopupIconIndex(alertAtom);
      setIconIndex(alertAtom);
    }
  }, [
    iconIndex,
    ensurePermissions,
    showPopup,
    handleAlertChange,
    type,
    index,
    Prayer.english,
    Prayer.arabic,
    alertAtom,
  ]);

  // =============================================================================
  // COMPUTED STYLES
  // =============================================================================

  const computedStylePopup: ViewStyle = {
    shadowColor: Prayer.isStandard ? '#010931' : '#000416',
    backgroundColor: Prayer.isOverlay && !Prayer.isNext ? COLORS.activeBackground : 'black',
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}
        style={styles.iconContainer}>
        <Animated.View style={AnimScale.style}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={AnimFill.animatedProps} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylePopup, AnimOpacity.style, AnimBounce.style]}>
        <Icon type={ALERT_CONFIGS[popupIconIndex].icon} size={20} color="white" />
        <Text style={styles.label}>{ALERT_CONFIGS[popupIconIndex].label}</Text>
      </Animated.View>
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
    paddingLeft: 13,
    justifyContent: 'center',
  },
  popup: {
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    position: 'absolute',
    alignSelf: 'center',
    right: '100%',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 15,
    elevation: 15,
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.activePrayer,
  },
});
