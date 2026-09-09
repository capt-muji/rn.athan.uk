import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';

import { COLORS, OVERLAY, RADIUS, SIZE, SPACING } from '@/shared/constants';

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
  // Auto margins, not alignSelf: the @gorhom sheet body is absolutely
  // positioned with left:0/right:0, so auto margins are the only way to
  // center a maxWidth-capped card inside it
  modal: {
    paddingTop: SPACING.popup,
    width: '100%',
    maxWidth: SIZE.contentMaxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  container: { flex: 1 },
  indicator: { backgroundColor: COLORS.text.secondary },
  backdrop: { backgroundColor: COLORS.surface.backdrop },
  sheetBackground: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet },
});
