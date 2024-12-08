import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationScale, useAnimationOpacity, useAnimationBounce, useAnimationFill } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { COLORS, TEXT, ANIMATION, STYLES } from '@/shared/constants';
import { AlertType, AlertIcon, ScheduleType } from '@/shared/types';
import { setAlertPreference, standardAlertPreferencesAtom, extraAlertPreferencesAtom } from '@/stores/notifications';

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: 'Off', type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: 'Notification', type: AlertType.Notification },
  { icon: AlertIcon.VIBRATE, label: 'Vibrate', type: AlertType.Vibrate },
  { icon: AlertIcon.SPEAKER, label: 'Sound', type: AlertType.Sound },
];

interface Props {
  type: ScheduleType;
  index: number;
}

export default function Alert({ type, index }: Props) {
  const Prayer = usePrayer(type, index);

  const AnimScale = useAnimationScale(1);
  const AnimOpacity = useAnimationOpacity(0);
  const AnimBounce = useAnimationBounce(0);
  const AnimFill = useAnimationFill(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  const alertPreferences = useAtomValue(Prayer.isStandard ? standardAlertPreferencesAtom : extraAlertPreferencesAtom);

  const [iconIndex, setIconIndex] = useState(alertPreferences[index]);
  const [popupIconIndex, setPopupIconIndex] = useState(iconIndex);
  const [isPopupActive, setIsPopupActive] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();

  // Animations Updates
  if (Prayer.isNext) AnimFill.animate(1);

  // Effects
  // Sync alert preferences with state
  useEffect(() => {
    setIconIndex(alertPreferences[index]);
    setPopupIconIndex(alertPreferences[index]);
  }, [alertPreferences, index]);

  useEffect(() => {
    const colorPos = Prayer.isOnOverlay || isPopupActive ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos, { duration: 50 });
  }, [isPopupActive, Prayer.isOnOverlay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handlers
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setPopupIconIndex(nextIndex);
    setIconIndex(nextIndex);
    setAlertPreference(type, index, ALERT_CONFIGS[nextIndex].type);

    // Reset animations
    AnimBounce.value.value = 0;
    AnimOpacity.animate(1, { duration: 50 });
    AnimBounce.animate(1);

    setIsPopupActive(true);

    timeoutRef.current = setTimeout(() => {
      AnimOpacity.animate(0, { duration: 50 });
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  };

  const computedStylesPopup = {
    shadowColor: Prayer.isStandard ? '#010931' : '#000416',
    backgroundColor: Prayer.isOnOverlay ? (Prayer.isNext ? 'black' : COLORS.activeBackground) : 'black',
  };

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
