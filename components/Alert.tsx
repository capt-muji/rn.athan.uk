import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationScale, useAnimationOpacity, useAnimationBounce, useAnimationFill } from '@/hooks/useAnimation';
import { useNotification } from '@/hooks/useNotification';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, TEXT, ANIMATION, STYLES } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { AlertType, AlertIcon, ScheduleType } from '@/shared/types';
import { getPrayerAlertAtom, setPrayerAlertType } from '@/stores/notifications';
import { overlayAtom, toggleOverlay } from '@/stores/overlay';
import { showSheet } from '@/stores/ui';

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

export default function Alert({ type, index, isOverlay = false }: Props) {
  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const overlay = useAtomValue(overlayAtom);
  const { handleAlertChange, ensurePermissions } = useNotification();

  const alertAtom = useAtomValue(getPrayerAlertAtom(type, index));
  const [iconIndex, setIconIndex] = useState(alertAtom);
  const [popupIconIndex, setPopupIconIndex] = useState(alertAtom);

  const AnimScale = useAnimationScale(1);
  const AnimOpacity = useAnimationOpacity(0);
  const AnimBounce = useAnimationBounce(0);
  const AnimFill = useAnimationFill(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: Schedule.isMuted ? COLORS.inactivePrayer : COLORS.activePrayer,
  });

  const [isPopupActive, setIsPopupActive] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const debouncedAlertRef = useRef<NodeJS.Timeout>();

  // Create debounced version of handleAlertChange
  const debouncedHandleAlertChange = useCallback(
    (newAlertType: AlertType) => {
      if (debouncedAlertRef.current) clearTimeout(debouncedAlertRef.current);

      debouncedAlertRef.current = setTimeout(async () => {
        // Update atom storage using setPrayerAlertType instead
        setPrayerAlertType(type, index, newAlertType);

        const success = await handleAlertChange(type, index, Prayer.english, Prayer.arabic, newAlertType);
        if (!success) {
          // Revert UI and atom if the change fails
          setPopupIconIndex(iconIndex);
          setIconIndex(iconIndex);
          setPrayerAlertType(type, index, iconIndex);
        }
      }, ANIMATION.debounce);
    },
    [type, index, Prayer.english, Prayer.arabic, handleAlertChange, iconIndex]
  );

  // Animations Updates
  if (Prayer.isNext) AnimFill.animate(1);

  if (!isPopupActive && !Schedule.isLastPrayerPassed && Schedule.schedule.nextIndex === 0 && index !== 0) {
    const delay = getCascadeDelay(index, type);
    AnimFill.animate(0, { delay });
  }

  // Effects
  // Sync alert preferences with state
  useEffect(() => {
    setIconIndex(alertAtom);
    setPopupIconIndex(alertAtom);
  }, [alertAtom]);

  // Disable popup on overlay open/close
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    AnimOpacity.value.value = 0;
    setIsPopupActive(false);
  }, [overlay.isOn]);

  useEffect(() => {
    const colorPos = (Prayer.isOverlay || isPopupActive) && !Schedule.isMuted ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos, { duration: 50 });
  }, [isPopupActive, Prayer.isOverlay, Schedule.isMuted]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (debouncedAlertRef.current) clearTimeout(debouncedAlertRef.current);
    };
  }, []);

  // Handlers
  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    const nextAlertType = ALERT_CONFIGS[nextIndex].type;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // If schedule is not muted and we're not turning off notifications, check permissions
    if (!Schedule.isMuted && nextAlertType !== AlertType.Off) {
      const hasPermission = await ensurePermissions();
      if (!hasPermission) return;
    }

    // Update UI immediately (but not storage)
    setPopupIconIndex(nextIndex);
    setIconIndex(nextIndex);

    // Reset animations
    AnimBounce.value.value = 0;
    AnimOpacity.animate(1, { duration: 50 });
    AnimBounce.animate(1);

    setIsPopupActive(true);

    // Only update notifications if schedule is not muted
    if (!Schedule.isMuted) {
      debouncedHandleAlertChange(nextAlertType);
    } else {
      // Just update the UI state without triggering notifications
      setPrayerAlertType(type, index, nextAlertType); // Just update the UI state without triggering notifications
    }

    timeoutRef.current = setTimeout(() => {
      AnimOpacity.animate(0, { duration: 50 });
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  };

  const handleLongPress = () => {
    toggleOverlay(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showSheet();
  };

  const computedStylesPopup: ViewStyle = {
    shadowColor: Prayer.isStandard ? '#010931' : '#000416',
    backgroundColor: Prayer.isOverlay ? (Prayer.isNext ? 'black' : COLORS.activeBackground) : 'black',
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={200}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}
        style={styles.iconContainer}>
        <Animated.View style={AnimScale.style}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={AnimFill.animatedProps} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylesPopup, AnimOpacity.style, AnimBounce.style]}>
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
  },
  popupIcon: {
    marginRight: 15,
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.activePrayer,
  },
});
