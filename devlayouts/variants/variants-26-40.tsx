/**
 * Fasting layout variants 26-40 (T-623): the tooltip family, the peek row,
 * the calendar and grid readers, the stepper family, the progressive
 * disclosure family and the tile grids. Dev-only, first-frame settled,
 * catalog strings only. The calendar variants read the real fasting helpers
 * for display only and write nothing. Every component owns its draft with
 * useFastingDraft.
 */

import type { ReactElement } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { LabeledToggle } from '@/components/sheets/parts';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import {
  FASTING_MODES,
  fastingEvaluator,
  hijriPartsFor,
  isWhiteDay,
  WHITE_DAY_FROM,
  WHITE_DAY_TO,
} from '@/shared/fasting';
import { t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import * as TimeUtils from '@/shared/time';
import { typographyFor } from '@/shared/typography';

import {
  BUTTON_ROLE,
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  CheckGlyph,
  Chevron,
  Chip,
  HintBubble,
  modeHint,
  modeLabel,
  RADIO_ROLE,
  useFastingDraft,
} from '../parts';

const ty = typographyFor(currentLocaleId());

// Harness chrome: the accordion's section header and the hero's change
// affordance have no catalog keys; the labels live here as code values for
// the string scanner
const SCHEDULE_LABEL = 'Schedule';
const CHANGE_LABEL = 'Change';

// The rhythm modes the step-one chips of 35 pick between; the white days are
// the add-on's own mode and surface through the extras row instead
const RHYTHM_MODES = ['everyDay', 'muhammad', 'dawood'] as const;

const addOnOffered = (mode: (typeof FASTING_MODES)[number]): boolean => mode === 'muhammad' || mode === 'dawood';

// =============================================================================
// 26. INFO BUBBLE ROWS - compact rows each carrying a small info dot; the
//     one open bubble shows its mode's explanation beside the row. The
//     muhammad row opens so the capture shows a bubble
// =============================================================================

const VariantInfoBubbleRows = () => {
  const [selection, setSelection] = useFastingDraft();
  const [openMode, setOpenMode] = useState<(typeof FASTING_MODES)[number] | null>('muhammad');
  return (
    <View style={v26.wrap}>
      {FASTING_MODES.map((mode) => {
        const open = openMode === mode;
        return (
          <View key={mode} style={v26.group}>
            <View style={v26.row}>
              <Pressable
                style={v26.rowMain}
                hitSlop={HIT_SLOP.md}
                accessibilityRole={RADIO_ROLE}
                accessibilityState={{ selected: selection.mode === mode }}
                accessibilityLabel={modeLabel(mode)}
                onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
                <Text style={[v26.label, selection.mode === mode ? v26.labelOn : null]}>{modeLabel(mode)}</Text>
              </Pressable>
              <Pressable
                style={v26.dotHit}
                hitSlop={HIT_SLOP.md}
                accessibilityRole={BUTTON_ROLE}
                accessibilityLabel={modeHint(mode)}
                onPress={() => setOpenMode(open ? null : mode)}>
                <View style={[v26.infoDot, open ? v26.infoDotOn : null]} />
              </Pressable>
            </View>
            {open && <HintBubble mode={mode} />}
          </View>
        );
      })}
    </View>
  );
};

// =============================================================================
// 27. HEADER TOOLTIP TOGGLE - the section header with a toggle dot; on means
//     every hint reveals under its label, off collapses the rows to single
//     lines. Opens on so the capture shows the hints
// =============================================================================

const VariantHeaderTooltipToggle = () => {
  const [selection, setSelection] = useFastingDraft();
  const [revealed, setRevealed] = useState(true);
  return (
    <View style={v27.wrap}>
      <View style={v27.header}>
        <Text style={v27.title}>{t('fasting.card.title')}</Text>
        <Pressable
          style={v27.dotHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={t('fasting.card.hint')}
          onPress={() => setRevealed(!revealed)}>
          <View style={[v27.toggleDot, revealed ? v27.toggleDotOn : null]} />
        </Pressable>
      </View>
      {FASTING_MODES.map((mode) => (
        <Pressable
          key={mode}
          style={v27.row}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={RADIO_ROLE}
          accessibilityState={{ selected: selection.mode === mode }}
          accessibilityLabel={modeLabel(mode)}
          onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
          <Text style={[v27.label, selection.mode === mode ? v27.labelOn : null]}>{modeLabel(mode)}</Text>
          {revealed && <Text style={v27.hint}>{modeHint(mode)}</Text>}
        </Pressable>
      ))}
    </View>
  );
};

// =============================================================================
// 28. LONG-PRESS PEEK ROWS - minimal single-line rows; the peek strip at the
//     bottom carries the selected mode's explanation, the long-press's read
// =============================================================================

const VariantLongpressPeekRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v28.wrap}>
      <View style={v28.list}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v28.row}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
              onLongPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <Text style={[v28.label, on ? v28.labelOn : null]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v28.peekStrip}>
        <Text style={v28.peekText} numberOfLines={1}>
          {modeHint(selection.mode)}
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// 29. WHITE-DAYS CALENDAR STRIP - ten upcoming Hijri day chips read from the
//     real helpers, the white days filled, the others outline; the four mode
//     chips select beneath and the add-on chip rides where offered
// =============================================================================

