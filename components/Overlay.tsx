import { StyleSheet, Pressable, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
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
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${COLORS.gradientStart}e6`,
    zIndex: 1000,
  },
  content: {
    zIndex: 1001,
  }
});