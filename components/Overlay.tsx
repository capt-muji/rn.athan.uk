import { StyleSheet, Pressable } from 'react-native';
import { Portal } from 'react-native-paper';
import { useAtom } from 'jotai';
import { overlayVisibleAtom, overlayContentAtom } from '@/store/store';
import { COLORS } from '@/constants';

export default function Overlay() {
  const [visible, setVisible] = useAtom(overlayVisibleAtom);
  const [content] = useAtom(overlayContentAtom);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <Portal>
      <Pressable style={styles.overlay} onPress={handleClose}>
        {Object.entries(content).map(([key, { component, measurements }]) => (
          <Pressable
            key={key}
            style={[
              styles.content,
              {
                position: 'absolute',
                top: measurements.pageY,
                left: measurements.pageX,
                width: measurements.width,
                padding: 0,
                margin: 0,
                backgroundColor: 'gree',
              }
            ]}
          >
            {component}
          </Pressable>
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