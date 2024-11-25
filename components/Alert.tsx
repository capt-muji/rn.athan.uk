import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { StyleSheet, Pressable, Text, View, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
  interpolateColor,
  useAnimatedProps,
  withDelay
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, ANIMATION, PRAYER } from '@/shared/constants';
import { AlertType, AlertIcon, ScheduleType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { alertPreferencesAtom, standardScheduleAtom, extraScheduleAtom, dateAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';
import Icon from '@/components/Icon';
import { isTimePassed } from '@/shared/time';

const ANIMATION_CONFIG = {
  spring: { damping: 12, stiffness: 500, mass: 0.5 },
  timing: { duration: 5 },
  popup: {
    duration: ANIMATION.duration,
    durationSlow: ANIMATION.durationSlow,
    removeDelay: 1500
  }
};

const ALERT_CONFIGS = [
  { icon: AlertIcon.BELL_SLASH, label: "Off", type: AlertType.Off },
  { icon: AlertIcon.BELL_RING, label: "Notification", type: AlertType.Notification },
  { icon: AlertIcon.VIBRATE, label: "Vibrate", type: AlertType.Vibrate },
  { icon: AlertIcon.SPEAKER, label: "Sound", type: AlertType.Sound }
];

interface Props {
  index: number;
  type: ScheduleType;
  isOverlay?: boolean;
}

export default function Alert({ index, type, isOverlay = false }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const { nextIndex, today } = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const alertPreferences = useAtomValue(alertPreferencesAtom);
  const [iconIndex, setIconIndex] = useState(alertPreferences[index] || 0);

  // const overlayVisible = false;

  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const prayer = today[index];
  const isPassed = isTimePassed(prayer.time);
  const isNext = index === nextIndex;


  // Stores initial color state based on prayer status
  const onLoadColorPos = isPassed || isNext ? 1 : 0;

  const animations = {
    fade: useSharedValue(0),
    bounce: useSharedValue(0),
    press: useSharedValue(1),
    colorPos: useSharedValue(onLoadColorPos)
  };

  // Simplify popup effect to just animate to 1 and back to proper state
  useEffect(() => {
    const colorPos = isPopupActive ? 1 : onLoadColorPos;
    animations.colorPos.value = withTiming(colorPos, { duration: ANIMATION_CONFIG.popup.duration });
  }, [isPopupActive]);

  if (isNext) {
    animations.colorPos.value = withDelay(
      ANIMATION_CONFIG.popup.duration,
      withTiming(1, { duration: ANIMATION_CONFIG.popup.durationSlow })
    );
  };

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);
    setAlertPreference(index, ALERT_CONFIGS[nextIndex].type);

    timeoutRef.current && clearTimeout(timeoutRef.current);

    // Reset and trigger animations
    animations.bounce.value = 0;
    animations.fade.value = withTiming(1, ANIMATION_CONFIG.timing);
    animations.bounce.value = withSpring(1, ANIMATION_CONFIG.spring);

    setIsPopupActive(true);

    timeoutRef.current = setTimeout(() => {
      animations.fade.value = withTiming(0, ANIMATION_CONFIG.timing);
      animations.bounce.value = withSpring(0, ANIMATION_CONFIG.spring);
      setIsPopupActive(false);
    }, ANIMATION_CONFIG.popup.removeDelay);
  }, [iconIndex, index]);

  const alertAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animations.press.value }]
  }));

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animations.fade.value,
    transform: [{
      scale: interpolate(animations.bounce.value, [0, 1], [0.95, 1])
    }]
  }));

  const iconAnimatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      animations.colorPos.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }));

  const computedStylesPopup = {
    ...PRAYER.shadow.common,
    ...(isStandard ? PRAYER.shadow.standard : PRAYER.shadow.extra)
  }

  useEffect(() => {
    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => animations.press.value = withSpring(0.9, ANIMATION_CONFIG.spring)}
        onPressOut={() => animations.press.value = withSpring(1, ANIMATION_CONFIG.spring)}
        style={styles.iconContainer}
      >
        <Animated.View style={alertAnimatedStyle}>
          <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} animatedProps={iconAnimatedProps} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, computedStylesPopup, popupAnimatedStyle,]}>
        <Icon type={ALERT_CONFIGS[iconIndex].icon} size={20} color="white" />
        <Text style={[styles.label]}>
          {ALERT_CONFIGS[iconIndex].label}
        </Text>
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
