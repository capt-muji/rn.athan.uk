import { Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { ANIMATION, COLORS, ELEVATION, LAYOUT, OVERLAY, RADIUS, SHADOW, SIZE, SPACING, TEXT } from '@/shared/constants';

/**
 * Modal motion mirrors the sheets' recipe (SHEET_ANIMATION_CONFIGS in
 * components/sheets/parts/Sheet.tsx): Android 200ms cubic-out, iOS the
 * duration-form spring (220ms, dampingRatio 0.9). The previous soft spring
 * (stiffness 100) settled visibly slower than the sheet the modal opens from.
 */
const MODAL_ENTERING = Platform.select({
  android: SlideInDown.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic)),
  default: SlideInDown.springify().duration(220).dampingRatio(0.9),
});

const MODAL_EXITING = Platform.select({
  android: SlideOutDown.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic)),
  default: SlideOutDown.springify().duration(220).dampingRatio(0.9),
});

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
      <Animated.View style={styles.modal} entering={MODAL_ENTERING} exiting={MODAL_EXITING}>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: OVERLAY.zindexes.popup,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