const STRIP_DAYS = 10;

const VariantWhiteDaysCalendarStrip = () => {
  const [selection, setSelection] = useFastingDraft();
  const today = TimeUtils.getTodayDateString();
  const days = Array.from({ length: STRIP_DAYS }, (_, index) => TimeUtils.addDaysToDateString(today, index));
  return (
    <View style={v29.wrap}>
      <View style={v29.strip}>
        {days.map((day) => {
          const parts = hijriPartsFor(day);
          const white = parts !== null && parts.day >= WHITE_DAY_FROM && parts.day <= WHITE_DAY_TO;
          return (
            <View key={day} style={[v29.chip, white ? v29.chipWhite : null]}>
              <Text style={[v29.chipText, white ? v29.chipTextWhite : null]} adjustsFontSizeToFit>
                {parts === null ? null : parts.day}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={v29.chips}>
        {FASTING_MODES.map((mode) => (
          <Chip
            key={mode}
            label={modeLabel(mode)}
            on={selection.mode === mode}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
          />
        ))}
      </View>
      {addOnOffered(selection.mode) && (
        <Chip
          label={'Include the white days'}
          on={selection.whiteDaysAddOn}
          onPress={() => setSelection({ mode: selection.mode, whiteDaysAddOn: !selection.whiteDaysAddOn })}
        />
      )}
    </View>
  );
};

// =============================================================================
// 30. WEEK STRIP + MODE CHIPS - seven days with the armed days dot-marked
//     under the live selection, the four mode chips beneath
// =============================================================================

const WEEK_DAYS = 7;

const VariantWeekStripModeChips = () => {
  const [selection, setSelection] = useFastingDraft();
  const verdictFor = fastingEvaluator(
    { mode: selection.mode, whiteDaysAddOn: selection.whiteDaysAddOn, dawoodAnchorMs: 0 },
    () => null
  );
  const today = TimeUtils.getTodayDateString();
  const days = Array.from({ length: WEEK_DAYS }, (_, index) => TimeUtils.addDaysToDateString(today, index));
  return (
    <View style={v30.wrap}>
      <View style={v30.strip}>
        {days.map((day) => (
          <View key={day} style={v30.day}>
            <View style={[v30.dayDot, verdictFor(day).arms ? v30.dayDotOn : null]} />
          </View>
        ))}
      </View>
      <View style={v30.chips}>
        {FASTING_MODES.map((mode) => (
          <Chip
            key={mode}
            label={modeLabel(mode)}
            on={selection.mode === mode}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
          />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// 31. MONTH DOTS GRID - thirty small day dots with the white days
//     highlighted, the four mode chips beneath
// =============================================================================

const MONTH_DOTS = 30;

const VariantMonthDotsGrid = () => {
  const [selection, setSelection] = useFastingDraft();
  const today = TimeUtils.getTodayDateString();
  const days = Array.from({ length: MONTH_DOTS }, (_, index) => TimeUtils.addDaysToDateString(today, index));
  return (
    <View style={v31.wrap}>
      <View style={v31.grid}>
        {days.map((day) => (
          <View key={day} style={[v31.dot, isWhiteDay(day) ? v31.dotWhite : null]} />
        ))}
      </View>
      <View style={v31.chips}>
        {FASTING_MODES.map((mode) => (
          <Chip
            key={mode}
            label={modeLabel(mode)}
            on={selection.mode === mode}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
          />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// 32. STEPPER CYCLE - the mode label between left and right chevrons, the
//     position dots beneath; the chevrons cycle the modes
// =============================================================================

const VariantStepperCycle = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  const cycle = (step: number) => {
    const mode = FASTING_MODES[(selected + step + FASTING_MODES.length) % FASTING_MODES.length];
    setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn });
  };
  return (
    <View style={v32.wrap}>
      <View style={v32.row}>
        <Pressable
          style={v32.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected - 1 + FASTING_MODES.length) % FASTING_MODES.length])}
          onPress={() => cycle(-1)}>
          <Chevron direction={CHEVRON_LEFT} ink={COLORS.text.primary} />
        </Pressable>
        <Text style={v32.label}>{modeLabel(selection.mode)}</Text>
        <Pressable
          style={v32.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected + 1) % FASTING_MODES.length])}
          onPress={() => cycle(1)}>
          <Chevron direction={CHEVRON_RIGHT} ink={COLORS.text.primary} />
        </Pressable>
      </View>
      <View style={v32.dots}>
        {FASTING_MODES.map((mode) => (
          <View key={mode} style={[v32.dot, selection.mode === mode ? v32.dotOn : null]} />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// 33. STEPPER HINT SLOT - the stepper of 32 with a hint slot beneath the
//     label showing the selected mode's explanation
// =============================================================================

const VariantStepperHintSlot = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  const cycle = (step: number) => {
    const mode = FASTING_MODES[(selected + step + FASTING_MODES.length) % FASTING_MODES.length];
    setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn });
  };
  return (
    <View style={v33.wrap}>
      <View style={v33.row}>
        <Pressable
          style={v33.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected - 1 + FASTING_MODES.length) % FASTING_MODES.length])}
          onPress={() => cycle(-1)}>
          <Chevron direction={CHEVRON_LEFT} ink={COLORS.text.primary} />
        </Pressable>
        <Text style={v33.label}>{modeLabel(selection.mode)}</Text>
        <Pressable
          style={v33.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected + 1) % FASTING_MODES.length])}
          onPress={() => cycle(1)}>
          <Chevron direction={CHEVRON_RIGHT} ink={COLORS.text.primary} />
        </Pressable>
      </View>
      <View style={v33.slot}>
        <Text style={v33.slotText}>{modeHint(selection.mode)}</Text>
      </View>
    </View>
  );
};

// =============================================================================
// 34. TALLY STEPPER - the mode label large and centred between side
//     chevrons, a four-segment position bar beneath showing the selected
//     stop filled
// =============================================================================

const VariantTallyStepper = () => {
  const [selection, setSelection] = useFastingDraft();
  const selected = FASTING_MODES.indexOf(selection.mode);
  const cycle = (step: number) => {
    const mode = FASTING_MODES[(selected + step + FASTING_MODES.length) % FASTING_MODES.length];
    setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn });
  };
  return (
    <View style={v34.wrap}>
      <View style={v34.row}>
        <Pressable
          style={v34.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected - 1 + FASTING_MODES.length) % FASTING_MODES.length])}
          onPress={() => cycle(-1)}>
          <Chevron direction={CHEVRON_LEFT} ink={COLORS.text.primary} />
        </Pressable>
        <Text style={v34.heroLabel} numberOfLines={1} adjustsFontSizeToFit>
          {modeLabel(selection.mode)}
        </Text>
        <Pressable
          style={v34.chevronHit}
          hitSlop={HIT_SLOP.md}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(FASTING_MODES[(selected + 1) % FASTING_MODES.length])}
          onPress={() => cycle(1)}>
          <Chevron direction={CHEVRON_RIGHT} ink={COLORS.text.primary} />
        </Pressable>
      </View>
      <View style={v34.bar}>
        {FASTING_MODES.map((mode) => (
          <View key={mode} style={[v34.segment, selection.mode === mode ? v34.segmentOn : null]} />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// 35. RHYTHM THEN EXTRAS - the step-one chips pick the rhythm; under
//     muhammad and dawood a second row appears with the white-days add-on
//     toggle chip
// =============================================================================

const VariantRhythmThenExtras = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v35.wrap}>
      <View style={v35.chips}>
        {RHYTHM_MODES.map((mode) => (
          <Chip
            key={mode}
            label={modeLabel(mode)}
            on={selection.mode === mode}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
          />
        ))}
      </View>
      {addOnOffered(selection.mode) && (
        <View style={v35.extrasRow}>
          <Chip
            label={'Include the white days'}
            on={selection.whiteDaysAddOn}
            onPress={() => setSelection({ mode: selection.mode, whiteDaysAddOn: !selection.whiteDaysAddOn })}
          />
        </View>
      )}
    </View>
  );
};

