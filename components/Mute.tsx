import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationScale } from '@/hooks/useAnimation';
import { TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  type: ScheduleType;
}

export default function Mute({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  const [isMuted, setIsMuted] = useState(false);
  const AnimScale = useAnimationScale(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMuted((prev) => !prev);
  };

  const computedStylesContainer: ViewStyle = isStandard
    ? {
        backgroundColor: isMuted ? '#8459e747' : '#6941c649',
        borderColor: isMuted ? '#6d39e775' : '#5b33b875',
      }
    : {
        backgroundColor: isMuted ? '#493faf46' : '#2f278447',
        borderColor: isMuted ? '#3d349c46' : '#2c247b46',
      };

  const computedStylesText: TextStyle = isStandard
    ? {
        color: isMuted ? '#f1ebffd9' : '#bb9ffdd9',
      }
    : {
        color: isMuted ? '#bdb6ffd9' : '#7572d3d9',
      };

  return (
    <AnimatedPressable
      style={[styles.container, computedStylesContainer, AnimScale.style]}
      onPress={handlePress}
      onPressIn={() => AnimScale.animate(0.9)}
      onPressOut={() => AnimScale.animate(1)}>
      <Text style={[styles.text, computedStylesText]}>{isMuted ? 'Unmute all' : 'Mute all'}</Text>
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
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowColor: '#281160',
    width: 100,
    alignItems: 'center',
  },
  text: {
    color: '#bb9ffdd9',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmaller,
  },
});
