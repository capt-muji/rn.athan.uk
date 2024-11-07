import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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

import { COLORS, TEXT } from '@/constants';
import { todaysPrayersAtom, nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom, selectedPrayerDateAtom, overlayDateColorAtom } from '@/store/store';
import { ANIMATION } from '@/constants/animations';

interface Props {
  index: number;
}

export default function Alert({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);
  const [iconIndex, setIconIndex] = useState(0);
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setSelectedDate] = useAtom(selectedPrayerDateAtom);
  const [isActive, setIsActive] = useState(false);
  const [showPopupContent, setShowPopupContent] = useState(false);
  const [overlayDateColor] = useAtom(overlayDateColorAtom);

  const fadeAnim = useSharedValue(0);
  const bounceAnim = useSharedValue(0);
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

  const handlePress = useCallback((e: GestureResponderEvent) => {
    e?.stopPropagation();

    setIsOverlay(false);
    setSelectedPrayerIndex(null);
    setSelectedDate('today');
    setIsActive(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update content first
    setIconIndex(prev => (prev + 1) % alertConfigs.length);
    setShowPopupContent(true);

    // Then start animations
    bounceAnim.value = 0;
    fadeAnim.value = withSpring(1, {
      damping: 12,
      stiffness: 500,
      mass: 0.5
    });
    bounceAnim.value = withSpring(1, {
      damping: 12,
      stiffness: 500,
      mass: 0.5
    });

    // Set timeout to hide
    timeoutRef.current = setTimeout(() => {
      fadeAnim.value = withSpring(0, { duration: 1 });
      bounceAnim.value = withSpring(0);
      setIsActive(false);
    }, 2000);
  }, [alertConfigs.length]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Reset animations on unmount
      fadeAnim.value = 0;
      bounceAnim.value = 0;
      setIsActive(false);
    };
  }, []);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

  const animatedStyle = useAnimatedStyle(() => {
    const baseOpacity = isActive || isPassed || isNext ? 1 : TEXT.opacity;
    const opacity = isOverlay && selectedPrayerIndex !== index ? 0 : baseOpacity;

    return {
      opacity: withTiming(opacity, { duration: ANIMATION.duration })
    };
  });

  const popupAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{
        scale: interpolate(bounceAnim.value, [0, 1], [0.95, 1])
      }],
      color: withTiming(overlayDateColor, { duration: ANIMATION.duration }),
    };
  });

  const iconColor = isActive
    ? COLORS.textPrimary
    : (isPassed || isNext ? COLORS.textPrimary : COLORS.textSecondary);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={styles.iconContainer}
        pointerEvents={isOverlay && selectedPrayerIndex !== index ? 'none' : 'auto'}
      >
        <Animated.View style={animatedStyle}>
          <IconComponent color={iconColor} size={20} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.popup, popupAnimatedStyle]}>
        {showPopupContent && (
          <>
            <IconComponent
              color={COLORS.textPrimary}
              size={20}
              style={styles.popupIcon}
            />
            <Text style={styles.label}>
              {currentConfig.label}
            </Text>
          </>
        )}
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
