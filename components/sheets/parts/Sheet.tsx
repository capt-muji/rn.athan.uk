import {
  BottomSheetModal,
  type BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ELEVATION, OVERLAY, SPACING } from '@/shared/constants';
import { perfMark, perfMeasure } from '@/shared/perf';

import Header from './Header';
import { bottomSheetStyles, renderBackdrop, renderSheetBackground } from './Shared';

const SHEET_BOTTOM_PADDING = 50;

/**
 * Snappier sheet motion than the library defaults: the default Android timing
 * uses Easing.out(Easing.exp), whose exponential tail makes the close settle
 * drag; cubic-out finishes crisp. iOS uses the duration-form spring, which
 * completes at its duration instead of crossing rest thresholds — the
 * 2026-09-08 owner report had dismiss committing ~400ms after the sheet
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
  subtitle: string;
  /** Sheet header icon */
  icon: React.ReactNode;
  /** Sheet content */
  children: React.ReactNode;
  /** Called when sheet is dismissed */
  onDismiss?: () => void;
  /** Called when sheet animation starts */
  onAnimate?: () => void;
  /**
   * Performance mark prefix for open/close timing (e.g. 'sheet_settings').
   * Produces <perfName>_open (present → settled) and <perfName>_close measures
   * when EXPO_PUBLIC_PERF_MONITOR=1
   */
  perfName?: string;
  /** Snap points for the sheet. Ignored if enableDynamicSizing is true */
  snapPoints?: (string | number)[];
  /** Enable dynamic sizing based on content */
  enableDynamicSizing?: boolean;
  /** Use scrollable content area */
  scrollable?: boolean;
  /**
   * Called once, the first time the sheet fully opens (settles on its first
   * snap point). Used by the settings sheet to warm the sound list — the
   * sound sheet is only reachable through settings, so its 32-row list
   * builds invisibly while the user is one tap away
   */
  onFirstPresent?: () => void;
  /**
   * Bottom-sheet stack behavior when presented over another sheet. Default
   * 'switch' serializes: the lib waits for the previous sheet to unmount
   * before animating this one in. 'push' presents immediately on top — used
   * by the sound sheet so "Change athan" closes settings and opens it
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
 * - Android hardware back dismisses an open sheet instead of exiting the app
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
  perfName,
  snapPoints = ['70%'],
  enableDynamicSizing = false,
  scrollable = true,
  stackBehavior,
}: SheetProps) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;
  const contentPadding = bottom + SPACING.xxxl + SHEET_BOTTOM_PADDING;

  const modalRef = useRef<BottomSheetModal | null>(null);
  const [presented, setPresented] = useState(false);
  const firstPresentFiredRef = useRef(false);

  useEffect(() => {
    if (!presented) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      modalRef.current?.dismiss();
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
      if (perfName) {
        if (toIndex === 0) {
          perfMark(`${perfName}_animate`);
        } else if (toIndex === null || toIndex < 0) {
          perfMark(`${perfName}_close_start`);
        }
      }
      onAnimate?.();
    },
    [perfName, onAnimate]
  );

  // One unified close haptic for every sheet (owner rule 2026-09-08: native
  // consistency): a single Light impact when the sheet finishes closing, on
  // every close path — swipe, backdrop, back, programmatic — landing on the
  // same tick as any dismiss-time commit (the alert sheet's save and icon
  // bounce). Firing at close start instead buzzed the moment a drag began,
  // detached from the outcome.
  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  }, [onDismiss]);

  const handleChange = useCallback(
    (index: number) => {
      setPresented(index !== -1);
      if (index === 0 && !firstPresentFiredRef.current) {
        firstPresentFiredRef.current = true;
        onFirstPresent?.();
      }
      if (!perfName) return;
      if (index === 0) {
        perfMeasure(`${perfName}_open`, `${perfName}_present`);
        perfMeasure(`${perfName}_open_anim`, `${perfName}_animate`);
      } else {
        perfMeasure(`${perfName}_close`, `${perfName}_close_start`);
      }
    },
    [perfName, onFirstPresent]
  );

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;
  const contentStyle = scrollable
    ? { contentContainerStyle: { paddingBottom: contentPadding } }
    : { style: [styles.content, { paddingBottom: contentPadding }] };

  return (
    <BottomSheetModal
      ref={handleRef}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      animationConfigs={SHEET_ANIMATION_CONFIGS}
      stackBehavior={stackBehavior}
      onDismiss={handleDismiss}
      onAnimate={handleAnimate}
      onChange={handleChange}
      style={bottomSheetStyles.modal}
      containerStyle={{ zIndex: OVERLAY.zindexes.popup, elevation: ELEVATION.standard }}
      backgroundComponent={renderSheetBackground}
      handleIndicatorStyle={bottomSheetStyles.indicator}
      backdropComponent={renderBackdrop}>
      <ContentWrapper style={scrollable ? styles.content : undefined} {...contentStyle}>
        <Header title={title} subtitle={subtitle} icon={icon} />
        {children}
      </ContentWrapper>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.xl,
  },
});
