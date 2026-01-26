import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { COLORS, TEXT, ANIMATION, OVERLAY, RADIUS, SPACING, SHADOW, ELEVATION, LAYOUT, SIZE } from '@/shared/constants';

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
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    width: LAYOUT.modal.width,
    maxWidth: SIZE.modal.maxWidth,
    shadowColor: COLORS.light.shadow,
    ...SHADOW.modal,
    elevation: ELEVATION.maximum,
  },
  title: {
    fontSize: TEXT.sizeTitle,
    fontFamily: TEXT.family.medium,
    marginBottom: SPACING.md,
    color: COLORS.light.text,
    letterSpacing: TEXT.letterSpacing.wide,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
});
