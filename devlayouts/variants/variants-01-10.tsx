/**
 * Fasting layout variants 1-10 (T-623): the radio family, the checkmark
 * family and the first track. Dev-only, first-frame settled, catalog strings
 * only. Every component owns its draft with useFastingDraft and writes
 * nothing outside itself.
 */

import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { FASTING_MODES } from '@/shared/fasting';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { CheckGlyph, HintChip, ModeGlyph, modeHint, modeLabel, RADIO_ROLE, RadioDot, useFastingDraft } from '../parts';

const ty = typographyFor(currentLocaleId());

// =============================================================================
// 1. ALIGNED RADIO ROWS - the shipped list on a fixed grid: equal row
//    heights, one hint line each, radios hung on one right-hand axis
// =============================================================================

const VariantAlignedRadioRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v1.card}>
      <Text style={v1.title}>{t('fasting.card.title')}</Text>
      {FASTING_MODES.map((mode) => (
        <Pressable
          key={mode}
          style={v1.row}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={RADIO_ROLE}
          accessibilityState={{ selected: selection.mode === mode }}
          accessibilityLabel={modeLabel(mode)}
          onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
          <View style={v1.text}>
            <Text style={v1.label}>{modeLabel(mode)}</Text>
            <Text style={v1.hint} numberOfLines={1}>
              {modeHint(mode)}
            </Text>
          </View>
          <RadioDot on={selection.mode === mode} />
        </Pressable>
      ))}
    </View>
  );
};

// =============================================================================
// 2. RADIO + HINT CHIP - labels alone in the rows; the selected mode's
//    explanation drops to a single caption chip under the list
// =============================================================================

const VariantRadioSelectedHintChip = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v2.wrap}>
      {FASTING_MODES.map((mode) => (
        <Pressable
          key={mode}
          style={v2.row}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={RADIO_ROLE}
          accessibilityState={{ selected: selection.mode === mode }}
          accessibilityLabel={modeLabel(mode)}
          onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
          <Text style={[v2.label, selection.mode === mode ? v2.labelOn : null]}>{modeLabel(mode)}</Text>
          <RadioDot on={selection.mode === mode} />
        </Pressable>
      ))}
      <HintChip mode={selection.mode} />
    </View>
  );
};

// =============================================================================
// 3. RADIO CARD ROWS - each mode its own bordered card, radio pinned to the
//    card's trailing edge, no hint lines anywhere
// =============================================================================

const VariantRadioCardRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v3.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v3.card, on ? v3.cardOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={v3.label}>{modeLabel(mode)}</Text>
            <RadioDot on={on} />
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 4. RADIO TWO-COLUMN GRID - four square tiles in a 2x2 grid, radio dot in
//    the tile's corner, label centered
// =============================================================================

const VariantRadioTwoColumnGrid = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v4.grid}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v4.tile, on ? v4.tileOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={v4.corner}>
              <RadioDot on={on} />
            </View>
            <Text style={v4.label}>{modeLabel(mode)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 5. RADIO LEADING-ICON ROWS - geometric mode glyphs lead the rows, labels
//    only, radios trail
// =============================================================================

const VariantRadioLeadingIconRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v5.wrap}>
      {FASTING_MODES.map((mode) => (
        <Pressable
          key={mode}
          style={v5.row}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={RADIO_ROLE}
          accessibilityState={{ selected: selection.mode === mode }}
          accessibilityLabel={modeLabel(mode)}
          onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
          <View style={v5.glyphHolder}>
            <ModeGlyph mode={mode} ink={COLORS.text.primary} />
          </View>
          <Text style={v5.label}>{modeLabel(mode)}</Text>
          <RadioDot on={selection.mode === mode} />
        </Pressable>
      ))}
    </View>
  );
};

// =============================================================================
// 6. CHECKMARK ROWS - the radio becomes a drawn check; hairline separators,
//    tight rows, no explanations
// =============================================================================

const VariantCheckmarkRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v6.wrap}>
      {FASTING_MODES.map((mode) => (
        <Pressable
          key={mode}
          style={v6.row}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={RADIO_ROLE}
          accessibilityState={{ selected: selection.mode === mode }}
          accessibilityLabel={modeLabel(mode)}
          onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
          <Text style={v6.label}>{modeLabel(mode)}</Text>
          <CheckGlyph on={selection.mode === mode} />
        </Pressable>
      ))}
    </View>
  );
};

