import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { nextPrayerIndexAtom, absoluteTimerMeasurementsAtom, overlayVisibleToggleAtom, overlayContentAtom, PageCoordinates } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

interface TimerProps {
  isOverlay?: boolean;
}

export default function Timer({ isOverlay = false }: TimerProps) {
  const { nextPrayer } = useTimer({ isOverlay });
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setTimerMeasurements] = useAtom(absoluteTimerMeasurementsAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
  const timerRef = useRef<View>(null);
  const measurementsRef = useRef<PageCoordinates | null>(null);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ]
  }));

  const handleLayout = () => {
    if (isOverlay || !timerRef.current) return;

    timerRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      measurementsRef.current = measurements;
      setTimerMeasurements(measurements);
    });
  };

  useEffect(() => {
    if (overlayVisibleToggle) {
      setOverlayContent(prev => {
        const exists = prev.some(item => item.name === 'timer');
        if (exists) return prev;

        return [...prev, {
          name: 'timer',
          component: <Timer isOverlay={true} />,
          measurements: measurementsRef.current!
        }];
      });
    }
  }, [overlayVisibleToggle]);

  useEffect(() => {
    if (isOverlay && !overlayVisibleToggle) {
      scale.value = withSpring(1, { mass: 0.5 });
      translateY.value = withSpring(0, { mass: 0.5 });
    } else if (isOverlay) {
      scale.value = withSpring(1.5, { mass: 0.5 });
      translateY.value = withSpring(5, { mass: 0.5 });
    } else {
      scale.value = withSpring(1, { mass: 0.5 });
      translateY.value = withSpring(0, { mass: 0.5 });
    }
  }, [isOverlay, overlayVisibleToggle]);

  return (
    <View
      ref={timerRef}
      onLayout={handleLayout}
      style={[
        styles.container,
        { opacity: isOverlay ? (overlayVisibleToggle ? 1 : 0) : (overlayVisibleToggle ? 0 : 1) }
      ]}
    >
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}> {nextPrayer.timerName} </Text>
      ) : (
        <>
          <Text style={styles.text}> {`${nextPrayer.timerName || '...'} in`} </Text>
          <Animated.View style={[styles.timerContainer, animatedStyle]}>
            <Text style={styles.timer}> {nextPrayer.timeDisplay} </Text>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginBottom: 35,
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
    fontFamily: TEXT.famiy.medium,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 5,
    textAlign: 'center',
  },
  timerContainer: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
