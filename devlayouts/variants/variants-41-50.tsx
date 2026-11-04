/**
 * Fasting layout variants 41-50 (T-623): the mosaic, the state and edge
 * rows, the fill cards, the table and inset list, the split list, the dial,
 * the badge scroller and the hint-hero cards. Dev-only, first-frame settled,
 * catalog strings only. Every component owns its draft with useFastingDraft
 * and writes nothing outside itself.
 */

import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { FASTING_MODES } from '@/shared/fasting';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import { modeHint, modeLabel, RADIO_ROLE, useFastingDraft } from '../parts';

const ty = typographyFor(currentLocaleId());

// =============================================================================
// 41. MOSAIC SELECTED LARGE - the selected mode renders as the large tile,
//     the other three shrink to small tiles; taps swap which is large
// =============================================================================

const VariantMosaicSelectedLarge = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v41.grid}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v41.tile, on ? v41.tileLarge : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v41.tileLabel, on ? v41.tileLabelLarge : null]} numberOfLines={1} adjustsFontSizeToFit>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 42. STATE DOT ROWS - rows led by a status dot, filled for the selected
//     rhythm, hollow otherwise
// =============================================================================

const VariantStateDotRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v42.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={v42.row}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={[v42.statusDot, on ? v42.statusDotOn : null]} />
            <Text style={[v42.label, on ? v42.labelOn : null]}>{modeLabel(mode)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 43. OUTLINE FILL CARDS - the selected card filled with the indigo wash and
//     the primary border, the others plain outline cards
// =============================================================================

const VariantOutlineFillCards = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v43.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v43.card, on ? v43.cardFilled : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v43.cardLabel, on ? v43.cardLabelOn : null]}>{modeLabel(mode)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 44. EDGE BAR ROWS - rows carrying a left accent bar on the selected row
//     only; strict alignment, single-line labels
// =============================================================================

const VariantEdgeBarRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v44.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v44.row, on ? v44.rowSelected : null]}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v44.label, on ? v44.labelOn : null]} numberOfLines={1}>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 45. TABLE FOOTER SUMMARY - the divider table of modes, the footer line
//     showing the selected mode's explanation
// =============================================================================

const VariantTableFooterSummary = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v45.table}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        const last = mode === FASTING_MODES[FASTING_MODES.length - 1];
        return (
          <Pressable
            key={mode}
            style={[v45.row, last ? null : v45.rowSeparated]}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v45.label, on ? v45.labelOn : null]}>{modeLabel(mode)}</Text>
          </Pressable>
        );
      })}
      <View style={v45.footer}>
        <Text style={v45.footerText} numberOfLines={2}>
          {modeHint(selection.mode)}
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// 46. INSET GROUPED LIST - the settings-style inset grouped list: rounded
//     container, separated rows, each row label over a tight one-line hint
// =============================================================================

