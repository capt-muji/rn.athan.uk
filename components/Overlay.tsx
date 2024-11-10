import { StyleSheet, Pressable, View, Dimensions } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { overlayVisibleAtom, overlayContentAtom, selectedPrayerIndexAtom } from '@/store/store';
import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedProps
} from 'react-native-reanimated';
import RadialGlow from './RadialGlow';

const AnimatedBlur = Reanimated.createAnimatedComponent(BlurView);

export default function Overlay() {
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);

  const intensity = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensity.value,
  }));

  useEffect(() => {
    if (overlayVisible) {
      intensity.value = withTiming(10, { duration: 300 });
    }
  }, [overlayVisible]);

  const handleClose = () => {
    setSelectedPrayerIndex(-1);
    intensity.value = withTiming(0, { duration: 300 });
    setOverlayVisible(false);
    setOverlayContent([]);
  };

  // Ensure unique items by name
  const uniqueContent = content.reduce((acc, current) => {
    const exists = acc.find(item => item.name === current.name);
    if (!exists) acc.push(current);
    return acc;
  }, [] as typeof content);

  if (!overlayVisible) return null;

  return (
    <Portal>
      <AnimatedBlur animatedProps={animatedProps} tint="light" style={StyleSheet.absoluteFill}>
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
    zIndex: 1002,
  },
  radialGradient: {
    position: 'absolute',
    top: -Dimensions.get('window').height / 2,  // Move up by half the height
    left: -Dimensions.get('window').height / 10,  // Move left by half the width
    width: Dimensions.get('window').height / 1,
    height: Dimensions.get('window').height / 1,
    zIndex: 1001,  // between overlay and content
  }
});