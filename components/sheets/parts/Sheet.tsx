import {
  BottomSheetModal,
  type BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ELEVATION, OVERLAY, SIZE, SPACING } from '@/shared/constants';
import { perfMark, perfMeasure } from '@/shared/perf';
import { type AnimationEpochSlot, closeAnimationEpoch, openAnimationEpoch } from '@/stores/animationEpoch';
import { bumpSheetSettleTick } from '@/stores/geometry';

import Header from './Header';
import { bottomSheetStyles, renderBackdrop, renderSheetBackground } from './Shared';

const SHEET_BOTTOM_PADDING = 50;

/**
 * Snappier sheet motion than the library defaults: the default Android timing
 * uses Easing.out(Easing.exp), whose exponential tail makes the close settle
 * drag; cubic-out finishes crisp. iOS uses the duration-form spring, which
 * completes at its duration instead of crossing rest thresholds —
 * dismiss used to commit ~400ms after the sheet
 * looked closed, because onDismiss waits for spring completion.
 */
const SHEET_ANIMATION_CONFIGS = Platform.select({
  android: { duration: 200, easing: Easing.out(Easing.cubic) },
  default: { duration: 220, dampingRatio: 0.9 },
});

interface SheetProps {
  /** Function to set the modal ref for external control */
  setRef: (ref: BottomSheetModal | null) => void;
  /** Sheet header title */
  title: string;
  /** Sheet header subtitle */
  subtitle: React.ReactNode;
  /** Sheet header icon */
  icon: React.ReactNode;
  /** Sheet content */
  children: React.ReactNode;
  /** Called when the sheet has closed, on every close path - swipe, backdrop, back, programmatic */
  onDismiss?: () => void;
  /** Called when a sheet animation starts, with the index it moves to (null before it knows) */
  onAnimate?: (toIndex: number | null) => void;
  /**
   * Performance mark prefix for open/close timing (e.g. 'sheet_settings').
   * Produces <perfName>_open (present → settled) and <perfName>_close measures
   * when EXPO_PUBLIC_PERF_MONITOR=1
   */
  perfName?: string;
  /** Snap points for the sheet. Ignored if enableDynamicSizing is true */
  snapPoints?: (string | number)[];
  /** A dynamically-sized sheet may never pass this share of the screen
   *  height, or it slides under the status bar and the notch. A fraction of the window, handed
   *  to the library's own maxDynamicContentSize in points */
  contentCap?: number;
  /** Enable dynamic sizing based on content */
  enableDynamicSizing?: boolean;
  /** Use scrollable content area */
  scrollable?: boolean;
  /**
   * Host a scrollable the caller brings. The children render bare — no content view of the sheet's
   * own — so the caller's list registers with the sheet as its scrollable: a library content view
   * writes the sheet's scrollable state itself, and an ancestor's write lands after the child's and
   * overwrites it, leaving the list unable to scroll
   */
  hostsScrollable?: boolean;
  /**
   * Holds the unified close haptic. A sheet that gives its own close feedback — the language wheel's
   * commit tick — opts out, so a close that carries nothing stays silent
   */
  suppressCloseHaptic?: boolean;
  /**
   * Called once, the first time the sheet fully opens (settles on its first
   * snap point). Used by the settings sheet to warm the sound list — the
   * sound sheet is only reachable through settings, so its 32-row list
   * builds invisibly while the user is one tap away
   */
  onFirstPresent?: () => void;
  /**
   * Called every time the sheet fully opens. For work that is undone on dismiss and must be redone on the next open,
   * such as a sensor subscription, which `onFirstPresent` would arm once and never again
   */
  onPresent?: () => void;
  /**
   * Content that stays above the scroll view, so a field in it never scrolls
   * away; given one, the header is pinned with it and only the children scroll
   */
  pinned?: React.ReactNode;
  /** How the sheet answers the keyboard: `interactive` moves it with the keyboard */
  keyboardBehavior?: BottomSheetModalProps['keyboardBehavior'];
  /** What the sheet does with the keyboard when the field blurs */
  keyboardBlurBehavior?: BottomSheetModalProps['keyboardBlurBehavior'];
  /**
   * Bottom-sheet stack behavior when presented over another sheet. Default
   * 'switch' serializes: the lib waits for the previous sheet to unmount
   * before animating this one in. 'push' presents immediately on top — used
   * by the sound sheet so the Athan row closes settings and opens it
   * concurrently.
   */
  stackBehavior?: BottomSheetModalProps['stackBehavior'];
}