const VariantInsetGroupedList = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v46.group}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        const last = mode === FASTING_MODES[FASTING_MODES.length - 1];
        return (
          <Pressable
            key={mode}
            style={[v46.row, last ? null : v46.rowSeparated]}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v46.label, on ? v46.labelOn : null]}>{modeLabel(mode)}</Text>
            <Text style={v46.hint} numberOfLines={1}>
              {modeHint(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 47. SPLIT LIST STATES - two-column rows, the mode label left and the state
//     word right
// =============================================================================

const VariantSplitListStates = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v47.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={v47.row}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={v47.label}>{modeLabel(mode)}</Text>
            <Text style={[v47.state, on ? v47.stateOn : null]}>
              {on ? t('fasting.state.on') : t('fasting.state.off')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 48. DIAL FOUR POINTS - a square dial area with the four modes on a circle,
//     the selected point filled and labeled, a thin bordered ring connecting
//     them
// =============================================================================

const DIAL_POSITION_KEYS = ['top', 'right', 'bottom', 'left'] as const;

const VariantDialFourPoints = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v48.dial}>
      <View style={v48.ring} />
      {FASTING_MODES.map((mode, position) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v48.point, v48[DIAL_POSITION_KEYS[position]]]}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={[v48.pointDot, on ? v48.pointDotOn : null]} />
            {on && (
              <Text style={v48.pointLabel} numberOfLines={1} adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 49. BADGE SCROLLER - one horizontal line of mode badges, the selected
//     badge elevated and slightly larger
// =============================================================================

const VariantBadgeScroller = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v49.line}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v49.badge, on ? v49.badgeOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v49.badgeText, on ? v49.badgeTextOn : null]} numberOfLines={1}>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 50. HINT HERO CARDS - inverted hierarchy: the hint is the hero line and
//     the mode label sits above it as a small eyebrow; airy spacing, no
//     radios, no checks, the selection shown by the card border alone
// =============================================================================

const VariantHintHeroCards = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v50.wrap}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v50.card, on ? v50.cardOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={v50.eyebrow}>{modeLabel(mode)}</Text>
            <Text style={v50.hero}>{modeHint(mode)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const VARIANTS_41_50: Record<string, () => ReactElement> = {
  'mosaic-selected-large': VariantMosaicSelectedLarge,
  'state-dot-rows': VariantStateDotRows,
  'outline-fill-cards': VariantOutlineFillCards,
  'edge-bar-rows': VariantEdgeBarRows,
  'table-footer-summary': VariantTableFooterSummary,
  'inset-grouped-list': VariantInsetGroupedList,
  'split-list-states': VariantSplitListStates,
  'dial-four-points': VariantDialFourPoints,
  'badge-scroller': VariantBadgeScroller,
  'hint-hero-cards': VariantHintHeroCards,
};

// =============================================================================
// VARIANT 41 STYLES
// =============================================================================

const v41 = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    aspectRatio: 1.2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  tileLarge: {
    flexGrow: 2,
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  tileLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    maxWidth: '100%',
    textAlign: 'center',
  },
  tileLabelLarge: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 42 STYLES
// =============================================================================

const v42 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 44,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  statusDotOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.text.primary,
  },
  label: {
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
// VARIANT 43 STYLES
// =============================================================================

const v43 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  card: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  cardFilled: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  cardLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  cardLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 44 STYLES
// =============================================================================

const v44 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  rowSelected: {
    borderLeftColor: COLORS.text.primary,
  },
  label: {
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
// VARIANT 45 STYLES
// =============================================================================

const v45 = StyleSheet.create({
  table: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  rowSeparated: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  labelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.smd,
  },
  footerText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 46 STYLES
// =============================================================================

const v46 = StyleSheet.create({
  group: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  rowSeparated: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  label: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  labelOn: {
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
// VARIANT 47 STYLES
// =============================================================================

const v47 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  label: {
    flexShrink: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.primary,
  },
  state: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  stateOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 48 STYLES
// =============================================================================

const v48 = StyleSheet.create({
  dial: {
    aspectRatio: 1,
    alignSelf: 'stretch',
  },
  ring: {
    position: 'absolute',
    top: '14%',
    bottom: '14%',
    left: '14%',
    right: '14%',
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  point: {
    position: 'absolute',
    width: 90,
    alignItems: 'center',
    gap: SPACING.quart,
  },
  top: {
    top: 0,
    left: '50%',
    marginLeft: -45,
  },
  right: {
    right: 0,
    top: '50%',
    marginTop: -30,
  },
  bottom: {
    bottom: 0,
    left: '50%',
    marginLeft: -45,
  },
  left: {
    left: 0,
    top: '50%',
    marginTop: -30,
  },
  pointDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  pointDotOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.text.primary,
  },
  pointLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    maxWidth: '100%',
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 49 STYLES
// =============================================================================

const v49 = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  badgeOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    transform: [{ scale: 1.08 }],
  },
  badgeText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  badgeTextOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 50 STYLES
// =============================================================================

const v50 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    gap: SPACING.smd,
  },
  cardOn: {
    borderColor: COLORS.text.primary,
  },
  eyebrow: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  hero: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.primary,
  },
});
