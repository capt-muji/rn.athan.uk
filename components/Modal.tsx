import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { COLORS, TEXT, ANIMATION, OVERLAY } from '@/shared/constants';

type Props = {
  visible: boolean;
  children?: React.ReactNode;
  title: string;
};

export default function Modal({ visible, children, title }: Props) {
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
    backgroundColor: COLORS.light.backdrop,
  },
  modal: {
    backgroundColor: COLORS.light.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 500,
    shadowColor: COLORS.light.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 35,
    elevation: 25,
  },
  title: {
    fontSize: TEXT.size + 2,
    fontFamily: TEXT.family.medium,
    marginBottom: 12,
    color: COLORS.light.text,
    letterSpacing: 0.3,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
});
