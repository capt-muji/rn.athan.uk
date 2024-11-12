import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import { absoluteDateMeasurementsAtom, overlayStartOpeningAtom, overlayStartClosingAtom, overlayVisibleToggleAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT, ANIMATION, OVERLAY } from '@/constants';
import Masjid from './Masjid';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';

export default function DateDisplay() {
  const [, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [overlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [overlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const dateRef = useRef<Text>(null);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const originalOpacity = useSharedValue(1);

  const todaysStyle = useAnimatedStyle(() => ({
    opacity: originalOpacity.value
  }));

  useEffect(() => {
    if (overlayStartOpening && overlayVisibleToggle) {
      originalOpacity.value = withTiming(0, { duration: ANIMATION.duration });
    }
  }, [overlayStartOpening]);

  useEffect(() => {
    if (overlayStartClosing) {
      originalOpacity.value = withDelay(250, withTiming(1, { duration: ANIMATION.duration }));
    }
  }, [overlayStartClosing]);

  const handleLayout = () => {
    if (!dateRef.current) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      setDateMeasurements({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text
          ref={dateRef}
          onLayout={handleLayout}
          style={[styles.date, todaysStyle]}
        >
          {formattedDate}
        </Animated.Text>
      </View>
      <Masjid />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN.paddingHorizontal,
    zIndex: OVERLAY.zindexes.off.longDate,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size - 2,
    fontFamily: TEXT.famiy.regular,
    marginBottom: 5,
    opacity: TEXT.opacity
  },
  date: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
  overlayText: {
    color: COLORS.textSecondary,
  }
});
