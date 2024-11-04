import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View, Animated } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";

import { COLORS, TEXT } from '@/constants';
// import * as Haptics from 'expo-haptics';

interface Props {
  opacity: number;
}

export default function Alert({ opacity }: Props) {
  const [iconIndex, setIconIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const opacityTimeoutRef = useRef<NodeJS.Timeout>();

  const alertConfigs = useMemo(() => [
    { icon: PiBellSimpleSlash, label: "Off" },
    { icon: PiBellSimpleRinging, label: "Notification" },
    { icon: PiVibrate, label: "Vibrate" },
    { icon: PiSpeakerSimpleHigh, label: "Sound" }
  ], []);

  const handlePress = useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
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
      setIsActive(false); // Reset opacity immediately when popup fades
    }, 1500);
  }, [alertConfigs.length]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (opacityTimeoutRef.current) clearTimeout(opacityTimeoutRef.current);
    };
  }, []);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

  const opacityStyle = {
    opacity: isActive ? 1 : opacity
  };

  return (
    <View style={[styles.container, opacityStyle]}>
      <Pressable onPress={handlePress} style={styles.iconContainer}>
        <IconComponent color="white" size={20} />
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
        <IconComponent color="white" size={20} style={styles.popupIcon} />
        <Text style={styles.label}>{currentConfig.label}</Text>
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
    // backgroundColor: COLORS.primary,
  },
  popup: {
    position: 'absolute',
    right: '100%',
    backgroundColor: 'black',
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
  },
  popupIcon: {
    marginRight: 15
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});
