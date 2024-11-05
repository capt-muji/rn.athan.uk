import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { overlayVisibleAtom, overlayAnimationAtom, nextPrayerIndexAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

export default function Timer() {
  const { timerName, timeDisplay } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);

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
            <Animated.Text
              style={[
                styles.timer,
                {
                  fontFamily: overlayVisible !== -1 ? TEXT.famiy.medium : TEXT.famiy.regular,
                  transform: [
                    {
                      scale: overlayAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5]
                      })
                    },
                    {
                      translateY: overlayAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 6]
                      })
                    }
                  ]
                }
              ]}
            >
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
    color: COLORS.textPrimary,
    opacity: 0.5,
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
