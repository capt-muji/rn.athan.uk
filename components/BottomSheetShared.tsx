import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';

/**
 * Shared background component for bottom sheets
 * Renders a gradient background with rounded top corners
 */
export const renderSheetBackground = () => (
  <LinearGradient
    style={[StyleSheet.absoluteFill, bottomSheetStyles.sheetBackground]}
    colors={['#0e0b32', '#090428']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
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
