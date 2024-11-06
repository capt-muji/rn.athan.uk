import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ANIMATION } from '@/constants/animations';

import { COLORS, TEXT } from '@/constants';
import { todaysPrayersAtom, nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom } from '@/store/store';

interface Props {
  index: number;
}

export default function Alert({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [selectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);
  const [iconIndex, setIconIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const animatedStyle = useAnimatedStyle(() => {
    const baseOpacity = isPassed || isNext ? 1 : 0.5;
    return {
      opacity: withTiming(
        isOverlay && selectedPrayerIndex !== index ? 0 : baseOpacity,
        { duration: ANIMATION.duration }
      ),
    };
  });

  const alertConfigs = useMemo(() => [
    { icon: PiBellSimpleSlash, label: "Off" },
    { icon: PiBellSimpleRinging, label: "Notification" },
    { icon: PiVibrate, label: "Vibrate" },
    { icon: PiSpeakerSimpleHigh, label: "Sound" }
  ], []);

  const handlePress = useCallback(() => {
    setIsActive(true);
    setIconIndex(prev => (prev + 1) % alertConfigs.length);
    setTimeout(() => setIsActive(false), 1500);
    setIsOverlay(false);
    setSelectedPrayerIndex(null);
  }, [alertConfigs.length]);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

  return (
    <>
      <View style={styles.container}>
        <Pressable onPress={handlePress} style={styles.iconContainer}>
          <Animated.View style={animatedStyle}>
            <IconComponent color="white" size={20} />
          </Animated.View>
        </Pressable>
        {isActive && (
          <View style={styles.popup}>
            <IconComponent color="white" size={20} style={styles.popupIcon} />
            <Text style={styles.label}>{currentConfig.label}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    paddingHorizontal: 23,
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
    backgroundColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  }
});
