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

import { COLORS, TEXT, ANIMATION } from '@/shared/constants';
import { ScheduleType, AlertType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';

const SPRING_CONFIG = { damping: 12, stiffness: 500, mass: 0.5 };
const TIMING_CONFIG = { duration: 5 };

const ALERT_CONFIGS = [
  { icon: PiBellSimpleSlash, label: "Off", type: AlertType.Off },
  { icon: PiBellSimpleRinging, label: "Notification", type: AlertType.Notification },
  { icon: PiVibrate, label: "Vibrate", type: AlertType.Vibrate },
  { icon: PiSpeakerSimpleHigh, label: "Sound", type: AlertType.Sound }
] as const;

interface Props {
  index: number;
  type: ScheduleType;
  isOverlay?: boolean;
}

export default function Alert({ index, type, isOverlay = false }: Props) {
  const { today, nextIndex } = useAtomValue(type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom);

  const overlayVisible = false;

  // const { today, nextIndex } = useSchedule(type);

  // const [overlayVisible] = useAtom(Store.app.isOverlayOn);
  // const [preferences, setPreferences] = useAtom(Store.preferences);

  const [iconIndex, setIconIndex] = useState(0);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isNext = index === nextIndex;
  const { passed: isPassed } = today[index];

  const fadeAnim = useSharedValue(0);
  const bounceAnim = useSharedValue(0);
  const pressAnim = useSharedValue(1);

  const baseOpacity = isPassed || isNext ? 1 : TEXT.opacity;
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
  // useEffect(() => {
  //   setIconIndex(preferences.alert[index] || 0);
  // }, [preferences.alert, index]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextIndex = (iconIndex + 1) % ALERT_CONFIGS.length;
    setIconIndex(nextIndex);

    // setPreferences(prev => ({
    //   ...prev,
    //   alert: {
    //     ...prev.alert,
    //     [index]: ALERT_CONFIGS[nextIndex].type
    //   }
    // }));

    timeoutRef.current && clearTimeout(timeoutRef.current);

    bounceAnim.value = 0;
    fadeAnim.value = withTiming(1, TIMING_CONFIG);
    bounceAnim.value = withSpring(1, SPRING_CONFIG);

    setIsPopupActive(true);
    timeoutRef.current = setTimeout(() => {
      fadeAnim.value = withTiming(0, TIMING_CONFIG);
      bounceAnim.value = withSpring(0, SPRING_CONFIG);
      setIsPopupActive(false);
    }, 2000);
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
  const iconColor = isOverlay ? 'white'
    : (isPopupActive || isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent);

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
    alignItems: 'center',
    marginRight: 5,
  },
  iconContainer: {
    paddingVertical: 20,
    paddingRight: 20,
    paddingLeft: 13,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    backgroundColor: 'black',
  },
  popupOverlay: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow,
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
