import { StyleSheet, Pressable, View } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { overlayVisibleAtom, overlayContentAtom, overlayAnimatingAtom } from '@/store/store';
import { COLORS } from '@/constants';
import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  runOnJS
} from 'react-native-reanimated';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setAnimating] = useAtom(overlayAnimatingAtom);

  const intensity = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  useEffect(() => {
    if (visible) {
      setAnimating(true);
      intensity.value = withTiming(25, {
        duration: 300
      }, () => {
        runOnJS(setAnimating)(false);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    setAnimating(true);
    intensity.value = withTiming(0, {
      duration: 300
    }, () => {
      runOnJS(setVisible)(false);
      runOnJS(setOverlayContent)([]);
      runOnJS(setAnimating)(false);
    });
  };

  // Ensure unique items by name
  const uniqueContent = content.reduce((acc, current) => {
    const exists = acc.find(item => item.name === current.name);
    if (!exists) acc.push(current);
    return acc;
  }, [] as typeof content);

  return (
    <Portal>
      <AnimatedBlur animatedProps={animatedProps} tint="systemThickMaterialDark" style={StyleSheet.absoluteFill}>
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