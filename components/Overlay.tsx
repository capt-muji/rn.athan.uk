import { StyleSheet, Pressable, View, Dimensions } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { overlayVisibleAtom, overlayContentAtom, selectedPrayerIndexAtom } from '@/store/store';
import { useEffect, useCallback, useLayoutEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  useAnimatedStyle
} from 'react-native-reanimated';
import RadialGlow from './RadialGlow';
import { ANIMATION } from '@/constants';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  // default values
  const intensity = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  // when overlayVisible opens
  useEffect(() => {
    if (overlayVisible) {
      opacity.value = withTiming(1, { duration: ANIMATION.duration });
      intensity.value = withTiming(10, { duration: ANIMATION.duration });
    }
  }, [overlayVisible]);

  const cleanupOverlay = () => {
    setOverlayContent([]);
    setOverlayVisible(false);
  };

  const handleClose = () => {
    // setSelectedPrayerIndex(1);

    // Start animations
    opacity.value = withTiming(0, { duration: ANIMATION.duration });
    intensity.value = withTiming(0, { duration: ANIMATION.duration });

    // Clean up after animations complete
    setTimeout(() => {
      cleanupOverlay();
    }, ANIMATION.duration);
  };

  if (!overlayVisible) return null;

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