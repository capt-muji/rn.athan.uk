import React from 'react';
import { StyleSheet, Pressable, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';
// import * as Haptics from 'expo-haptics';

import { todaysPrayersAtom } from '@/store';
import Alert from './Alert';
import { COLORS, TEXT, SCREEN } from '../constants';
import { overlayVisibleAtom, overlayAnimationAtom } from '../store';

interface Props { index: number }

export default function Prayer({ index }: Props) {
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);

  const toggleOverlay = () => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (overlayVisible === index) {
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true
      }).start(() => {
        setOverlayVisible(-1);
      });
    } else {
      setOverlayVisible(index);
    }
  };

  const prayer = todaysPrayers[index];

  return (
    <Pressable style={[styles.container, { zIndex: overlayVisible > -1 && overlayVisible === index && 1 }]} onPress={toggleOverlay}>
      <Text style={[styles.text, styles.english]}>{prayer.english}</Text>
      <Text style={[styles.text, styles.arabic]}>{prayer.arabic}</Text>
      <Text style={[styles.text, styles.time]}>{prayer.time}</Text>
      <Alert />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 15,
    opacity: 0.5,
    paddingRight: 10,
    paddingLeft: 20,
    alignItems: 'center',
    marginHorizontal: SCREEN.paddingHorizontal
  },
  passed: {
    opacity: 1,
  },
  next: {
    opacity: 1,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    borderRadius: 5,
  },
  text: {
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
    marginRight: 15,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
  time: {
    flex: 2,
    textAlign: 'center',
  },
});
