import * as Haptics from 'expo-haptics';
import { useRef, useEffect } from 'react';
import { Pressable, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationScale } from '@/hooks/useAnimation';
import { useNotification } from '@/hooks/useNotification';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setTempMutedState } from '@/stores/ui';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  type: ScheduleType;
}

export default function Mute({ type }: Props) {
  const { isStandard, persistedMuted, currentMuted } = useSchedule(type);
  const { handleMuteChange } = useNotification();
  const AnimScale = useAnimationScale(1);

  const debouncedMuteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debouncedMuteRef.current) clearTimeout(debouncedMuteRef.current);
    };
  }, []);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMutedState = !currentMuted;

    setTempMutedState(type, newMutedState);

    if (debouncedMuteRef.current) clearTimeout(debouncedMuteRef.current);

    debouncedMuteRef.current = setTimeout(async () => {
      await handleMuteChange(type, newMutedState); // Persist the new muted state

      setTempMutedState(type, null);
    }, ANIMATION.debounce);
  };

  const computedStylesContainer: ViewStyle = isStandard
    ? {
        backgroundColor: currentMuted ? '#8459e747' : '#6941c649',
        borderColor: persistedMuted ? '#6d46c775' : '#5b33b875',
        shadowColor: '#27035c',
      }
    : {
        backgroundColor: currentMuted ? '#493faf46' : '#2f278447',
        borderColor: persistedMuted ? '#3d349c46' : '#2c247b46',
        shadowColor: '#020008',
      };

  const computedStylesText: TextStyle = isStandard
    ? { color: currentMuted ? '#f1ebffd9' : '#bb9ffdd9' }
    : { color: currentMuted ? '#bdb6ffd9' : '#7e7cbed9' };

  return (
    <AnimatedPressable
      hitSlop={15}
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <Text style={[styles.text, computedStylesText]}>{currentMuted ? 'Enable all' : 'Disable all'}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 50,
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
