import { useEffect, useRef } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

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

/** The card follows its content's height, so a section opening inside it does not snap the whole modal */
const MODAL_RESIZE = LinearTransition.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic));

const MODAL_EXITING = Platform.select({
  android: SlideOutDown.duration(ANIMATION.duration).easing(Easing.out(Easing.cubic)),
  default: SlideOutDown.springify().duration(220).dampingRatio(0.9),
});

type Props = {
  visible: boolean;
  children?: React.ReactNode;
  title: string;
  /** Long content: takes nearly the whole screen instead of the compact card */
  wide?: boolean;
  /** Rules the title off from content that scrolls beneath it */
  divider?: boolean;
  icon?: React.ReactNode;
  /** Centres the title over full-width content, rather than hugging the leading edge */
  centreTitle?: boolean;
  /** Pushes the icon to the trailing edge, with the title against the leading one */
  trailingIcon?: boolean;
  /** Android's back gesture closes the modal, matching the Sheet's own handler */
  onRequestClose?: () => void;
};

export default function Modal({
  visible,
  children,
  title,
  wide,
  divider,
  icon,
  centreTitle,
  trailingIcon,
  onRequestClose,
}: Props) {
  // Read through a ref so a caller passing a fresh closure each render does not re-subscribe;
  // callers define these inline (app/index.tsx), so the identity changes on every render
  const closeRef = useRef(onRequestClose);
  closeRef.current = onRequestClose;

  // Android's back press would otherwise fall through to the screen behind and leave the app,
  // with the modal still covering it (Sheet.tsx carries the same handler for the same reason)
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!closeRef.current) return false;
      closeRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={styles.container} entering={FadeIn} exiting={FadeOut}>
      <View style={styles.backdrop} />
      {/* Without this the prayer list behind the modal stays reachable by swipe, so a
          screen-reader user can operate controls they cannot see are covered */}
      <Animated.View
        accessibilityViewIsModal={true}
        accessibilityRole='alert'
        style={[styles.modal, wide && styles.modalWide]}
        layout={MODAL_RESIZE}
        entering={MODAL_ENTERING}
        exiting={MODAL_EXITING}>
        <View style={styles.content}>
          <View
            style={[
              styles.titleRow,
              (centreTitle || trailingIcon) && styles.titleRowCentre,
              trailingIcon && styles.titleRowApart,
              trailingIcon && wide && styles.titleRowInset,
            ]}>
            {trailingIcon ? null : icon}
            <Text style={[styles.title, divider && styles.titleWithDivider]}>{title}</Text>
            {trailingIcon ? icon : null}
          </View>
          {divider ? <View style={[styles.divider, wide && styles.dividerWide]} /> : null}
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
  modalWide: {
    width: '95%',
    maxWidth: SIZE.contentMaxWidth,
    maxHeight: '96%',
    padding: SPACING.lg2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  titleRowCentre: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  titleRowApart: {
    justifyContent: 'space-between',
  },
  /** Lines the title and its icon up with content that carries its own indent, such as Help's rows */
  titleRowInset: {
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: TEXT.sizeTitle,
    fontFamily: TEXT.family.medium,
    marginBottom: SPACING.md,
    color: COLORS.light.text,
    letterSpacing: TEXT.letterSpacing.wide,
  },
  titleWithDivider: {
    marginBottom: SPACING.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.light.textSecondary,
    opacity: 0.2,
    alignSelf: 'stretch',
    marginHorizontal: -SPACING.xxl,
    marginBottom: SPACING.md,
  },
  dividerWide: {
    marginHorizontal: -SPACING.lg2,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
});
