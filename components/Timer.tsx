import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { nextPrayerIndexAtom, absoluteTimerMeasurementsAtom, overlayVisibleAtom, overlayContentAtom, PageCoordinates } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

interface TimerProps {
  isOverlay?: boolean;
}

export default function Timer({ isOverlay = false }: TimerProps) {
  const { nextPrayer } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [_, setTimerMeasurements] = useAtom(absoluteTimerMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [__, setOverlayContent] = useAtom(overlayContentAtom);
  const timerRef = useRef<View>(null);
  const measurementsRef = useRef<PageCoordinates | null>(null);

  const handleLayout = () => {
    if (isOverlay || !timerRef.current) return;

    timerRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      measurementsRef.current = measurements;
      setTimerMeasurements(measurements);
    });
  };

  useEffect(() => {
    if (overlayVisible) {
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
  }, [overlayVisible]);

  const timerComponent = (
    <View ref={timerRef} onLayout={handleLayout} style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}> {nextPrayer.timerName} </Text>
      ) : (
        <>
          <Text style={styles.text}> {`${nextPrayer.timerName || '...'} in`} </Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}> {nextPrayer.timeDisplay} </Text>
          </View>
        </>
      )}
    </View>
  );

  return timerComponent;
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
