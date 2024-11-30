import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, Pressable, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import RadialGlow from '@/components/Glow';
import Prayer from '@/components/Prayer';
import { COLORS, TEXT, OVERLAY, ANIMATION } from '@/shared/constants';
import { overlayAtom } from '@/stores/store';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);
const AnimatedCanvas = Reanimated.createAnimatedComponent(Canvas);

export default function Overlay() {
  const { width, height } = useWindowDimensions();
  const overlay = useAtomValue(overlayAtom);
  const setOverlay = useSetAtom(overlayAtom);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverlay({ isOn: false });
  };

  const glowOpacityShared = useSharedValue(0);
  const backgroundOpacityShared = useSharedValue(0);
  const dateOpacityShared = useSharedValue(0);

  useEffect(() => {
    if (overlay.isOn) {
      backgroundOpacityShared.value = withTiming(1, { duration: ANIMATION.duration });
      glowOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
      dateOpacityShared.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
    } else {
      backgroundOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      glowOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
      dateOpacityShared.value = withTiming(0, { duration: ANIMATION.duration });
    }
  }, [overlay.isOn]);

  const glowAnimateStyle = useAnimatedStyle(() => ({
    opacity: glowOpacityShared.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.overlay,
    opacity: backgroundOpacityShared.value,
    pointerEvents: overlay.isOn ? 'auto' : 'none',
  }));

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacityShared.value,
  }));

  const prayer = todaysPrayers[selectedPrayerIndex];

  return (
    <>
      <Reanimated.View style={containerStyle}>
        <AnimatedBlur intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
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

          {/* Content layer */}
          {dateMeasurements && (
            <Reanimated.Text
              style={[
                styles.date,
                dateAnimatedStyle,
                {
                  position: 'absolute',
                  top: dateMeasurements.pageY,
                  left: dateMeasurements.pageX,
                  width: dateMeasurements.width,
                  height: dateMeasurements.height,
                },
              ]}
            >
              {prayer?.passed ? 'Tomorrow' : 'Today'}
            </Reanimated.Text>
          )}

          {prayerMeasurements[selectedPrayerIndex] && (
            <View
              style={{
                position: 'absolute',
                top: prayerMeasurements[selectedPrayerIndex]?.pageY,
                left: prayerMeasurements[selectedPrayerIndex]?.pageX,
                width: prayerMeasurements[selectedPrayerIndex]?.width,
                height: prayerMeasurements[selectedPrayerIndex]?.height,
                zIndex: OVERLAY.zindexes.on.prayerSelected,
              }}
            >
              <Prayer index={selectedPrayerIndex} isOverlay />
            </View>
          )}
        </AnimatedBlur>
      </Reanimated.View>
      <Reanimated.View style={[glowAnimateStyle, { pointerEvents: 'none' }]}>
        <RadialGlow baseOpacity={0.5} visible={overlay.isOn} />
      </Reanimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  date: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
    pointerEvents: 'none',
  },
});
