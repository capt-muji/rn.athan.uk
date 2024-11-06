import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View, Animated } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';

import { COLORS, TEXT } from '@/constants';
import { todaysPrayersAtom, nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom, selectedPrayerDateAtom } from '@/store/store';

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
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
    e?.stopPropagation();

    setIsOverlay(false);
    setSelectedPrayerIndex(null);
    setSelectedDate('today');
    setIsActive(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIconIndex(prev => (prev + 1) % alertConfigs.length);

    fadeAnim.setValue(1);
    bounceAnim.setValue(0);

    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true
      })
    ]).start();

    timeoutRef.current = setTimeout(() => {
      fadeAnim.setValue(0);
      setIsActive(false);
    }, 1500);
  }, [alertConfigs.length]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

  const animatedStyle = useCallback(() => {
    const baseOpacity = isPassed || isNext ? 1 : 0.5;
    return {
      opacity: isOverlay && selectedPrayerIndex !== index ? 0 : baseOpacity
    };
  }, [isPassed, isNext, isOverlay, selectedPrayerIndex, index]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={styles.iconContainer}
        pointerEvents={isOverlay && selectedPrayerIndex !== index ? 'none' : 'auto'}
      >
        <IconComponent color="white" size={20} style={animatedStyle()} />
      </Pressable>

      <Animated.View
        style={[
          styles.popup,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                })
              },
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }
            ]
          }
        ]}
      >
        <IconComponent
          color="white"
          size={20}
          style={styles.popupIcon}
        />
        <Text style={styles.label}>
          {currentConfig.label}
        </Text>
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