// =============================================================================
// 7. CHECKMARK + HINT FOOTER - checkmark rows with the selected mode's
//    explanation parked in a footer strip under the list
// =============================================================================

const VariantCheckmarkHintFooter = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v7.wrap}>
      <View style={v7.list}>
        {FASTING_MODES.map((mode) => (
          <Pressable
            key={mode}
            style={v7.row}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: selection.mode === mode }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={v7.label}>{modeLabel(mode)}</Text>
            <CheckGlyph on={selection.mode === mode} />
          </Pressable>
        ))}
      </View>
      <View style={v7.footer}>
        <HintChip mode={selection.mode} />
      </View>
    </View>
  );
};

// =============================================================================
// 8. CHECKMARK SELECTED EXPANDS - rows sit on one line until chosen; the
//    chosen row grows its own explanation beneath its label
// =============================================================================

const VariantCheckmarkSelectedExpands = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v8.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={v8.row}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={v8.text}>
              <Text style={v8.label}>{modeLabel(mode)}</Text>
              {on && <Text style={v8.hint}>{modeHint(mode)}</Text>}
            </View>
            <CheckGlyph on={on} />
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 9. CHECKMARK PILL FLOW - wrapping chips with leading checks; the chosen
//    chip's explanation reads as one caption line under the flow
// =============================================================================

const VariantCheckmarkPillFlow = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v9.wrap}>
      <View style={v9.flow}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={[v9.chip, on ? v9.chipOn : null]}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <CheckGlyph on={on} />
              <Text style={[v9.chipLabel, on ? v9.chipLabelOn : null]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={v9.caption}>{modeHint(selection.mode)}</Text>
    </View>
  );
};

// =============================================================================
// 10. SEGMENTED ICON TRACK - the sound-mode control's own shape at four
//     stops: one track, one pill, glyphs over labels
// =============================================================================

const VariantSegmentedIconTrack = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v10.track}>
      <View style={[v10.pill, { transform: [{ translateX: `${selected * 100}%` }] }]} />
      <View style={v10.segments}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v10.segment}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <ModeGlyph mode={mode} ink={on ? COLORS.text.primary : COLORS.text.sheetSubtitle} />
              <Text style={[v10.segmentLabel, on ? v10.segmentLabelOn : null]} numberOfLines={1} adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const VARIANTS_01_10: Record<string, () => ReactElement> = {
  'aligned-radio-rows': VariantAlignedRadioRows,
  'radio-selected-hint-chip': VariantRadioSelectedHintChip,
  'radio-card-rows': VariantRadioCardRows,
  'radio-two-column-grid': VariantRadioTwoColumnGrid,
  'radio-leading-icon-rows': VariantRadioLeadingIconRows,
  'checkmark-rows': VariantCheckmarkRows,
  'checkmark-hint-footer': VariantCheckmarkHintFooter,
  'checkmark-selected-expands': VariantCheckmarkSelectedExpands,
  'checkmark-pill-flow': VariantCheckmarkPillFlow,
  'segmented-icon-track': VariantSegmentedIconTrack,
};

// =============================================================================
// VARIANT 1 STYLES
// =============================================================================

const v1 = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  title: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  hint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 2 STYLES
// =============================================================================

const v2 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  label: {
    flexShrink: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  labelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 3 STYLES
// =============================================================================

const v3 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  cardOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 4 STYLES
// =============================================================================

const v4 = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    aspectRatio: 1.6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    padding: SPACING.sm,
  },
  tileOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  corner: {
    alignSelf: 'flex-end',
  },
  label: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 5 STYLES
// =============================================================================

const v5 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  glyphHolder: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 6 STYLES
// =============================================================================

const v6 = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 7 STYLES
// =============================================================================

const v7 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  list: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    minHeight: 42,
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
  footer: {
    paddingTop: SPACING.xs,
  },
});

// =============================================================================
// VARIANT 8 STYLES
// =============================================================================

const v8 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 40,
    paddingVertical: SPACING.py,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  hint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 9 STYLES
// =============================================================================

const v9 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  chipLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  chipLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  caption: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 10 STYLES
// =============================================================================

const v10 = StyleSheet.create({
  track: {
    height: 68,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    padding: 3,
  },
  pill: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    width: '25%',
    borderRadius: RADIUS.xl - 3,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.quart,
  },
  segmentLabel: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    maxWidth: '92%',
  },
  segmentLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});
