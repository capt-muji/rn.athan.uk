import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { nextPrayerIndexAtom, overlayAtom, overlayDateColorAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';
import { ANIMATION } from '@/constants/animations';

export default function Timer() {
  const { timerName, timeDisplay } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(isOverlay ? 1.5 : 1, { duration: ANIMATION.duration }) },
      { translateY: withTiming(isOverlay ? 5 : 0, { duration: ANIMATION.duration }) }
    ],
    fontFamily: isOverlay ? TEXT.famiy.medium : TEXT.famiy.regular
  }));

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}>
          {timerName}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            {`${timerName || '...'} in`}
          </Text>
          {timeDisplay && (
            <Animated.Text style={[styles.timer, animatedStyle]}>
              {timeDisplay}
            </Animated.Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginTop: SCREEN.paddingHorizontal,
    marginBottom: 35,
    zIndex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
  },
  timer: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 5,
    textAlign: 'center',
  }
});
