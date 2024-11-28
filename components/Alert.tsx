import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { useAnimationScale, useAnimationOpacity, useAnimationBounce, useAnimationFill } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { COLORS, TEXT, ANIMATION, STYLES } from '@/shared/constants';
import { AlertType, AlertIcon, ScheduleType, AlertPreferences } from '@/shared/types';
import { setAlertPreference } from '@/stores/actions';
import { alertPreferencesAtom } from '@/stores/store';

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: 'Off', type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: 'Notification', type: AlertType.Notification },
  { icon: AlertIcon.VIBRATE, label: 'Vibrate', type: AlertType.Vibrate },
  { icon: AlertIcon.SPEAKER, label: 'Sound', type: AlertType.Sound },
];

interface Props {
  index: number;
  type: ScheduleType;
}

export default function Alert({ index, type }: Props) {
  const Prayer = usePrayer(index, type);
  const AnimScale = useAnimationScale(1);
  const AnimOpacity = useAnimationOpacity(0);
  const AnimBounce = useAnimationBounce(0);
  const AnimFill = useAnimationFill(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  // State
  const alertPreferences = useAtomValue(alertPreferencesAtom) as AlertPreferences;
  const [iconIndex, setIconIndex] = useState<number>(alertPreferences[index] || 0);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Animations Updates
  if (Prayer.isNext) AnimFill.animate(1);

  // Effects
  useEffect(() => {
    const colorPos = isPopupActive ? 1 : Prayer.ui.initialColorPos;
    AnimFill.animate(colorPos);
  }, [isPopupActive]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // Handlers
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);
    setAlertPreference(index, ALERT_CONFIGS[nextIndex].type);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsPopupActive(true);

    // Reset and trigger animations
    AnimBounce.value.value = 0;
    AnimOpacity.animate(1, { duration: 5 });
    AnimBounce.animate(1);

    timeoutRef.current = setTimeout(() => {
      AnimOpacity.animate(0, { duration: 5 });
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  }, [iconIndex, index]);

  const computedStylesPopup = {
    // TODO: change shadows for both standard and extra
    shadowColor: Prayer.isStandard ? COLORS.standardActiveBackgroundShadow : COLORS.extraActiveBackgroundShadow,
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => AnimScale.animate(0.9)}
        onPressOut={() => AnimScale.animate(1)}
        style={styles.iconContainer}
      >
        <Animated.View style={AnimScale.style}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={AnimFill.animatedProps} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylesPopup, AnimOpacity.style, AnimBounce.style]}>
        <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} color="white" />
        <Text style={styles.label}>{ALERT_CONFIGS[iconIndex].label}</Text>
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
    ...STYLES.prayer.shadow,
    position: 'absolute',
    alignSelf: 'center',
    right: '100%',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'black',
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
