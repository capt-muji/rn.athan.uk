import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, ANIMATION, PRAYER } from '@/shared/constants';
import { AlertType, AlertIcon, ScheduleType, AlertPreferences } from '@/shared/types';
import { alertPreferencesAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';
import { useScaleAnimation, useFadeAnimation, useBounceAnimation, useFillAnimation } from '@/hooks/animations';
import Icon from '@/components/Icon';
import { usePrayer } from '@/hooks/usePrayer';

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: "Off", type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: "Notification", type: AlertType.Notification },
  { icon: AlertIcon.VIBRATE, label: "Vibrate", type: AlertType.Vibrate },
  { icon: AlertIcon.SPEAKER, label: "Sound", type: AlertType.Sound }
];

interface Props { index: number; type: ScheduleType }

export default function Alert({ index, type }: Props) {
  const Prayer = usePrayer(index, type);
  const ScaleAnim = useScaleAnimation(1);
  const FadeAnim = useFadeAnimation(0);
  const BounceAnim = useBounceAnimation(0);
  const FillAnim = useFillAnimation(Prayer.ui.initialColorPos);

  // State
  const alertPreferences = useAtomValue(alertPreferencesAtom) as AlertPreferences;
  const [iconIndex, setIconIndex] = useState<number>(alertPreferences[index] || 0);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Animations Updates
  if (Prayer.isNext) FillAnim.animate(1);

  // Effects
  useEffect(() => {
    const colorPos = isPopupActive ? 1 : Prayer.ui.initialColorPos;
    FillAnim.animate(colorPos);
  }, [isPopupActive]);

  useEffect(() => () => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
  }, []);

  // Handlers
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);
    setAlertPreference(index, ALERT_CONFIGS[nextIndex].type);

    timeoutRef.current && clearTimeout(timeoutRef.current);

    setIsPopupActive(true);

    // Reset and trigger animations
    BounceAnim.value.value = 0;
    FadeAnim.animate(1, { duration: 5 });
    BounceAnim.animate(1);

    timeoutRef.current = setTimeout(() => {
      FadeAnim.animate(0, { duration: 5 });
      setIsPopupActive(false);
    }, ANIMATION.popupDuration);
  }, [iconIndex, index]);

  const computedStylesPopup = {
    ...PRAYER.shadow.common,
    ...(Prayer.isStandard ? PRAYER.shadow.standard : PRAYER.shadow.extra)
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => ScaleAnim.animate(0.9)}
        onPressOut={() => ScaleAnim.animate(1)}
        style={styles.iconContainer}
      >
        <Animated.View style={ScaleAnim.style}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={FillAnim.animatedProps} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylesPopup, FadeAnim.style, BounceAnim.style]}>
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
    paddingRight: PRAYER.padding.right,
    paddingLeft: 13,
    justifyContent: 'center',
  },
  popup: {
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
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.activePrayer,
  },
});