// =============================================================================
// 36. ACCORDION SECTIONS - the schedule section collapsed to its selection
//     with the hint in the row body, expanding to the four options; the
//     white-days add-on rides as its own accordion row under muhammad and
//     dawood
// =============================================================================

const VariantAccordionSections = () => {
  const [selection, setSelection] = useFastingDraft();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  return (
    <View style={v36.wrap}>
      <View style={v36.section}>
        <Pressable
          style={v36.sectionHeader}
          accessibilityRole={BUTTON_ROLE}
          accessibilityLabel={modeLabel(selection.mode)}
          onPress={() => setScheduleOpen(!scheduleOpen)}>
          <Text style={v36.sectionTitle}>{SCHEDULE_LABEL}</Text>
          <Chevron direction={scheduleOpen ? 'up' : 'down'} />
        </Pressable>
        {scheduleOpen ? (
          FASTING_MODES.map((mode) => {
            const on = selection.mode === mode;
            return (
              <Pressable
                key={mode}
                style={v36.option}
                hitSlop={HIT_SLOP.md}
                accessibilityRole={RADIO_ROLE}
                accessibilityState={{ selected: on }}
                accessibilityLabel={modeLabel(mode)}
                onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
                <Text style={[v36.optionLabel, on ? v36.optionLabelOn : null]}>{modeLabel(mode)}</Text>
                <Text style={v36.optionHint}>{modeHint(mode)}</Text>
              </Pressable>
            );
          })
        ) : (
          <View style={v36.sectionBody}>
            <Text style={v36.selectionLabel}>{modeLabel(selection.mode)}</Text>
            <Text style={v36.hint}>{modeHint(selection.mode)}</Text>
          </View>
        )}
      </View>
      {addOnOffered(selection.mode) && (
        <View style={v36.section}>
          <LabeledToggle
            label={'Include the white days'}
            value={selection.whiteDaysAddOn}
            onToggle={(next) => setSelection({ mode: selection.mode, whiteDaysAddOn: next })}
          />
        </View>
      )}
    </View>
  );
};

