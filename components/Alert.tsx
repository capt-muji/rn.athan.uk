import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { StyleSheet, Pressable, Text, View, GestureResponderEvent } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, TEXT, ANIMATION, PRAYER, PRAYER_INDEX_LAST_THIRD } from '@/shared/constants';
import { AlertType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { scheduleAtom, alertPreferencesAtom } from '@/stores/store';
import { setAlertPreference } from '@/stores/actions';

const SPRING_CONFIG = { damping: 12, stiffness: 500, mass: 0.5 };
const TIMING_CONFIG = { duration: 5 };

const WrappedBellSlash = forwardRef((props, ref) => <PiBellSimpleSlash {...props} ref={ref} />);
const WrappedBellRinging = forwardRef((props, ref) => <PiBellSimpleRinging {...props} ref={ref} />);
const WrappedVibrate = forwardRef((props, ref) => <PiVibrate {...props} ref={ref} />);
const WrappedSpeaker = forwardRef((props, ref) => <PiSpeakerSimpleHigh {...props} ref={ref} />);

const AnimatedBellSlash = Animated.createAnimatedComponent(WrappedBellSlash);
const AnimatedBellRinging = Animated.createAnimatedComponent(WrappedBellRinging);
const AnimatedVibrate = Animated.createAnimatedComponent(WrappedVibrate);
const AnimatedSpeaker = Animated.createAnimatedComponent(WrappedSpeaker);

const ALERT_CONFIGS = [
  {
    icon: PiBellSimpleSlash,
    animatedIcon: AnimatedBellSlash,
    label: "Off",
    type: AlertType.Off
  },
  {
    icon: PiBellSimpleRinging,
    animatedIcon: AnimatedBellRinging,
    label: "Notification",
    type: AlertType.Notification
  },
  {
    icon: PiVibrate,
    animatedIcon: AnimatedVibrate,
    label: "Vibrate",
    type: AlertType.Vibrate
  },
  {
    icon: PiSpeakerSimpleHigh,
    animatedIcon: AnimatedSpeaker,
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

  const iconAnimatedProps = useAnimatedProps(() => {
    const targetColor = isOverlay
      ? 'green'
      : ((isPassed || isNext || isLastThird) ? 'black' : 'orange');

    return {
      color: withTiming(targetColor, { duration: 2000 })
    };
  }, [isOverlay, isPassed, isNext, isLastThird]);

  const AnimatedIcon = ALERT_CONFIGS[iconIndex].animatedIcon;
  const StaticIcon = ALERT_CONFIGS[iconIndex].icon;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => pressAnim.value = withSpring(0.9, SPRING_CONFIG)}
        onPressOut={() => pressAnim.value = withSpring(1, SPRING_CONFIG)}
        style={styles.iconContainer}
      >
        <Animated.View style={alertAnimatedStyle}>
          <AnimatedIcon animatedProps={iconAnimatedProps} size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, popupAnimatedStyle, isOverlay && !isNext && styles.popupOverlay]}>
        <StaticIcon color={'white'} size={20} style={styles.popupIcon} />
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
