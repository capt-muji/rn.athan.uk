import * as Haptics from 'expo-haptics';
import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { I18nManager, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorPicker, { type ColorFormatsObject, HueSlider, Panel1, Swatches } from 'reanimated-color-picker';

import CheckIcon from '@/assets/icons/svg/check.svg';
import CloseIcon from '@/assets/icons/svg/close.svg';
import { CountdownBar } from '@/components/countdown';
import {
  COLOR_PICKER_DEFAULT,
  COLOR_PICKER_SWATCHES,
  COLOR_PICKER_SWATCHES_2,
  COLORS,
  ELEVATION,
  HIT_SLOP,
  RADIUS,
  SHADOW,
  SIZE,
  SPACING,
  TEXT,
} from '@/shared/constants';
import { t } from '@/shared/i18n';
import { chevronFor, currentLocaleId, localeDirection } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import { typographyFor } from '@/shared/typography';
import { countdownBarColorAtom, countdownBarShownAtom } from '@/stores/ui';

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
    setCountdownBarColor(COLOR_PICKER_DEFAULT);
    setShowPicker(false);
  }, [isDisabled, setCountdownBarColor]);

  const handleDismiss = useCallback(() => {
    logger.info('ColorPickerSettings: Cancelled, discarding changes');
    setShowPicker(false);
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isCustomColor = countdownBarColor !== COLOR_PICKER_DEFAULT;

  // The reset label's ink: shown over the sheet, the old 0.25-chain flatten when the bar
  // is hidden, the card's own face while it cannot be used
  const resetInk = !isCustomColor ? RESET_HIDDEN_INK : countdownBarShown ? '#5b77a4' : '#1f3055';

  // =============================================================================
  // RENDER
  // =============================================================================

  // The picker library snapshots I18nManager.isRTL at module load and writes its geometry
  // for that snapshot, so the panel resolves the direction the same snapshot took: the
  // library's geometry and the layout it draws stay in step in every launch state (a
  // starved crossing snapshots false, a completed one true)
  const pickerDirection = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr';
  const modalDirection = localeDirection(currentLocaleId());

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={handlePress}
        hitSlop={HIT_SLOP.md}
        accessibilityRole={'button'}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={t('colorPicker.label')}>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{t('colorPicker.label')}</Text>
        <View style={styles.rightContainer}>
          <Pressable
            onPress={handleReset}
            hitSlop={HIT_SLOP.sm}
            style={styles.resetButton}
            disabled={!isCustomColor}
            accessibilityRole={'button'}
            accessibilityLabel={t('colorPicker.resetLabel')}
            // Hidden in ink on the default colour, so without these a screen reader offers
            // a Reset that is invisible and does nothing. Both, because one is iOS and one Android
            accessibilityElementsHidden={!isCustomColor}
            importantForAccessibility={isCustomColor ? 'yes' : 'no-hide-descendants'}>
            {/* Kept mounted so the row holds its width; hidden in the card's own face, so no glyph compounds */}
            <Text style={[styles.resetText, { color: resetInk }]}>{t('colorPicker.reset')}</Text>
          </Pressable>
          <View style={[styles.colorPreviewContainer, isDisabled && styles.previewDim]}>
            <View style={[styles.colorPreview, { backgroundColor: countdownBarColor }]} />
          </View>
          <Text style={[styles.chevron, isDisabled && styles.chevronDisabled]}>{chevronFor()}</Text>
        </View>
      </Pressable>

      <Modal visible={showPicker} transparent animationType={'slide'} onRequestClose={handleDismiss}>
        <View testID={'picker-modal-root'} style={[styles.modalOverlay, { direction: modalDirection }]}>
          <View style={[styles.modalContent, { paddingBottom: bottom + 50 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerSide}>
                <Pressable
                  onPress={handleDismiss}
                  hitSlop={HIT_SLOP.md}
                  style={styles.cancelButton}
                  accessibilityRole={'button'}
                  accessibilityLabel={t('colorPicker.cancel')}>
                  <CloseIcon width={SIZE.icon.md} height={SIZE.icon.md} color={COLORS.icon.primary} />
                </Pressable>
              </View>
              <Text style={styles.modalTitle}>{t('colorPicker.title')}</Text>
              <View style={[styles.headerSide, styles.headerSideRight]}>
                <Pressable
                  onPress={handleDone}
                  hitSlop={HIT_SLOP.md}
                  style={styles.saveButton}
                  accessibilityRole={'button'}
                  accessibilityLabel={t('colorPicker.done')}>
                  <CheckIcon width={SIZE.icon.md} height={SIZE.icon.md} color={COLORS.modal.saveText} />
                </Pressable>
              </View>
            </View>

            <View style={styles.previewContainer}>
              <CountdownBar previewColor={selectedColor} previewProgress={65} scale={2.5} />
            </View>

            <ColorPicker value={selectedColor} onChangeJS={handleColorPreview} style={styles.colorPicker}>
              <Panel1 style={[styles.panel, { direction: pickerDirection }]} />
              <HueSlider style={[styles.hueSlider, { direction: pickerDirection }]} />
              <Swatches colors={[...COLOR_PICKER_SWATCHES]} style={styles.swatches} />
              <Swatches colors={[...COLOR_PICKER_SWATCHES_2]} style={styles.swatches} />
            </ColorPicker>
          </View>
        </View>
      </Modal>
    </>
  );
}

const ty = typographyFor(currentLocaleId());

// The card face the reset row sits on: the settings card wash rgba(99, 102, 241, 0.06) flattened over
// the sheet, rgb(16, 29, 69). The hidden reset paints this face, because Android paints alpha-0 ink black
const RESET_HIDDEN_INK = '#101d45';

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // --- Main Container ---
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.smd,
  },

  // --- Label Styles ---
  label: {
    color: COLORS.text.primary,
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
  },
  labelDisabled: {
    // The old label colour under the removed 0.25 container, flattened over the sheet
    color: '#21365a',
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
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.sizeDetail),
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
  // The swatch is text-free, so it keeps the old 0.25 dim here and its pixels hold
  previewDim: {
    opacity: 0.25,
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
    lineHeight: SIZE.icon.md,
    // The codepoint carries the direction (chevronFor); Android mirrors a lone neutral
    // glyph inside an RTL paragraph, so the paragraph itself stays LTR
    direction: 'ltr',
  },
  chevronDisabled: {
    // The old icon ink under the removed 0.25 container, flattened over the sheet
    color: '#323f6b',
  },

  // --- Modal Container ---
  modalOverlay: {
    flex: 1,
    // The sheets' own dim, alpha on the colour so the content above stays opaque
    backgroundColor: COLORS.surface.backdropDim,
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
    fontFamily: ty.familyMedium,
    fontSize: ty.size(TEXT.size),
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