// =============================================================================
// 37. CONTEXTUAL CHIP ROWS - the mode chips row, a contextual add-on chip
//     row that appears only where the structure offers it, and a one-line
//     summary naming the current selection
// =============================================================================

const VariantContextualChipRows = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v37.wrap}>
      <View style={v37.chips}>
        {FASTING_MODES.map((mode) => (
          <Chip
            key={mode}
            label={modeLabel(mode)}
            on={selection.mode === mode}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}
          />
        ))}
      </View>
      {addOnOffered(selection.mode) && (
        <View style={v37.contextRow}>
          <Chip
            label={'Include the white days'}
            on={selection.whiteDaysAddOn}
            onPress={() => setSelection({ mode: selection.mode, whiteDaysAddOn: !selection.whiteDaysAddOn })}
          />
        </View>
      )}
      <Text style={v37.summary} numberOfLines={1}>
        {modeLabel(selection.mode)}
      </Text>
    </View>
  );
};

// =============================================================================
// 38. CHANGE BUTTON COLLAPSE - the selected mode large as the hero with a
//     small change affordance; tapping expands the four-option list. Opens
//     expanded so the capture shows the list
// =============================================================================

const VariantChangeButtonCollapse = () => {
  const [selection, setSelection] = useFastingDraft();
  const [open, setOpen] = useState(true);
  return (
    <View style={v38.wrap}>
      {open ? (
        FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={v38.option}
              hitSlop={HIT_SLOP.md}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => {
                setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn });
                setOpen(false);
              }}>
              <Text style={[v38.optionLabel, on ? v38.optionLabelOn : null]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })
      ) : (
        <View style={v38.hero}>
          <Text style={v38.heroLabel}>{modeLabel(selection.mode)}</Text>
          <Pressable
            style={v38.changeChip}
            hitSlop={HIT_SLOP.md}
            accessibilityRole={BUTTON_ROLE}
            accessibilityLabel={CHANGE_LABEL}
            onPress={() => setOpen(true)}>
            <Text style={v38.changeText}>{CHANGE_LABEL}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// 39. TILE GRID CORNER CHECKS - the 2x2 tile grid with a corner check on the
//     selected tile
// =============================================================================

const VariantTileGridCornerChecks = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v39.grid}>
      {FASTING_MODES.map((mode) => {
        const on = selection.mode === mode;
        return (
          <Pressable
            key={mode}
            style={[v39.tile, on ? v39.tileOn : null]}
            accessibilityRole={RADIO_ROLE}
            accessibilityState={{ selected: on }}
            accessibilityLabel={modeLabel(mode)}
            onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
            <View style={v39.corner}>
              <CheckGlyph on={on} />
            </View>
            <Text style={v39.tileLabel} numberOfLines={1} adjustsFontSizeToFit>
              {modeLabel(mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// =============================================================================
// 40. TILE GRID DETAIL DRAWER - the tile grid of 39 with a detail drawer
//     beneath showing the selected mode's explanation
// =============================================================================

const VariantTileGridDetailDrawer = () => {
  const [selection, setSelection] = useFastingDraft();
  return (
    <View style={v40.wrap}>
      <View style={v40.grid}>
        {FASTING_MODES.map((mode) => {
          const on = selection.mode === mode;
          return (
            <Pressable
              key={mode}
              style={[v40.tile, on ? v40.tileOn : null]}
              accessibilityRole={RADIO_ROLE}
              accessibilityState={{ selected: on }}
              accessibilityLabel={modeLabel(mode)}
              onPress={() => setSelection({ mode, whiteDaysAddOn: selection.whiteDaysAddOn })}>
              <View style={v40.corner}>
                <CheckGlyph on={on} />
              </View>
              <Text style={v40.tileLabel} numberOfLines={1} adjustsFontSizeToFit>
                {modeLabel(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={v40.drawer}>
        <Text style={v40.drawerText}>{modeHint(selection.mode)}</Text>
      </View>
    </View>
  );
};

export const VARIANTS_26_40: Record<string, () => ReactElement> = {
  'info-bubble-rows': VariantInfoBubbleRows,
  'header-tooltip-toggle': VariantHeaderTooltipToggle,
  'longpress-peek-rows': VariantLongpressPeekRows,
  'white-days-calendar-strip': VariantWhiteDaysCalendarStrip,
  'week-strip-mode-chips': VariantWeekStripModeChips,
  'month-dots-grid': VariantMonthDotsGrid,
  'stepper-cycle': VariantStepperCycle,
  'stepper-hint-slot': VariantStepperHintSlot,
  'tally-stepper': VariantTallyStepper,
  'rhythm-then-extras': VariantRhythmThenExtras,
  'accordion-sections': VariantAccordionSections,
  'contextual-chip-rows': VariantContextualChipRows,
  'change-button-collapse': VariantChangeButtonCollapse,
  'tile-grid-corner-checks': VariantTileGridCornerChecks,
  'tile-grid-detail-drawer': VariantTileGridDetailDrawer,
};

// =============================================================================
// VARIANT 26 STYLES
// =============================================================================

const v26 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  group: {
    gap: SPACING.quart,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  rowMain: {
    flex: 1,
    justifyContent: 'center',
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
  dotHit: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.py,
  },
  infoDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  infoDotOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
});

// =============================================================================
// VARIANT 27 STYLES
// =============================================================================

const v27 = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.15)',
  },
  title: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  dotHit: {
    padding: SPACING.sm,
  },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  toggleDotOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.text.primary,
  },
  row: {
    minHeight: 40,
    justifyContent: 'center',
    gap: 2,
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
// VARIANT 28 STYLES
// =============================================================================

const v28 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
  },
  list: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
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
  peekStrip: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  peekText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 29 STYLES
// =============================================================================

const v29 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  strip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignSelf: 'stretch',
  },
  chip: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWhite: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  chipText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  chipTextWhite: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});

// =============================================================================
// VARIANT 30 STYLES
// =============================================================================

const v30 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  day: {
    flex: 1,
    alignItems: 'center',
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  dayDotOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: COLORS.text.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});

// =============================================================================
// VARIANT 31 STYLES
// =============================================================================

const v31 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignSelf: 'stretch',
  },
  dot: {
    flexGrow: 1,
    flexBasis: '12%',
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  dotWhite: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});

// =============================================================================
// VARIANT 32 STYLES
// =============================================================================

const v32 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  chevronHit: {
    padding: SPACING.md,
  },
  label: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    minWidth: 140,
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  dotOn: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 33 STYLES
// =============================================================================

const v33 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  chevronHit: {
    padding: SPACING.md,
  },
  label: {
    fontSize: ty.size(TEXT.size),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
    minWidth: 140,
  },
  slot: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    padding: SPACING.md,
  },
  slotText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(TEXT.lineHeight.default),
    color: COLORS.text.sheetSubtitle,
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 34 STYLES
// =============================================================================

const v34 = StyleSheet.create({
  wrap: {
    gap: SPACING.lg,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    alignSelf: 'stretch',
  },
  chevronHit: {
    padding: SPACING.sm,
  },
  heroLabel: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeLarge),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  bar: {
    flexDirection: 'row',
    gap: 3,
    alignSelf: 'stretch',
    height: 5,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  segmentOn: {
    backgroundColor: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 35 STYLES
// =============================================================================

const v35 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  extrasRow: {
    flexDirection: 'row',
    paddingTop: SPACING.quart,
  },
});

// =============================================================================
// VARIANT 36 STYLES
// =============================================================================

const v36 = StyleSheet.create({
  wrap: {
    gap: SPACING.smd,
  },
  section: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  sectionTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  sectionBody: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.smd,
    gap: 2,
  },
  selectionLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  hint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  option: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.smd,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
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
  optionHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 37 STYLES
// =============================================================================

const v37 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  contextRow: {
    flexDirection: 'row',
  },
  summary: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
});

// =============================================================================
// VARIANT 38 STYLES
// =============================================================================

const v38 = StyleSheet.create({
  wrap: {
    gap: SPACING.sm,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  heroLabel: {
    fontSize: ty.size(TEXT.sizeLarge),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  changeChip: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  changeText: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionLabel: {
    fontSize: ty.size(TEXT.sizeSmall),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  optionLabelOn: {
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
});

// =============================================================================
// VARIANT 39 STYLES
// =============================================================================

const v39 = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    aspectRatio: 1.5,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  corner: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  tileLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    maxWidth: '80%',
    textAlign: 'center',
  },
});

// =============================================================================
// VARIANT 40 STYLES
// =============================================================================

const v40 = StyleSheet.create({
  wrap: {
    gap: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    aspectRatio: 1.5,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: {
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  corner: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  tileLabel: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
    maxWidth: '80%',
    textAlign: 'center',
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
