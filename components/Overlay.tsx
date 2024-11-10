import { StyleSheet, Pressable, View, Dimensions } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  overlayVisibleToggleAtom,
  overlayContentAtom,
  selectedPrayerIndexAtom,
  overlayStartOpeningAtom,
  overlayStartClosingAtom,
  overlayAnimationCompleteAtom
} from '@/store/store';
import { useEffect, useCallback, useLayoutEffect, useState } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  useAnimatedStyle,
  runOnJS
} from 'react-native-reanimated';
import RadialGlow from './RadialGlow';
import { ANIMATION } from '@/constants';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [overlayVisibleToggle, setOverlayVisibleToggle] = useAtom(overlayVisibleToggleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setOverlayStartOpening] = useAtom(overlayStartOpeningAtom);
  const [, setOverlayStartClosing] = useAtom(overlayStartClosingAtom);
  const [, setOverlayAnimationComplete] = useAtom(overlayAnimationCompleteAtom);

  const intensity = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  // when overlayVisibleToggle opens
  useEffect(() => {
    if (overlayVisibleToggle) {
      opacity.value = withTiming(1, { duration: ANIMATION.duration });
      intensity.value = withTiming(10, { duration: ANIMATION.duration });
    }
  }, [overlayVisibleToggle]);

  const cleanupOverlay = () => {
    setOverlayContent([]);
    setOverlayVisibleToggle(false);
  };

  const handleClose = () => {
    setOverlayStartClosing(true);
    setOverlayAnimationComplete(false);

    // Start closing animations
    opacity.value = withTiming(0,
      { duration: ANIMATION.duration },
      (finished) => {
        if (finished) {
          runOnJS(setOverlayStartClosing)(false);
          runOnJS(setOverlayAnimationComplete)(true);
          runOnJS(cleanupOverlay)();
        }
      }
    );

    intensity.value = withTiming(0,
      { duration: ANIMATION.duration }
    );
  };

  if (!overlayVisibleToggle) return null;

  return (
    <Portal>
      <Reanimated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
        <AnimatedBlur animatedProps={animatedProps} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(25,0,40,1)', 'rgba(8,0,12,0.9)', 'rgba(0,0,0,1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <RadialGlow
            size={Dimensions.get('window').height / 3}
            style={styles.radialGradient}
          />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
            {content.map(({ name, component, measurements }) => (
              <View
                key={name}
                style={{
                  position: 'absolute',
                  top: measurements.pageY,
                  left: measurements.pageX,
                  width: measurements.width,
                  height: measurements.height,
                }}
              >
                {component}
              </View>
            ))}
          </Pressable>
        </AnimatedBlur>
      </Reanimated.View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  radialGradient: {
    position: 'absolute',
    top: -Dimensions.get('window').height / 2,
    left: -Dimensions.get('window').height / 10,
    width: Dimensions.get('window').height / 1,
    height: Dimensions.get('window').height / 1,
  },
});