import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';

import { COLORS, TEXT } from '@/constants';
import { todaysPrayersAtom, nextPrayerIndexAtom, overlayAtom, selectedPrayerIndexAtom } from '@/store/store';

interface Props {
  index: number;
}

export default function Alert({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [iconIndex, setIconIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const opacity = isPassed || isNext ? 1 : 0.5;

  const alertConfigs = useMemo(() => [
    { icon: PiBellSimpleSlash, label: "Off" },
    { icon: PiBellSimpleRinging, label: "Notification" },
    { icon: PiVibrate, label: "Vibrate" },
    { icon: PiSpeakerSimpleHigh, label: "Sound" }
  ], []);

  const handlePress = useCallback((e) => {
    e.stopPropagation(); // Stop event from bubbling to Prayer
    setIsActive(true);
    setIconIndex(prev => (prev + 1) % alertConfigs.length);
    setTimeout(() => setIsActive(false), 1500);
    setIsOverlay(false);
    setSelectedPrayerIndex(null);
  }, [alertConfigs.length]);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

  return (
    <View style={[styles.container, { opacity: isActive ? 1 : opacity }]}>
      <Pressable onPress={handlePress} style={styles.iconContainer}>
        <IconComponent color="white" size={20} />
      </Pressable>
      {isActive && (
        <View style={styles.popup}>
          <IconComponent color="white" size={20} style={styles.popupIcon} />
          <Text style={styles.label}>{currentConfig.label}</Text>
        </View>
      )}
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
