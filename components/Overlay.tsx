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

  return (
    <Portal>
      <Pressable style={styles.overlay} onPress={handleClose}>
        {content.map(({ name, component, measurements }) => (
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
    backgroundColor: 'blue',
  }
});