import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import ColorPicker, { HueSlider, Panel1, Swatches, type ColorFormatsObject } from 'reanimated-color-picker';

import { TEXT, STYLES } from '@/shared/constants';
import logger from '@/shared/logger';
import { countdownBarColorAtom, countdownBarShownAtom } from '@/stores/ui';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Primary swatch colors for quick selection */
const SWATCH_COLORS = [
  '#00eeff', // cyan
  '#ff0055', // hot pink
  '#00ff66', // lime green
  '#ff6600', // orange
  '#ffff00', // yellow
  '#3355ff', // royal blue
  '#9900ff', // purple
];

/** Secondary swatch colors for additional options */
const SWATCH_COLORS_2 = [
  '#ff0033', // bright red
  '#00e5ff', // bright teal
  '#ff5722', // coral
  '#4a00ff', // indigo
  '#39ff14', // neon green
  '#ffb300', // amber
  '#ff0090', // magenta
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
      <Pressable style={[styles.container, { opacity }]} onPress={handlePress} hitSlop={10}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>Countdown bar color</Text>
        <View style={styles.rightContainer}>
          {isCustomColor && (
            <Pressable onPress={handleReset} hitSlop={8} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
          <View style={styles.colorPreviewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: countdownBarColor }]} />
          </View>
        </View>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={handleDismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerSide}>
                <Pressable onPress={handleDismiss} hitSlop={10}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
              <Text style={styles.modalTitle}>Select Color</Text>
              <View style={styles.headerSide}>
                <Pressable onPress={handleDone} hitSlop={10} style={styles.saveButton}>
                  <Text style={styles.saveText}>Save</Text>
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
    borderBottomColor: '#ffffff10',
  },

  // --- Label Styles ---
  label: {
    color: 'white',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  labelDisabled: {
    color: '#92d3ffa6',
  },

  // --- Right Side (Reset + Preview) ---
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetText: {
    color: '#a0c8ff89',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmall,
  },
  colorPreviewContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreview: {
    width: 38,
    height: 18,
    borderRadius: 10,
  },

  // --- Modal Container ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    backgroundColor: '#0b183a',
    borderColor: '#0f1d46',
    shadowColor: '#113f9b',
    shadowOffset: { width: 0, height: -50 },
    shadowOpacity: 0.25,
    shadowRadius: 150,
    elevation: 15,
  },

  // --- Modal Header ---
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSide: {
    width: 70,
  },
  modalTitle: {
    color: 'white',
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.size,
  },
  cancelText: {
    color: '#a0c8ff89',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  saveText: {
    color: '#fffeff',
    fontFamily: TEXT.family.medium,
    fontSize: TEXT.size,
  },
  saveButton: {
    backgroundColor: '#5015b5',
    borderWidth: 1,
    borderColor: '#672bcf',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  // --- Color Picker ---
  colorPicker: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewContainer: {
    padding: 30,
    alignItems: 'center',
  },
  previewBar: {
    height: 6,
    width: '50%',
    maxWidth: 350,
    backgroundColor: '#4f7eb43d',
    borderRadius: 3,
    overflow: 'hidden',
  },
  previewProgress: {
    height: '100%',
    borderRadius: 3,
  },
  panel: {
    marginBottom: 20,
    borderRadius: 12,
  },
  hueSlider: {
    marginBottom: 20,
    borderRadius: 8,
  },
  swatches: {
    marginTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
});
