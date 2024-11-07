import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { overlayAtom } from '@/store/store';
import { ANIMATION } from '@/constants/animations';

import { COLORS } from '@/constants';

export default function Footer() {
  const [isOverlay] = useAtom(overlayAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlay ? 0 : 0.1, { duration: ANIMATION.duration }),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>East London Mosque</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    opacity: 0.10,
    alignSelf: 'center',
  },
  text: {
    color: COLORS.textPrimary,
  }
});
