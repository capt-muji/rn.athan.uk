import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { StyleSheet, Pressable, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import Countdown from '@/components/Countdown';
import Glow from '@/components/Glow';
import Prayer from '@/components/Prayer';
import { OVERLAY, ANIMATION, STYLES, COLORS, TEXT } from '@/shared/constants';
import { toggleOverlay } from '@/stores/actions';
import { overlayAtom, measurementsAtom } from '@/stores/store';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);
const AnimatedCanvas = Reanimated.createAnimatedComponent(Canvas);

export default function Overlay() {
  const { width, height } = useWindowDimensions();
  const overlay = useAtomValue(overlayAtom);
  const measurements = useAtomValue(measurementsAtom);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleOverlay();
  };

  const backgroundOpacityShared = useSharedValue(0);
  const dateOpacityShared = useSharedValue(0);

  if (overlay.isOn) {
    backgroundOpacityShared.value = withTiming(1, { duration: ANIMATION.duration });
    dateOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
  } else {
    backgroundOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
    dateOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
  }

  const containerStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    opacity: backgroundOpacityShared.value,
    pointerEvents: overlay.isOn ? 'auto' : 'none',
  }));

  const dateStyle = useAnimatedStyle(() => ({
    opacity: dateOpacityShared.value,
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
  }));

  return (
    <Reanimated.View style={containerStyle}>
      <AnimatedBlur intensity={15} style={StyleSheet.absoluteFill}>
        <AnimatedCanvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={['rgba(25,0,40,0.97)', 'rgba(8,0,12,0.94)', 'rgba(2,0,4,0.95)']}
            />
          </Rect>
        </AnimatedCanvas>

        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Countdown - using fixed positioning */}
        {overlay.isOn && (
          <View style={styles.countdownContainer}>
            <Countdown type={overlay.scheduleType} />
          </View>
        )}

        {/* Date */}
        {overlay.isOn && measurements?.date && (
          <Reanimated.Text
            style={[
              dateStyle,
              {
                position: 'absolute',
                top: measurements.date.pageY,
                left: measurements.date.pageX,
                width: measurements.date.width,
                height: measurements.date.height,
              },
            ]}
          >
            {overlay.selectedPrayerIndex >= 5 ? 'Tomorrow' : 'Today'}
          </Reanimated.Text>
        )}

        {/* Prayer overlay */}
        {overlay.isOn && measurements?.list && (
          <View
            style={{
              position: 'absolute',
              top: measurements.list.pageY + overlay.selectedPrayerIndex * STYLES.prayer.height,
              left: measurements.list.pageX,
              width: measurements.list.width,
              height: STYLES.prayer.height,
            }}
          >
            <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} />
          </View>
        )}
      </AnimatedBlur>
      <Glow />
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  countdownContainer: {
    position: 'absolute',
    top: 120, // Match the top margin/padding from your layout
    left: 0,
    right: 0,
  },
});
