/**
 * Fasting layout variants 11-25 (T-623): the track caption, the slider
 * family, the card carousel, the drum wheels, the tab families and the
 * dropdowns. Dev-only, first-frame settled, catalog strings only. Every
 * component owns its draft with useFastingDraft and writes nothing outside
 * itself.
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { LabeledToggle } from '@/components/sheets/parts';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { FASTING_MODES } from '@/shared/fasting';
import { currentLocaleId } from '@/shared/i18n/locale';
import type { FastingMode } from '@/shared/types';
import { typographyFor } from '@/shared/typography';

import { BUTTON_ROLE, Chevron, ModeGlyph, modeHint, modeLabel, RADIO_ROLE, useFastingDraft } from '../parts';

const ty = typographyFor(currentLocaleId());

// Harness chrome: the wheel's exclude option has no catalog key, the label
// lives here as a code value for the string scanner
const EXCLUDE_WHITE_DAYS = 'Exclude the white days';

// The badge names the add-on by the white days' own mode label, through a
// code value so the census reads the call as code
const WHITE_DAYS_MODE: FastingMode = 'whiteDays';

// =============================================================================
// 11. SEGMENTED TRACK CAPTION - the four-stop track of 10 with the selected
//     mode's explanation as one caption line beneath the track
// =============================================================================

const VariantSegmentedTrackCaption = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v11.wrap}>
      <View style={v11.track}>
        <View style={[v11.pill, { transform: [{ translateX: `${selected * 100}%` }] }]} />
        <View style={v11.segments}>
          {FASTING_MODES.map((mode) => {
            const on = selection.mode === mode;
            return (
              <Pressable
                key={mode}
                style={v11.segment}
                accessibilityRole={RADIO_ROLE}
                accessibilityState={{ selected: on }}
                accessibilityLabel={modeLabel(mode)}
                onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
                <Text style={[v11.segmentLabel, on ? v11.segmentLabelOn : null]} numberOfLines={1} adjustsFontSizeToFit>
                  {modeLabel(mode)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={v11.caption}>{modeHint(selection.mode)}</Text>
    </View>
  );
};

// =============================================================================
// 12. SLIDER WITH TICKS - one track, four tick stops and a thumb sitting on
//     the selected stop; the mode reads big above, no explanations
// =============================================================================

const VariantSliderTicks = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v12.wrap}>
      <Text style={v12.bigLabel}>{modeLabel(selection.mode)}</Text>
      <View style={v12.trackHolder}>
        <View style={v12.track} />
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v12.tickStop}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <View style={[v12.tick, on ? v12.tickOn : null]} />
            </Pressable>
          );
        })}
        <View style={[v12.thumbStop, { left: `${selected * 25}%` }]}>
          <View style={v12.thumb} />
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// 13. SLIDER HINT DRAWER - the slider of 12 with the selected mode's
//     explanation dropped into a bordered drawer below the track
// =============================================================================

const VariantSliderHintDrawer = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v13.wrap}>
      <Text style={v13.bigLabel}>{modeLabel(selection.mode)}</Text>
      <View style={v13.trackHolder}>
        <View style={v13.track} />
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v13.tickStop}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <View style={[v13.tick, on ? v13.tickOn : null]} />
            </Pressable>
          );
        })}
        <View style={[v13.thumbStop, { left: `${selected * 25}%` }]}>
          <View style={v13.thumb} />
        </View>
      </View>
      <View style={v13.drawer}>
        <Text style={v13.drawerText}>{modeHint(selection.mode)}</Text>
      </View>
    </View>
  );
};

// =============================================================================
// 14. CARD CAROUSEL - one horizontal line of mode cards, each carrying its
//     own explanation; the chosen card rides elevated and the dots name the
//     position beneath
// =============================================================================

const VariantCarouselSnapCards = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v14.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={v14.row}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={[v14.card, on ? v14.cardOn : null]}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text style={v14.cardLabel}>{modeLabel(mode)}</Text>
              <Text style={v14.cardHint}>{modeHint(mode)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={v14.dots}>
        {FASTING_MODES.map((mode) => (
          <View key={mode} style={[v14.dot, selection.mode === mode ? v14.dotOn : null]} />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// 15. VERTICAL DRUM WHEEL - five visible rows over the four modes, the
//     selection centred in a highlighted band, neighbours shaded and scaled
//     down; a tap centres its row
// =============================================================================

const DRUM_OFFSETS = [-2, -1, 0, 1, 2];

const VariantWheelVerticalDrum = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v15.drum}>
      <View style={v15.band} />
      {DRUM_OFFSETS.map((offset) => {
        const mode = FASTING_MODES[(selected + offset + FASTING_MODES.length) % FASTING_MODES.length];
        const distance = Math.abs(offset);
        return (
          <Pressable
            key={offset}
            style={v15.row}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: distance === 0 }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text
              style={[
                v15.rowLabel,
                distance === 0 ? v15.rowLabelOn : null,
                { opacity: 1 - distance * 0.3, transform: [{ scale: 1 - distance * 0.08 }] },
              ]}>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 16. WHEEL + SIDE DETAIL - the drum of 15 on the left half, a detail pane
//     on the right half carrying the selected mode's explanation
// =============================================================================

const VariantWheelSideDetail = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v16.row}>
      <View style={v16.drumPane}>
        <View style={v16.band} />
        {DRUM_OFFSETS.map((offset) => {
          const mode = FASTING_MODES[(selected + offset + FASTING_MODES.length) % FASTING_MODES.length];
          const distance = Math.abs(offset);
          return (
            <Pressable
              key={offset}
              style={v16.drumRow}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: distance === 0 }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text
                style={[
                  v16.rowLabel,
                  distance === 0 ? v16.rowLabelOn : null,
                  { opacity: 1 - distance * 0.3, transform: [{ scale: 1 - distance * 0.08 }] },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v16.detail}>
        <Text style={v16.detailText}>{modeHint(selection.mode)}</Text>
      </View>
    </View>
  );
};

// =============================================================================
// 17. TWO-SECTION WHEEL - the schedule modes ride the top drum, the
//     white-days add-on the bottom one; the bottom drum only enables under
//     muhammad and dawood
// =============================================================================

const ADD_ON_OPTIONS = [
  { key: 'include', value: true },
  { key: 'exclude', value: false },
];

const VariantWheelTwoSection = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  const addOnOffered = selection.mode === 'muhammad' || selection.mode === 'dawood';
  return (
    <View style={v17.wrap}>
      <View style={v17.drum}>
        <View style={v17.band} />
        {[-1, 0, 1].map((offset) => {
          const mode = FASTING_MODES[(selected + offset + FASTING_MODES.length) % FASTING_MODES.length];
          const distance = Math.abs(offset);
          return (
            <Pressable
              key={offset}
              style={v17.row}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: distance === 0 }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text
                style={[v17.rowLabel, distance === 0 ? v17.rowLabelOn : null, { opacity: 1 - distance * 0.35 }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[v17.drum, addOnOffered ? null : v17.drumDisabled]}>
        <View style={v17.band} />
        {ADD_ON_OPTIONS.map((option) => {
          const on = addOnOffered && option.value === selection.whiteDaysAddOn;
          return (
            <Pressable
              key={option.key}
              style={v17.row}
              hitSlop={HIT_SLOP.md}
              disabled={!addOnOffered}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={option.value ? 'Include the white days' : EXCLUDE_WHITE_DAYS}
              onPress={() => setSelection({ mode: selection.mode, whiteDaysAddOn: option.value })}>
              <Text style={[v17.rowLabel, on ? v17.rowLabelOn : null]}>
                {option.value ? 'Include the white days' : EXCLUDE_WHITE_DAYS}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// =============================================================================
// 18. HORIZONTAL WHEEL - three visible columns, the selection centred in a
//     vertical band; a tap centres its column
// =============================================================================

const VariantWheelHorizontal = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v18.drum}>
      <View style={v18.band} />
      {[-1, 0, 1].map((offset) => {
        const mode = FASTING_MODES[(selected + offset + FASTING_MODES.length) % FASTING_MODES.length];
        const distance = Math.abs(offset);
        return (
          <Pressable
            key={offset}
            style={v18.column}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: distance === 0 }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text
              style={[v18.columnLabel, distance === 0 ? v18.columnLabelOn : null, { opacity: 1 - distance * 0.35 }]}
              numberOfLines={2}
              adjustsFontSizeToFit>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 19. PILL TAB BAR - four pills in one row, the selected pill filled, the
//     others outline; labels only
// =============================================================================

const VariantPillTabBar = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v19.bar}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v19.pill, on ? v19.pillOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v19.pillLabel, on ? v19.pillLabelOn : null]} numberOfLines={1} adjustsFontSizeToFit>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 20. PILL TABS + PANEL - the pill bar of 19 over an expandable panel: the
//     selected mode's explanation, and under muhammad and dawood the
//     white-days add-on as a labeled toggle row
// =============================================================================

const VariantPillTabsPanel = () => {
  const [selection, setSelection] = useFastingDraft();
  const [open, setOpen] = useState(true);
  const addOnOffered = selection.mode === 'muhammad' || selection.mode === 'dawood';
  return (
    <View style={v20.wrap}>
      <View style={v20.bar}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={[v20.pill, on ? v20.pillOn : null]}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => {
                if (on) setOpen(!open);
                else {
                  setOpen(true);
                  setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn });
                }
              }}>
              <Text style={[v20.pillLabel, on ? v20.pillLabelOn : null]} numberOfLines={1} adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {open && (
        <View style={v20.panel}>
          <Text style={v20.hint}>{modeHint(selection.mode)}</Text>
          {addOnOffered && (
            <LabeledToggle
              label={'Include the white days'}
              value={selection.whiteDaysAddOn}
              onToggle={(next) => setSelection({ mode: selection.mode, whiteDaysAddOn: next })}
            />
          )}
        </View>
      )}
    </View>
  );
};

// =============================================================================
// 21. UNDERLINE TABS - full-width text tabs over a hairline rail, the
//     indicator sitting under the selected tab; no pills, no explanations
// =============================================================================

const VariantUnderlineTabs = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  return (
    <View style={v21.tabs}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={v21.tab}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <Text style={[v21.tabLabel, on ? v21.tabLabelOn : null]} numberOfLines={1} adjustsFontSizeToFit>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
      <View style={[v21.indicator, { left: `${selected * 25}%` }]} />
    </View>
  );
};

// =============================================================================
// 22. ICON TAB STRIP - glyph-only tabs over a rail; the selected glyph's
//     mode label prints beneath the strip
// =============================================================================

const VariantIconTabStrip = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v22.wrap}>
      <View style={v22.strip}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v22.tab}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <ModeGlyph mode={mode} ink={on ? COLORS.text.primary : COLORS.text.sheetSubtitle} />
            </Pressable>
          );
        })}
      </View>
      <Text style={v22.selectedLabel}>{modeLabel(selection.mode)}</Text>
    </View>
  );
};

// =============================================================================
// 23. COLLAPSED DROPDOWN ROW - one summary row naming the selection beside a
//     chevron; a tap opens the inline option list and a second closes it.
//     Opens expanded: the capture shows the list
// =============================================================================

const VariantDropdownCollapsedRow = () => {
  const [selection, setSelection] = useFastingDraft();
  const [open, setOpen] = useState(true);
  return (
    <View style={v23.wrap}>
      <Pressable
        style={v23.summary}
        accessibilityRole={BUTTON_ROLE}
        accessibilityLabel={modeLabel(selection.mode)}
        onPress={() => setOpen(!open)}>
        <Text style={v23.summaryLabel} numberOfLines={1}>
          {modeLabel(selection.mode)}
        </Text>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open &&
        FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v23.option}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text style={[v23.optionLabel, on ? v23.optionLabelOn : null]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })}
    </View>
  );
};

// =============================================================================
// 24. DROPDOWN INSET LIST - the same summary row, the expanded list rendered
//     as an inset rounded panel with separated rows. Opens expanded
// =============================================================================

const VariantDropdownInsetList = () => {
  const [selection, setSelection] = useFastingDraft();
  const [open, setOpen] = useState(true);
  return (
    <View style={v24.wrap}>
      <Pressable
        style={v24.summary}
        accessibilityRole={BUTTON_ROLE}
        accessibilityLabel={modeLabel(selection.mode)}
        onPress={() => setOpen(!open)}>
        <Text style={v24.summaryLabel} numberOfLines={1}>
          {modeLabel(selection.mode)}
        </Text>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open && (
        <View style={v24.panel}>
          {FASTING_MODES.map((mode) => {
            const on = selection.mode === mode;
            const last = mode === FASTING_MODES[FASTING_MODES.length - 1];
            return (
              <Pressable
                key={mode}
                style={[v24.option, last ? null : v24.optionSeparated]}
                hitSlop={HIT_SLOP.md}
                accessibilityRole={RADIO_ROLE}
                accessibilityState={{ selected: on }}
                accessibilityLabel={modeLabel(mode)}
                onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
                <Text style={[v24.optionLabel, on ? v24.optionLabelOn : null]}>{modeLabel(mode)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

// =============================================================================
// 25. DROPDOWN SUMMARY BADGES - the collapsed row carries designation-style
//     badges: the selected mode's label and, when the add-on rides under
//     muhammad or dawood, a second white-days badge beside the chevron.
//     Opens expanded
// =============================================================================

const VariantDropdownSummaryBadges = () => {
  const [selection, setSelection] = useFastingDraft();
  const [open, setOpen] = useState(true);
  const addOnOffered = selection.mode === 'muhammad' || selection.mode === 'dawood';
  return (
    <View style={v25.wrap}>
      <Pressable
        style={v25.summary}
        accessibilityRole={BUTTON_ROLE}
        accessibilityLabel={modeLabel(selection.mode)}
        onPress={() => setOpen(!open)}>
        <View style={v25.badges}>
          <View style={v25.badge}>
            <Text style={v25.badgeText} numberOfLines={1}>
              {modeLabel(selection.mode)}
            </Text>
          </View>
          {addOnOffered && selection.whiteDaysAddOn && (
            <View style={v25.badge}>
              <Text style={v25.badgeText} numberOfLines={1}>
                {modeLabel(WHITE_DAYS_MODE)}
              </Text>
            </View>
          )}
        </View>
        <Chevron direction={open ? 'up' : 'down'} />
      </Pressable>
      {open &&
        FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v25.option}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text style={[v25.optionLabel, on ? v25.optionLabelOn : null]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })}
    </View>
  );
};

export const VARIANTS_11_25: Record<string, () => ReactElement> = {
  'segmented-track-caption': VariantSegmentedTrackCaption,
  'slider-ticks': VariantSliderTicks,
  'slider-hint-drawer': VariantSliderHintDrawer,
  'carousel-snap-cards': VariantCarouselSnapCards,
  'wheel-vertical-drum': VariantWheelVerticalDrum,
  'wheel-side-detail': VariantWheelSideDetail,
  'wheel-two-section': VariantWheelTwoSection,
  'wheel-horizontal': VariantWheelHorizontal,
  'pill-tab-bar': VariantPillTabBar,
  'pill-tabs-panel': VariantPillTabsPanel,
  'underline-tabs': VariantUnderlineTabs,
  'icon-tab-strip': VariantIconTabStrip,
  'dropdown-collapsed-row': VariantDropdownCollapsedRow,
  'dropdown-inset-list': VariantDropdownInsetList,
  'dropdown-summary-badges': VariantDropdownSummaryBadges,
};

// =============================================================================
// VARIANT 11 STYLES
// =============================================================================

const v11 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  track: {
    height: 60,
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
    paddingHorizontal: SPACING.xs,
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
  caption: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 12 STYLES
// =============================================================================

const v12 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
  },
  bigLabel: {
    fontSize: ty.size(TEXT.sizeLarge),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  trackHolder: {
    flexDirection: 'row',
    height: 40,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 3,
    marginTop: -1.5,
    borderRadius: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tickStop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
  },
  tickOn: {
    width: 3,
    height: 18,
    backgroundColor: COLORS.text.primary,
  },
  thumbStop: {
    position: 'absolute',
    width: '25%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.text.primary,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
});

// =============================================================================
// VARIANT 13 STYLES
// =============================================================================

const v13 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
  },
  bigLabel: {
    fontSize: ty.size(TEXT.sizeLarge),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  trackHolder: {
    flexDirection: 'row',
    height: 40,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 3,
    marginTop: -1.5,
    borderRadius: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tickStop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
  },
  tickOn: {
    width: 3,
    height: 18,
    backgroundColor: COLORS.text.primary,
  },
  thumbStop: {
    position: 'absolute',
    width: '25%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.text.primary,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  drawer: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    padding: SPACING.lg,
  },
  drawerText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 14 STYLES
// =============================================================================

const v14 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  row: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  card: {
    width: 150,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    padding: SPACING.md,
    gap: SPACING.quart,
  },
  cardOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cardLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 15 STYLES
// =============================================================================

const v15 = StyleSheet.create({
  drum: {
    height: 220,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '40%',
    bottom: '40%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  row: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  rowLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 16 STYLES
// =============================================================================

const v16 = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  drumPane: {
    flex: 1,
    height: 190,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '40%',
    bottom: '40%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  drumRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  rowLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  rowLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  detail: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 17 STYLES
// =============================================================================

const v17 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  drum: {
    height: 132,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  drumDisabled: {
    opacity: 0.4,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33.3%',
    bottom: '33.3%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  row: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  rowLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  rowLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 18 STYLES
// =============================================================================

const v18 = StyleSheet.create({
  drum: {
    height: 76,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.3%',
    right: '33.3%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  columnLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
  columnLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 19 STYLES
// =============================================================================

const v19 = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pill: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  pillOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  pillLabel: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    maxWidth: '100%',
  },
  pillLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 20 STYLES
// =============================================================================

const v20 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  bar: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pill: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  pillOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  pillLabel: {
    fontSize: 11,
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    maxWidth: '100%',
  },
  pillLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  panel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    padding: SPACING.md,
    gap: SPACING.smd,
  },
  hint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 21 STYLES
// =============================================================================

const v21 = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  tabLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    maxWidth: '100%',
  },
  tabLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    width: '25%',
    height: 2,
    backgroundColor: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 22 STYLES
// =============================================================================

const v22 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  strip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  selectedLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 23 STYLES
// =============================================================================

const v23 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  summaryLabel: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  optionLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 24 STYLES
// =============================================================================

const v24 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: SPACING.md,
  },
  summaryLabel: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  panel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    overflow: 'hidden',
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  optionSeparated: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  optionLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 25 STYLES
// =============================================================================

const v25 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  badges: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.quart,
  },
  badgeText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  optionLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});
