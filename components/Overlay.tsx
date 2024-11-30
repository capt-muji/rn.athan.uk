import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { StyleSheet, Pressable, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import Prayer from '@/components/Prayer';
import { OVERLAY, ANIMATION, STYLES } from '@/shared/constants';
import { toggleOverlay } from '@/stores/actions';
import { overlayAtom, measurementsAtom } from '@/stores/store';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);
const AnimatedCanvas = Reanimated.createAnimatedComponent(Canvas);

export default function Overlay() {
  const { width, height } = useWindowDimensions();
  const overlay = useAtomValue(overlayAtom);
  const { list: measurements } = useAtomValue(measurementsAtom);

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

  return (
    <>
      <Reanimated.View style={containerStyle}>
        <AnimatedBlur intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <AnimatedCanvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={width} height={height}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={['rgba(25,0,40,0.5)', 'rgba(8,0,12,0.9)', 'rgba(2,0,4,0.95)']}
              />
            </Rect>
          </AnimatedCanvas>

          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          {overlay.isOn && overlay.selectedPrayerIndex >= 0 && measurements && (
            <View
              style={{
                position: 'absolute',
                top: measurements.pageY + overlay.selectedPrayerIndex * STYLES.prayer.height,
                left: measurements.pageX,
                width: measurements.width,
                height: STYLES.prayer.height,
                zIndex: OVERLAY.zindexes.on.prayerSelected,
              }}
            >
              <Prayer index={overlay.selectedPrayerIndex} type={overlay.scheduleType} />
            </View>
          )}
        </AnimatedBlur>
      </Reanimated.View>
    </>
  );
}
