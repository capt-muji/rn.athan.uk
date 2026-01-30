import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from './Header';
import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from './Shared';

import { SPACING, OVERLAY, ELEVATION } from '@/shared/constants';

const SHEET_BOTTOM_PADDING = 50;

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
  /** Snap points for the sheet. Ignored if enableDynamicSizing is true */
  snapPoints?: (string | number)[];
  /** Enable dynamic sizing based on content */
  enableDynamicSizing?: boolean;
  /** Use scrollable content area */
  scrollable?: boolean;
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
  snapPoints = ['70%'],
  enableDynamicSizing = false,
  scrollable = true,
}: SheetProps) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = Platform.OS === 'android' ? 0 : safeBottom;
  const contentPadding = bottom + SPACING.xxxl + SHEET_BOTTOM_PADDING;

  const handleRef = useCallback(
    (ref: BottomSheetModal | null) => {
      setRef(ref);
    },
    [setRef]
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
      onDismiss={onDismiss}
      onAnimate={onAnimate}
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
