import * as Haptics from 'expo-haptics';
import { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationScale } from '@/hooks/useAnimation';
import { useNotification } from '@/hooks/useNotification';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setScheduleMutedState } from '@/stores/notifications';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  type: ScheduleType;
}

export default function Mute({ type }: Props) {
  const { isStandard, isMuted } = useSchedule(type);
  const { handleMuteChange } = useNotification();
  const AnimScale = useAnimationScale(1);
  const debouncedMuteRef = useRef<NodeJS.Timeout>();

  // Clear up
  useEffect(() => {
    return () => {
      if (debouncedMuteRef.current) clearTimeout(debouncedMuteRef.current);
    };
  }, []);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMutedState = !isMuted;

    // Update UI immediately
    setScheduleMutedState(type, newMutedState);

    // Debounce the state change
    if (debouncedMuteRef.current) clearTimeout(debouncedMuteRef.current);

    debouncedMuteRef.current = setTimeout(async () => {
      await handleMuteChange(type, newMutedState);
    }, ANIMATION.debounce);
  };

  const computedStylesContainer: ViewStyle = isStandard
    ? {
        backgroundColor: isMuted ? '#8459e747' : '#6941c649',
        borderColor: isMuted ? '#6d46c775' : '#5b33b875',
        shadowColor: '#27035c',
      }
    : {
        backgroundColor: isMuted ? '#493faf46' : '#2f278447',
        borderColor: isMuted ? '#3d349c46' : '#2c247b46',
        shadowColor: '#020008',
      };

  const computedStylesText: TextStyle = isStandard
    ? { color: isMuted ? '#f1ebffd9' : '#bb9ffdd9' }
    : { color: isMuted ? '#bdb6ffd9' : '#7e7cbed9' };

  return (
    <AnimatedPressable
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <Text style={[styles.text, computedStylesText]}>{isMuted ? 'Enable all' : 'Disable all'}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 35,
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 50,
    alignSelf: 'center',
    borderWidth: 1,
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    width: 100,
    alignItems: 'center',
  },
  text: {
    color: '#bb9ffdd9',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmaller,
  },
});
