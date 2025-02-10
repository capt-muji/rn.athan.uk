import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { COLORS, TEXT, ANIMATION, OVERLAY } from '@/shared/constants';

type Props = {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  hideCloseButton?: boolean;
  title: string;
};

export default function Modal({ visible, onClose, children, hideCloseButton, title }: Props) {
  if (!visible) return null;

  return (
    <Animated.View style={styles.container} entering={FadeIn} exiting={FadeOut}>
      <View style={styles.backdrop} />
      <Animated.View
        style={styles.modal}
        entering={SlideInDown.springify().damping(20).mass(0.95).stiffness(100)}
        exiting={SlideOutDown.duration(ANIMATION.duration)}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {children}
          {!hideCloseButton && (
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: OVERLAY.zindexes.popup,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 500,
    shadowColor: '#12001e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 35,
    elevation: 25,
  },
  title: {
    fontSize: TEXT.size + 2,
    fontFamily: TEXT.family.medium,
    marginBottom: 12,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    marginTop: 30,
    paddingVertical: 16,
    backgroundColor: '#000',
    borderRadius: 10,
    width: '75%',
    alignItems: 'center',
  },
  closeText: {
    color: COLORS.activePrayer,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.medium,
    letterSpacing: 0.5,
  },
});
