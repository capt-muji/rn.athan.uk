import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';

import { COLORS, RADIUS, SPACING, OVERLAY } from '@/shared/constants';

/**
 * Shared background component for bottom sheets
 * Renders a flat background with border
 */
export const renderSheetBackground = () => (
  <View
    style={[
      StyleSheet.absoluteFill,
      bottomSheetStyles.sheetBackground,
      {
        borderWidth: 1,
        borderBottomWidth: 0,
        backgroundColor: COLORS.surface.sheet,
        borderColor: COLORS.surface.sheetBorder,
      },
    ]}
  />
);

/**
 * Shared backdrop component for bottom sheets
 * Semi-transparent dark overlay that appears behind the sheet
 */
export const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.9}
    style={[bottomSheetStyles.backdrop, { zIndex: OVERLAY.zindexes.popup }, props.style]}
  />
);

/**
 * Shared styles for bottom sheet components
 * Includes modal padding, container, indicator, backdrop, and background styles
 */
export const bottomSheetStyles = StyleSheet.create({
  modal: { paddingTop: SPACING.popup },
  container: { flex: 1 },
  indicator: { backgroundColor: COLORS.text.secondary },
  backdrop: { backgroundColor: COLORS.surface.backdrop },
  sheetBackground: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet },
});
