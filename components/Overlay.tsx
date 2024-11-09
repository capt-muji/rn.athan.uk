import { StyleSheet, Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { BlurView } from 'expo-blur';
import { overlayVisibleAtom, overlayContentAtom } from '@/store/store';
import { COLORS } from '@/constants';

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [content, setOverlayContent] = useAtom(overlayContentAtom);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    setOverlayContent([]); // Reset overlay content when closing
  };

  // Ensure unique items by name
  const uniqueContent = content.reduce((acc, current) => {
    const exists = acc.find(item => item.name === current.name);
    if (!exists) acc.push(current);
    return acc;
  }, [] as typeof content);

  return (
    <Portal>
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill}>
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
      </BlurView>
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