import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/shared/constants';

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
        backgroundColor: '#0b183a',
        borderColor: '#0f1d46',
        shadowColor: '#180332',
        shadowOffset: { width: 0, height: -50 },
        shadowOpacity: 0.5,
        shadowRadius: 150,
        elevation: 15,
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
    style={[bottomSheetStyles.backdrop, props.style]}
  />
);

/**
 * Shared styles for bottom sheet components
 * Includes modal padding, container, indicator, backdrop, and background styles
 */
export const bottomSheetStyles = StyleSheet.create({
  modal: { paddingTop: 15 },
  container: { flex: 1 },
  indicator: { backgroundColor: COLORS.textSecondary },
  backdrop: { backgroundColor: '#000116' },
  sheetBackground: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
});
