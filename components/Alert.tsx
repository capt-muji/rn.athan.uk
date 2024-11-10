import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming
} from 'react-native-reanimated';

import { COLORS, TEXT, ANIMATION } from '@/constants';
import { todaysPrayersAtom, nextPrayerIndexAtom, overlayVisibleToggleAtom } from '@/store/store';

const SPRING_CONFIG = {
  damping: 12,
  stiffness: 500,
  mass: 0.5
};

interface Props {
  index: number;
  isOverlay?: boolean;
}

export default function Alert({ index, isOverlay = false }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [iconIndex, setIconIndex] = useState(0);
  const [isPopupActive, setIsPopupActive] = useState(false);

  const fadeAnim = useSharedValue(0);
  const bounceAnim = useSharedValue(0);
  const pressAnim = useSharedValue(1);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const alertConfigs = useMemo(() => [
    { icon: PiBellSimpleSlash, label: "Off" },
    { icon: PiBellSimpleRinging, label: "Notification" },
    { icon: PiVibrate, label: "Vibrate" },
    { icon: PiSpeakerSimpleHigh, label: "Sound" }
  ], []);

  const handlePress = useCallback((e) => {
    if (!isOverlay) e?.stopPropagation();
    setIsPopupActive(true);
    timeoutRef.current && clearTimeout(timeoutRef.current);

    setIconIndex(prev => (prev + 1) % alertConfigs.length);

    // Animation sequence
    bounceAnim.value = 0;
    fadeAnim.value = withSpring(1, SPRING_CONFIG);
    bounceAnim.value = withSpring(1, SPRING_CONFIG);

    timeoutRef.current = setTimeout(() => {
      fadeAnim.value = withSpring(0, { duration: 1 });
      bounceAnim.value = withSpring(0);
      setIsPopupActive(false);
    }, 2000);
  }, [isOverlay, alertConfigs.length]);

  const alertAnimatedStyle = useAnimatedStyle(() => ({
    opacity: !isOverlay
      ? (isPopupActive || isPassed || isNext ? 1 : TEXT.transparent)
      : withTiming(overlayVisibleToggle ? 1 : 0, { duration: ANIMATION.duration }),
    transform: [{ scale: pressAnim.value }]
  }));

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      scale: interpolate(bounceAnim.value, [0, 1], [0.95, 1])
    }]
  }));

  useEffect(() => {
    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
      fadeAnim.value = 0;
      bounceAnim.value = 0;
    };
  }, []);

  const { icon: IconComponent } = alertConfigs[iconIndex];

  const iconColor = isOverlay
    ? 'white'
    : isPopupActive || isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => { pressAnim.value = withSpring(0.9, SPRING_CONFIG); }}
        onPressOut={() => { pressAnim.value = withSpring(1, SPRING_CONFIG); }}
        style={styles.iconContainer}
      >
        <Animated.View style={alertAnimatedStyle}>
          <IconComponent color={iconColor} size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, popupAnimatedStyle]}>
        <IconComponent color={COLORS.textPrimary} size={20} style={styles.popupIcon} />
        <Text style={styles.label}>{alertConfigs[iconIndex].label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: 'black',
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
});
