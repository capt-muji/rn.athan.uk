import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated, { withSpring } from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { overlayVisibleAtom, overlayContentAtom, overlayAnimatingAtom, overlayClosingAtom, shadowOpacityAtom } from '@/store/store';
import { COLORS } from '@/constants';
import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  runOnJS,
  useAnimatedStyle
} from 'react-native-reanimated';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);
const AnimatedGradient = Reanimated.createAnimatedComponent(LinearGradient);

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setAnimating] = useAtom(overlayAnimatingAtom);
  const [, setClosing] = useAtom(overlayClosingAtom);
  const [, setShadowOpacity] = useAtom(shadowOpacityAtom);

  const intensity = useSharedValue(0);
  const gradientOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.5);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value
  }));

  useEffect(() => {
    if (visible) {
      setAnimating(true);
      setShadowOpacity(0.5);
      intensity.value = withTiming(10, {
        duration: 300
      }, () => {
        runOnJS(setAnimating)(false);
      });
      gradientOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [visible]);

  const handleClose = () => {
    setAnimating(true);
    setClosing(true);
    setShadowOpacity(0);
    shadowOpacity.value = withTiming(0, { duration: 300 });
    intensity.value = withTiming(0, {
      duration: 300
    });
    gradientOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setVisible)(false);
      runOnJS(setOverlayContent)([]);
      runOnJS(setAnimating)(false);
      runOnJS(setClosing)(false);
    });
  };

  // Ensure unique items by name
  const uniqueContent = content.reduce((acc, current) => {
    const exists = acc.find(item => item.name === current.name);
    if (!exists) acc.push(current);
    return acc;
  }, [] as typeof content);

  if (!visible) return null;

  return (
    <Portal>
      <AnimatedBlur animatedProps={animatedProps} tint="light" style={StyleSheet.absoluteFill}>
        <AnimatedGradient
          colors={['rgba(25,0,40,1)', 'rgba(8,0,12,0.9)', 'rgba(0,0,0,1)']}
          style={[StyleSheet.absoluteFill, animatedGradientStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Pressable style={styles.overlay} onPress={handleClose}>
          {uniqueContent.map(({ name, component, measurements }) => (
            <View
              key={name}
              style={[
                styles.content,
                {
                  position: 'absolute',
                  top: measurements.pageY,
                  left: measurements.pageX,
                  width: measurements.width,
                  height: measurements.height,
                }
              ]}
            >
              {component}
            </View>
          ))}
        </Pressable>
      </AnimatedBlur>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  content: {
    zIndex: 1001,
  }
});