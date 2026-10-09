import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';

import { COLORS, OVERLAY, RADIUS, SIZE, SPACING } from '@/shared/constants';

/**
 * Shared background component for bottom sheets
 * Renders a flat background with border
 */
// Pinned vertically but not horizontally: the lib body pins left/right,
// so Yoga alignment can only center children that carry no horizontal
// insets — the cap+center therefore lives here and on the content column.
export const renderSheetBackground = () => (
  <View
    style={[
      { position: 'absolute', top: 0, bottom: 0 },
      bottomSheetStyles.column,
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
  column: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: SIZE.contentMaxWidth,
  },
  container: { flex: 1 },
  indicator: { backgroundColor: COLORS.text.secondary },
  backdrop: { backgroundColor: COLORS.surface.backdrop },
  sheetBackground: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet },
});
