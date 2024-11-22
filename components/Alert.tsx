import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { StyleSheet, Pressable, Text, View, GestureResponderEvent } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
  interpolateColor,
  useAnimatedProps
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg from 'react-native-svg';

import { COLORS, TEXT, ANIMATION, PRAYER, PRAYER_INDEX_LAST_THIRD } from '@/shared/constants';
import { AlertType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { scheduleAtom, alertPreferencesAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';
import { BellSlash, BellRing, Vibrate, Speaker } from '@/icons';

const SPRING_CONFIG = { damping: 12, stiffness: 500, mass: 0.5 };
const TIMING_CONFIG = { duration: 5 };

const ALERT_CONFIGS = [
  {
    icon: Animated.createAnimatedComponent(BellSlash),
    label: "Off",
    type: AlertType.Off
  },
  {
    icon: Animated.createAnimatedComponent(BellRing),
    label: "Notification",
    type: AlertType.Notification
  },
  {
    icon: Animated.createAnimatedComponent(Vibrate),
    label: "Vibrate",
    type: AlertType.Vibrate
  },
  {
    icon: Animated.createAnimatedComponent(Speaker),
    label: "Sound",
    type: AlertType.Sound
  }
] as const;

interface Props { index: number; isOverlay?: boolean; }

export default function Alert({ index, isOverlay = false }: Props) {
  const isLastThird = index === PRAYER_INDEX_LAST_THIRD;
  const { nextIndex } = useAtomValue(scheduleAtom);
  const alertPreferences = useAtomValue(alertPreferencesAtom);

  // const overlayVisible = false;

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

  const defaultColorProgress = isPopupActive || isPassed || isNext ? 1 : 0;
  const colorProgress = useSharedValue(defaultColorProgress);


  useEffect(() => {
    if (isPopupActive === true) {
      colorProgress.value = 1;
      return;
    };

    if (isPopupActive === false) {
      colorProgress.value = 0;
    }
  }, [isPopupActive]);

  useEffect(() => {
    if (index === nextIndex) {
      textOpacity.value = withTiming(1, { duration: ANIMATION.durationSlow });
    } else if (!isPassed) {
      textOpacity.value = baseOpacity;
    }
  }, [nextIndex]);

  // useEffect(() => {
  //   if (isOverlay && !overlayVisible) {
  //     setIsPopupActive(false);
  //     fadeAnim.value = 0;
  //     bounceAnim.value = 0;
  //     timeoutRef.current && clearTimeout(timeoutRef.current);
  //   }
  // }, [overlayVisible]);

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

  const iconAnimatedProps = useAnimatedProps(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['red', 'green']
    )
  }));

  const Icon = ALERT_CONFIGS[iconIndex].icon;
  // const econ = forwardRef(ALERT_CONFIGS[iconIndex].icon);
  // const AnimatedIcon = Animated.createAnimatedComponent(econ);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => pressAnim.value = withSpring(0.9, SPRING_CONFIG)}
        onPressOut={() => pressAnim.value = withSpring(1, SPRING_CONFIG)}
        style={styles.iconContainer}
      >
        <Animated.View style={alertAnimatedStyle}>
          <Icon animatedProps={iconAnimatedProps} color={'orange'} size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, popupAnimatedStyle, isOverlay && !isNext && styles.popupOverlay]}>
        <Icon color={'white'} size={20} />
        <Text style={[styles.label, isOverlay && !isNext && styles.labelOverlay]}>
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
    ...PRAYER.shadow,
  },
  popupOverlay: {
    backgroundColor: COLORS.activeBackground,
    shadowColor: COLORS.activeBackgroundShadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.activePrayer,
  },
  labelOverlay: {
    color: 'white',
  },
});
