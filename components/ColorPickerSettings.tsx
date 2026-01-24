import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorPicker, { HueSlider, Panel1, Swatches, type ColorFormatsObject } from 'reanimated-color-picker';

import CheckIcon from '@/assets/icons/svg/check.svg';
import CloseIcon from '@/assets/icons/svg/close.svg';
import { TEXT, STYLES, COLORS, SPACING, RADIUS, SHADOW, SIZE, ELEVATION, HIT_SLOP } from '@/shared/constants';
import logger from '@/shared/logger';
import { countdownBarColorAtom, countdownBarShownAtom } from '@/stores/ui';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Primary swatch colors for quick selection (first is default) */
const SWATCH_COLORS = [
  '#00ffea', // cyan (default)
  '#ff3366', // hot pink
  '#00ff88', // mint green
  '#ff9500', // orange
  '#ffee00', // yellow
  '#7b68ee', // medium purple
];

/** Secondary swatch colors for additional options */
const SWATCH_COLORS_2 = [
  '#ff2d2d', // red
  '#00bfff', // deep sky blue
  '#ff69b4', // pink
  '#32cd32', // lime green
  '#dc2eff', // gold
  '#1f8bff', // medium orchid
];

/** Default color when reset is pressed */
const DEFAULT_COLOR = SWATCH_COLORS[0];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Color picker settings component for countdown bar customization
 *
 * Allows users to select a custom color for the countdown progress bar.
 * Features:
 * - Quick swatch selection
 * - Full color picker with hue slider
 * - Live preview of selected color
 * - Reset to default option
 *
 * Disabled when countdown bar is hidden in settings.
 *
 * @example
 * // In settings panel
 * <ColorPickerSettings />
 */
export default function ColorPickerSettings() {
  const { bottom } = useSafeAreaInsets();
  const [countdownBarColor, setCountdownBarColor] = useAtom(countdownBarColorAtom);
  const [countdownBarShown] = useAtom(countdownBarShownAtom);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(countdownBarColor);

  const isDisabled = !countdownBarShown;
  const opacity = countdownBarShown ? 1 : 0.4;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    logger.info(`ColorPickerSettings: Opening color picker, current=${countdownBarColor}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedColor(countdownBarColor);
    setShowPicker(true);
  }, [isDisabled, countdownBarColor]);

  const handleColorPreview = useCallback((colors: ColorFormatsObject) => {
    setSelectedColor(colors.hex);
  }, []);

  const handleDone = useCallback(() => {
    logger.info(`ColorPickerSettings: Saving color: ${selectedColor}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCountdownBarColor(selectedColor);
    setShowPicker(false);
  }, [selectedColor, setCountdownBarColor]);

  const handleReset = useCallback(() => {
    if (isDisabled) return;
    logger.info('ColorPickerSettings: Resetting to default color');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCountdownBarColor(DEFAULT_COLOR);
    setShowPicker(false);
  }, [isDisabled, setCountdownBarColor]);

  const handleDismiss = useCallback(() => {
    logger.info('ColorPickerSettings: Cancelled, discarding changes');
    setShowPicker(false);
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isCustomColor = countdownBarColor !== DEFAULT_COLOR;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <>
      <Pressable style={[styles.container, { opacity }]} onPress={handlePress} hitSlop={HIT_SLOP.md}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>Countdown bar color</Text>
        <View style={styles.rightContainer}>
          {isCustomColor && (
            <Pressable onPress={handleReset} hitSlop={HIT_SLOP.sm} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
          <View style={styles.colorPreviewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: countdownBarColor }]} />
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={handleDismiss}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: bottom }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerSide}>
                <Pressable onPress={handleDismiss} hitSlop={HIT_SLOP.md} style={styles.cancelButton}>
                  <CloseIcon width={SIZE.icon.md} height={SIZE.icon.md} color={COLORS.icon.primary} />
                </Pressable>
              </View>
              <Text style={styles.modalTitle}>Select Color</Text>
              <View style={[styles.headerSide, styles.headerSideRight]}>
                <Pressable onPress={handleDone} hitSlop={HIT_SLOP.md} style={styles.saveButton}>
                  <CheckIcon width={SIZE.icon.md} height={SIZE.icon.md} color={COLORS.modal.saveText} />
                </Pressable>
              </View>
            </View>

            <View style={styles.previewContainer}>
              <View style={styles.previewBar}>
                <View style={[styles.previewProgress, { width: '65%', backgroundColor: selectedColor }]} />
              </View>
            </View>

            <ColorPicker value={selectedColor} onChangeJS={handleColorPreview} style={styles.colorPicker}>
              <Panel1 style={styles.panel} />
              <HueSlider style={styles.hueSlider} />
              <Swatches colors={SWATCH_COLORS} style={styles.swatches} />
              <Swatches colors={SWATCH_COLORS_2} style={styles.swatches} />
            </ColorPicker>
          </View>
        </View>
      </Modal>
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // --- Main Container ---
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: STYLES.prayer.height,
    paddingHorizontal: STYLES.prayer.padding.left,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },

  // --- Label Styles ---
  label: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  labelDisabled: {
    color: COLORS.text.disabled,
  },

  // --- Right Side (Reset + Preview) ---
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  resetButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  resetText: {
    color: COLORS.text.secondary,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmall,
  },
  colorPreviewContainer: {
    width: SIZE.iconWrapper.sm,
    height: SIZE.iconWrapper.sm,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreview: {
    width: SIZE.dot.lg,
    height: SIZE.dot.lg,
    borderRadius: SIZE.dot.lg / 2,
  },
  chevron: {
    color: COLORS.icon.primary,
    fontSize: SIZE.icon.md,
    fontWeight: '300',
  },

  // --- Modal Container ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingTop: SPACING.gap,
    borderWidth: 1,
    borderBottomWidth: 0,
    backgroundColor: COLORS.surface.sheet,
    borderColor: COLORS.surface.sheetBorder,
    shadowColor: COLORS.modal.shadow,
    ...SHADOW.colorPickerModal,
    elevation: ELEVATION.standard,
  },

  // --- Modal Header ---
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
  },
  headerSide: {
    width: SIZE.button.icon,
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  modalTitle: {
    color: COLORS.text.primary,
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.size,
  },
  cancelButton: {
    backgroundColor: COLORS.icon.background,
    height: SIZE.button.icon,
    width: SIZE.button.icon,
    borderRadius: SIZE.button.icon / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.modal.saveBackground,
    borderWidth: 1,
    borderColor: COLORS.modal.saveBorder,
    height: SIZE.button.icon,
    width: SIZE.button.icon,
    borderRadius: SIZE.button.icon / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Color Picker ---
  colorPicker: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  previewContainer: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  previewBar: {
    height: SIZE.bar.sm,
    width: '50%',
    maxWidth: 350,
    backgroundColor: COLORS.colorPicker.buttonBackground,
    borderRadius: SIZE.bar.sm / 2,
    overflow: 'hidden',
  },
  previewProgress: {
    height: '100%',
    borderRadius: SIZE.bar.sm / 2,
  },
  panel: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  hueSlider: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  swatches: {
    marginTop: SPACING.gap,
    paddingBottom: SPACING.gap,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
