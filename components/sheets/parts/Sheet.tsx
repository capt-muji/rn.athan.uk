import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ANIMATION, COLORS, ELEVATION, OVERLAY, RADIUS, SPACING } from '@/shared/constants';

import Header from './Header';

const SHEET_BOTTOM_PADDING = 50;
const DISMISS_TRANSLATION_THRESHOLD = 120;
const DISMISS_VELOCITY_THRESHOLD = 800;

interface SheetProps {
  /** Function to set the modal ref for external control (present/dismiss) */
  setRef: (ref: { present: () => void; dismiss: () => void } | null) => void;
  /** Sheet header title */
  title: string;
  /** Sheet header subtitle */
  subtitle: string;
  /** Sheet header icon */
  icon: React.ReactNode;
  /** Sheet content */
  children: React.ReactNode;
  /** Called when sheet is dismissed */
  onDismiss?: () => void;
  /** Sheet height as percentage or pixels. Ignored if enableDynamicSizing is true */
  snapPoints?: (string | number)[];
  /** Size the sheet to its content instead of snap points */
  enableDynamicSizing?: boolean;
  /** Use scrollable content area */
  scrollable?: boolean;
}

/**
 * Generic bottom sheet wrapper component
 *
 * Inline Reanimated sheet anchored flush to the bottom edge of the screen:
 * - Full-width panel with rounded top corners and a spaced drag indicator
 * - Dark backdrop (tap to dismiss) and pan-down / hardware-back dismissal
 * - Configurable snap-point height or dynamic content sizing
 * - Scrollable or fixed content area (scroll indicator hidden)
 */
export default function Sheet({
  setRef,
  title,
  subtitle,
  icon,
  children,
  onDismiss,
  snapPoints = ['70%'],
  enableDynamicSizing = false,
  scrollable = true,
}: SheetProps) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const screenHeight = Dimensions.get('window').height;
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  const timingConfig = { duration: ANIMATION.duration, easing: Easing.out(Easing.quad) };

  const animateIn = useCallback(() => {
    translateY.value = withTiming(0, timingConfig);
    backdropOpacity.value = withTiming(0.9, timingConfig);
  }, [translateY, backdropOpacity]);

  const close = useCallback(() => {
    translateY.value = withTiming(screenHeight, timingConfig, (finished) => {
      if (finished) runOnJS(setIsVisible)(false);
    });
    backdropOpacity.value = withTiming(0, timingConfig);
  }, [translateY, backdropOpacity, screenHeight]);

  // Idempotent: backdrop tap, swipe-down and hardware back can race
  const isDismissedRef = useRef(false);
  const dismiss = useCallback(() => {
    if (isDismissedRef.current) return;
    isDismissedRef.current = true;
    close();
    onDismissRef.current?.();
  }, [close]);

  // Expose the imperative handle the stores hold (present/dismiss)
  const handleRef = useRef({ present: () => {}, dismiss: () => {} });
  handleRef.current.present = () => {
    isDismissedRef.current = false;
    setIsVisible(true);
  };
  handleRef.current.dismiss = () => dismiss();

  useEffect(() => {
    setRef(handleRef.current);
  }, [setRef]);

  useEffect(() => {
    if (isVisible) {
      animateIn();
      return BackHandler.addEventListener('hardwareBackPress', () => {
        dismiss();
        return true;
      }).remove;
    }
    translateY.value = screenHeight;
    backdropOpacity.value = 0;
  }, [isVisible, animateIn, dismiss, screenHeight, translateY, backdropOpacity]);

  // Pan-down on the header area dismisses; content scrolling is unaffected
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldDismiss =
        event.translationY > DISMISS_TRANSLATION_THRESHOLD || event.velocityY > DISMISS_VELOCITY_THRESHOLD;
      if (shouldDismiss) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withTiming(0, timingConfig);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const panelHeight = enableDynamicSizing ? undefined : parseSnapHeight(snapPoints[0], screenHeight);
  const contentPadding = safeBottom + SPACING.xxxl + SHEET_BOTTOM_PADDING;

  if (!isVisible) return null;

  return (
    <View style={[styles.overlay, { zIndex: OVERLAY.zindexes.popup, elevation: ELEVATION.standard }]}>
      <Animated.View style={[styles.backdropFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.panel, panelStyle, { height: panelHeight }]}>
          <GestureDetector gesture={pan}>
            <View>
              <View style={styles.indicatorWrapper}>
                <View style={styles.indicator} />
              </View>
              <Header title={title} subtitle={subtitle} icon={icon} />
            </View>
          </GestureDetector>
          {scrollable ? (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: contentPadding }}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, { paddingBottom: contentPadding }]}>{children}</View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const parseSnapHeight = (snapPoint: string | number, screenHeight: number): number | undefined => {
  if (typeof snapPoint === 'number') return snapPoint;
  if (snapPoint.endsWith('%')) return (parseFloat(snapPoint) / 100) * screenHeight;
  return undefined;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface.backdrop,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.popup,
    backgroundColor: COLORS.surface.sheet,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface.sheetBorder,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
  },
  indicatorWrapper: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  indicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.text.secondary,
  },
  content: {
    paddingHorizontal: SPACING.xl,
  },
});
