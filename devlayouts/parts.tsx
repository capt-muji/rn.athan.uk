/**
 * Shared drawing primitives for the fasting layout variants (T-623).
 *
 * Dev-only: nothing shipped imports here; the harness route gates on
 * __DEV__. Visible strings come from the fasting catalog keys through the
 * helpers below; harness chrome keeps its literals hoisted as code values so
 * the string scanner reads them as code. Every variant is first-frame
 * settled: mount renders the settled frame, only value changes move anything.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { type TranslationKey, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { FastingMode, FastingSelection } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

const MODE_LABEL_KEYS: Record<FastingMode, TranslationKey> = {
  everyDay: 'fasting.mode.everyDay',
  muhammad: 'fasting.mode.muhammad',
  dawood: 'fasting.mode.dawood',
  whiteDays: 'fasting.mode.whiteDays',
};

const MODE_HINT_KEYS: Record<FastingMode, TranslationKey> = {
  everyDay: 'fasting.mode.everyDayHint',
  muhammad: 'fasting.mode.muhammadHint',
  dawood: 'fasting.mode.dawoodHint',
  whiteDays: 'fasting.mode.whiteDaysHint',
};

/** The selection every variant opens with: the add-on surfaces where a structure offers it */
export const DEFAULT_SELECTION: FastingSelection = { mode: 'muhammad', whiteDaysAddOn: true };

/** Shared selection state so every variant reads the same draft shape the sheet commits */
export const useFastingDraft = (): [FastingSelection, (next: FastingSelection) => void] =>
  useState<FastingSelection>(DEFAULT_SELECTION);

export const modeLabel = (mode: FastingMode): string => t(MODE_LABEL_KEYS[mode]);

export const modeHint = (mode: FastingMode): string => t(MODE_HINT_KEYS[mode]);

/** The picker's accessibility role, a code value for the string scanner */
export const RADIO_ROLE = 'radio';

/** The disclosure and stepper controls' accessibility role, a code value for the string scanner */
export const BUTTON_ROLE = 'button';

/** The house radio: the shipped picker's own circle, reused for alignment comparisons */
export const RadioDot = ({ on }: { on: boolean }) => <View style={[styles.radio, on ? styles.radioOn : null]} />;

/** A drawn checkmark: two rotated bars inside a box, no glyph dependency */
export const CheckGlyph = ({ on }: { on: boolean }) => (
  <View style={[styles.checkBox, on ? styles.checkBoxOn : null]}>
    {on && (
      <View style={styles.checkMark}>
        <View style={[styles.checkTail, styles.ink]} />
        <View style={[styles.checkStem, styles.ink]} />
      </View>
    )}
  </View>
);

/**
 * Geometric mode glyphs, foreground-ink only so they read on any surface:
 * every day a disc, Muhammad a ring, Dawood alternating bars, the white days
 * three dots.
 */
export const ModeGlyph = ({ mode, ink }: { mode: FastingMode; ink: string }) => {
  switch (mode) {
    case 'everyDay':
      return <View style={[styles.glyphDisc, { backgroundColor: ink }]} />;
    case 'muhammad':
      return <View style={[styles.glyphRing, { borderColor: ink }]} />;
    case 'dawood':
      return (
        <View style={styles.glyphBars}>
          <View style={[styles.glyphBar, { backgroundColor: ink }]} />
          <View style={[styles.glyphBar, { backgroundColor: ink, opacity: 0.45 }]} />
        </View>
      );
    case 'whiteDays':
      return (
        <View style={styles.glyphDots}>
          <View style={[styles.glyphDot, { backgroundColor: ink }]} />
          <View style={[styles.glyphDot, { backgroundColor: ink }]} />
          <View style={[styles.glyphDot, { backgroundColor: ink }]} />
        </View>
      );
  }
};

/** The selected mode's explanation in one bordered caption chip */
export const HintChip = ({ mode }: { mode: FastingMode }) => (
  <View style={styles.hintChip}>
    <Text style={styles.hintChipText}>{modeHint(mode)}</Text>
  </View>
);

/** The tooltip bubble: one mode's explanation in a box beside its row, border-left first */
export const HintBubble = ({ mode }: { mode: FastingMode }) => (
  <View style={styles.hintBubble}>
    <Text style={styles.hintBubbleText}>{modeHint(mode)}</Text>
  </View>
);

/** A rotated-bar chevron for the disclosure families, no glyph dependency */
const CHEVRON_ROTATION: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: '-135deg',
  down: '45deg',
  left: '-45deg',
  right: '135deg',
};

export const Chevron = ({ direction, ink }: { direction: 'up' | 'down' | 'left' | 'right'; ink?: string }) => (
  <View
    style={[
      styles.chevron,
      ink ? { borderLeftColor: ink, borderBottomColor: ink } : null,
      { transform: [{ rotate: CHEVRON_ROTATION[direction] }] },
    ]}
  />
);

/** The house chip: one rounded outline that fills when its option is selected */
export const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable
    style={[styles.chip, on ? styles.chipOn : null]}
    onPress={onPress}
    hitSlop={HIT_SLOP.md}
    accessibilityRole={RADIO_ROLE}
    accessibilityState={{ selected: on }}
    accessibilityLabel={label}>
    <Text style={[styles.chipText, on ? styles.chipTextOn : null]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  radioOn: {
    borderColor: COLORS.text.primary,
    borderWidth: 6,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  checkBoxOn: {
    borderColor: COLORS.text.primary,
  },
  checkMark: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 13,
    height: 13,
  },
  ink: {
    backgroundColor: COLORS.text.primary,
  },
  checkTail: {
    position: 'absolute',
    left: 1,
    bottom: 1,
    width: 2.5,
    height: 6,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkStem: {
    position: 'absolute',
    left: 5,
    bottom: 2,
    width: 2.5,
    height: 12,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  glyphDisc: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  glyphRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
  },
  glyphBars: {
    flexDirection: 'row',
    gap: 4,
  },
  glyphBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  glyphDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  glyphDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  hintChip: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
  },
  hintChipText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
  hintBubble: {
    marginTop: SPACING.quart,
    marginLeft: SPACING.lg,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.py,
  },
  hintBubbleText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.text.sheetSubtitle,
  },
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
  },
  chipOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  chipText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  chipTextOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});