/**
 * Generic bottom sheet wrapper component
 *
 * Provides consistent styling and behavior for all bottom sheets:
 * - Header with title, subtitle, and icon
 * - Safe area padding
 * - Shared background and backdrop
 * - Configurable snap points or dynamic sizing
 * - Scrollable or fixed content area
 * - Android hardware back closes an open sheet instead of exiting the app
 *
 * The tree stays warm: the modal never unmounts on a close (enableDismissOnClose
 * false), so the first open pays the mount and every open after animates a
 * mounted sheet. Closes go through close(), never dismiss() - a dismiss
 * unmounts the tree whatever the flag says. With the flag false the library
 * never fires its own onDismiss on a close, so onChange reaching -1 is the one
 * close signal, deduped per open session against a dismiss firing both.
 *
 * @example
 * <Sheet
 *   setRef={setBottomSheetModal}
 *   title="Settings"
 *   subtitle="Set your preferences"
 *   icon={<SettingsIcon />}
 *   snapPoints={['70%']}
 * >
 *   <YourContent />
 * </Sheet>
 */
export default function Sheet({
  setRef,
  title,
  subtitle,
  icon,
  children,
  onDismiss,
  onAnimate,
  onFirstPresent,
  onPresent,
  perfName,
  snapPoints = ['70%'],
  contentCap,
  enableDynamicSizing = false,
  scrollable = true,
  hostsScrollable = false,
  suppressCloseHaptic = false,
  stackBehavior,
  pinned,
  keyboardBehavior,
  keyboardBlurBehavior,
}: SheetProps) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;
  const contentPadding = bottom + SPACING.xxxl + SHEET_BOTTOM_PADDING;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Capped via explicit width + insets because the lib pins this container
  // left/right (maxWidth/alignment cannot act). Capping here, not only the
  // card, keeps the full-width sheet body from covering the area beside
  // the card, so side taps reach the backdrop and close.
  const sideInset = Math.max(0, (windowWidth - SIZE.contentMaxWidth) / 2);
  const containerWidth = Math.min(windowWidth, SIZE.contentMaxWidth);

  const modalRef = useRef<BottomSheetModal | null>(null);
  const [presented, setPresented] = useState(false);
  const firstPresentFiredRef = useRef(false);
  // Whether an open session's close is still owed: set when an animation
  // targets an open position or a settle reaches one, consumed by the one close
  // signal. A dismiss that fires beside the change to -1 dedupes against it,
  // and a close before any open (nothing to commit) fires nothing.
  const openSessionRef = useRef(false);
  const epochSlotRef = useRef<AnimationEpochSlot | null>(null);

  useEffect(() => {
    if (!presented) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      modalRef.current?.close();
      return true;
    });
    return () => subscription.remove();
  }, [presented]);

  const handleRef = useCallback(
    (ref: BottomSheetModal | null) => {
      modalRef.current = ref;
      setRef(ref);
    },
    [setRef]
  );

  const handleAnimate = useCallback(
    (_fromIndex: number, toIndex: number | null) => {
      // The open session opens when an animation first targets an open
      // position, not at the settle: a swipe-down that closes the sheet
      // mid-entrance still owes the sheet its close
      if (toIndex !== null && toIndex >= 0) openSessionRef.current = true;
      // The entrance or close is an animation window: per-second writes stand
      // down for it and the settle re-admits them. A second animation beside
      // a live one replaces the slot, keeping the window unbroken
      closeAnimationEpoch(epochSlotRef.current);
      epochSlotRef.current = openAnimationEpoch();
      if (perfName) {
        if (toIndex === 0) {
          perfMark(`${perfName}_animate`);
        } else if (toIndex === null || toIndex < 0) {
          perfMark(`${perfName}_close_start`);
        }
      }
      onAnimate?.(toIndex);
    },
    [perfName, onAnimate]
  );

  // One unified close signal for every sheet, native consistency: a single
  // Light impact when the sheet finishes closing, on every close path — swipe,
  // backdrop, back, programmatic — landing on the same tick as any close-time
  // commit (the alert sheet's save and icon bounce). Firing at close start
  // instead buzzed the moment a drag began, detached from the outcome.
  const handleClosed = useCallback(() => {
    if (!openSessionRef.current) return;
    openSessionRef.current = false;
    if (!suppressCloseHaptic) {
      perfMark('sheet_close_haptic');
      const impact = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void impact.then(() => perfMark('sheet_close_haptic_settled'));
    }
    onDismiss?.();
  }, [onDismiss, suppressCloseHaptic]);

  const handleChange = useCallback(
    (index: number) => {
      setPresented(index !== -1);
      if (index !== -1) openSessionRef.current = true;
      // The animation window is over: whatever the entrance deferred may write
      closeAnimationEpoch(epochSlotRef.current);
      epochSlotRef.current = null;
      if (index === 0) {
        if (!firstPresentFiredRef.current) {
          firstPresentFiredRef.current = true;
          onFirstPresent?.();
        }
        onPresent?.();
        // The entrance is over: the sanctioned moment for a sheet's measured
        // geometry to reach its cache
        bumpSheetSettleTick();
      } else if (index === -1) {
        handleClosed();
      }
      if (!perfName) return;
      if (index === 0) {
        perfMeasure(`${perfName}_open`, `${perfName}_present`);
        perfMeasure(`${perfName}_open_anim`, `${perfName}_animate`);
      } else {
        perfMeasure(`${perfName}_close`, `${perfName}_close_start`);
      }
    },
    [perfName, onFirstPresent, onPresent, handleClosed]
  );

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;
  // No scrollable in the app draws an indicator; the library default is true at the pinned 5.2.14
  const contentStyle = scrollable
    ? { contentContainerStyle: { paddingBottom: contentPadding }, showsVerticalScrollIndicator: false }
    : { style: { paddingBottom: contentPadding } };

  const columnStyle = [bottomSheetStyles.column, styles.content];
  const header = <Header title={title} subtitle={subtitle} icon={icon} />;

  let body: React.ReactNode;
  if (hostsScrollable) {
    body = (
      <>
        <View style={columnStyle}>
          {header}
          {pinned}
        </View>
        {/* The sheet's own column keeps the horizontal inset and the home-indicator room the
            content view carried, with the caller's list filling what is left */}
        <View style={[columnStyle, styles.hostedContent, { paddingBottom: contentPadding }]}>{children}</View>
      </>
    );
  } else if (pinned === undefined) {
    body = (
      <ContentWrapper {...contentStyle}>
        <View style={columnStyle}>
          {header}
          {children}
        </View>
      </ContentWrapper>
    );
  } else {
    body = (
      <>
        <View style={columnStyle}>
          {header}
          {pinned}
        </View>
        <ContentWrapper {...contentStyle}>
          <View style={columnStyle}>{children}</View>
        </ContentWrapper>
      </>
    );
  }

  return (
    <BottomSheetModal
      ref={handleRef}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={contentCap ? windowHeight * contentCap : undefined}
      enablePanDownToClose
      animationConfigs={SHEET_ANIMATION_CONFIGS}
      stackBehavior={stackBehavior}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      enableDismissOnClose={false}
      onDismiss={handleClosed}
      onAnimate={handleAnimate}
      onChange={handleChange}
      style={bottomSheetStyles.modal}
      containerStyle={[
        { zIndex: OVERLAY.zindexes.popup, elevation: ELEVATION.standard },
        { width: containerWidth, marginStart: sideInset, marginEnd: sideInset },
      ]}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      {body}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.xl,
  },
  hostedContent: {
    flex: 1,
  },
});
