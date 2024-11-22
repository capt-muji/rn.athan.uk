import { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View, GestureResponderEvent } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, ANIMATION, PRAYER, PRAYERS_ENGLISH } from '@/shared/constants';
import { AlertType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { scheduleAtom, alertPreferencesAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';

const SPRING_CONFIG = { damping: 12, stiffness: 500, mass: 0.5 };
const TIMING_CONFIG = { duration: 5 };

const ALERT_CONFIGS = [
  { icon: PiBellSimpleSlash, label: "Off", type: AlertType.Off },
  { icon: PiBellSimpleRinging, label: "Notification", type: AlertType.Notification },
  { icon: PiVibrate, label: "Vibrate", type: AlertType.Vibrate },
  { icon: PiSpeakerSimpleHigh, label: "Sound", type: AlertType.Sound }
] as const;

interface Props { index: number; isOverlay?: boolean; }

export default function Alert({ index, isOverlay = false }: Props) {
  const isLastThird = index === PRAYERS_ENGLISH.length - 1;
  const { nextIndex } = useAtomValue(scheduleAtom);
  const alertPreferences = useAtomValue(alertPreferencesAtom);

  const overlayVisible = false;

  // const [overlayVisible] = useAtom(Store.app.isOverlayOn);
  // const [preferences, setPreferences] = useAtom(Store.preferences);

  const [iconIndex, setIconIndex] = useState(0);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isPassed = index < nextIndex
  const isNext = index === nextIndex;

  const fadeAnim = useSharedValue(0);
  const bounceAnim = useSharedValue(0);
  const pressAnim = useSharedValue(1);

  const baseOpacity = isPassed || isNext || isLastThird ? 1 : TEXT.opacity;
  const textOpacity = useSharedValue(isPopupActive ? 1 : baseOpacity);


  useEffect(() => {
    if (isPopupActive) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.duration });
    } else if (!isPassed) {
      textOpacity.value = withTiming(baseOpacity, { duration: ANIMATION.duration });
    }
  }, [isPopupActive]);

  useEffect(() => {
    if (index === nextIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else if (!isPassed) {
      textOpacity.value = baseOpacity;
    }
  }, [nextIndex]);

  useEffect(() => {
    if (isOverlay && !overlayVisible) {
      setIsPopupActive(false);
      fadeAnim.value = 0;
      bounceAnim.value = 0;
      timeoutRef.current && clearTimeout(timeoutRef.current);
    }
  }, [overlayVisible]);

  // Use stored preference or default to 0 (Off)
  useEffect(() => {
    setIconIndex(alertPreferences[index] || 0);
  }, [alertPreferences, index]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);
    setAlertPreference(index, ALERT_CONFIGS[nextIndex].type);

    timeoutRef.current && clearTimeout(timeoutRef.current);

    bounceAnim.value = 0;
    fadeAnim.value = withTiming(1, TIMING_CONFIG);
    bounceAnim.value = withSpring(1, SPRING_CONFIG);

    setIsPopupActive(true);
    const removeAfter = 1500;

    timeoutRef.current = setTimeout(() => {
      fadeAnim.value = withTiming(0, TIMING_CONFIG);
      bounceAnim.value = withSpring(0, SPRING_CONFIG);
      setIsPopupActive(false);
    }, removeAfter);
  }, [iconIndex, index]);

  const alertAnimatedStyle = useAnimatedStyle(() => {
    if (isOverlay) return {
      color: 'white',
      opacity: 1,
      transform: [{ scale: pressAnim.value }]
    };

    return {
      opacity: textOpacity.value,
      transform: [{ scale: pressAnim.value }]
    };
  });

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      scale: interpolate(bounceAnim.value, [0, 1], [0.95, 1])
    }]
  }));

  useEffect(() => () => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    fadeAnim.value = 0;
    bounceAnim.value = 0;
  }, []);

  const { icon: IconComponent } = ALERT_CONFIGS[iconIndex];
  let iconColor = isOverlay ? 'white'
    : (isPopupActive || isPassed || isNext || isLastThird ? COLORS.textPrimary : COLORS.textTransparent);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => pressAnim.value = withSpring(0.9, SPRING_CONFIG)}
        onPressOut={() => pressAnim.value = withSpring(1, SPRING_CONFIG)}
        style={styles.iconContainer}
      >
        <Animated.View style={alertAnimatedStyle}>
          <IconComponent color={iconColor} size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, popupAnimatedStyle, isOverlay && !isNext && styles.popupOverlay]}>
        <IconComponent color={(isOverlay && !isNext) ? 'white' : COLORS.textPrimary} size={20} style={styles.popupIcon} />
        <Text style={[styles.label, isOverlay && !isNext && styles.labelOverlay]}>{ALERT_CONFIGS[iconIndex].label}</Text>
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
    right: '100%',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'black',
    ...PRAYER.shadow
  },
  popupOverlay: {
    backgroundColor: COLORS.active,
    shadowColor: COLORS.activeShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  labelOverlay: {
    color: 'white',
  },
});
