/**
 * The round-8 Fasting card (T-623): the finalization set - ten takes of
 * round 7 take 5's picked styling (the bright sky hue, the three-shade note
 * treatment, round-5 take 2's list background) carrying the owner's five
 * fixes, the takes differing only in the graded value of each fix:
 *   1. the info icon about a quarter smaller than round 7's and flush with
 *      the note text's left edge (the size grades around -25 percent),
 *   2. the note's horizontal padding exactly the list rows' inset,
 *   3. the separators' opacity halved and fainter (grades around 50, 60 and
 *      70 percent off round 7's strength),
 *   4. every separator computed to sit exactly halfway between its two rows
 *      (half the row gap minus half the line on each side, never eyeballed),
 *   5. the card's padding one uniform value on all four sides (grades 12,
 *      14 and 16).
 * Everything else is the picked take unchanged: the decided structure (four
 * toggle rows top-down, real purple switches, the round-2 selection model,
 * period-free copy), the sky hue with its three-shade note (faint
 * background, faint border, soft text), the note's center-aligned text,
 * round-5 take 2's list background, separators present on every take, mirror
 * symmetry, nothing clipped, first-frame settled. The card container, row
 * rhythm and inks mirror the sheet's real card (Alert.tsx / FastingCard.tsx
 * styles); the switch is the app's real Toggle. Dev only: nothing shipped
 * imports here. Every visible string rides in from the model as a hoisted
 * literal.
 */

import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Toggle, { type ToggleHandle } from '@/components/sheets/parts/Toggle';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import type { R2Key, R2Selection } from '../r2/model';
import { R8_CARD_SUBHEADING, R8_CARD_TITLE, R8_INFO_GLYPH, R8_ROWS, type R8Row, r8Description } from './model';

export type R8Design = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Rgb = readonly [number, number, number];

// Round 7 take 5's bright sky, the owner's pick, on every take
const SKY: Rgb = [56, 189, 248];

const rgba = (rgb: Rgb, alpha: number): string => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

// The picked take's treatment, unchanged across the set
const LIST_FILL = 'rgba(99, 102, 241, 0.03)';
const NOTE_BG_ALPHA = 0.1;
const NOTE_BORDER_ALPHA = 0.3;
const NOTE_TEXT_ALPHA = 0.85;

// The decided row rhythm, round 6's halfway squeeze unchanged
const ROW_GAP = SPACING.py;
const ROW_PAD_V = 7;

// Fix 2, exact: the note pads by the list group's own inset, so the note's
// text block and the rows share the one horizontal inset by construction
const ROW_INSET = SPACING.mid;
const NOTE_PAD_H = ROW_INSET;

// Fix 4, computed: the line sits exactly halfway between its two adjacent
// row boxes - each side's margin is half the row gap minus half the line,
// so the rows keep round 7's ROW_GAP rhythm and the line rides its midpoint.
// The rows are equal-height by construction (one ROW_PAD_V, one title
// style), so the box midpoint is the rows' visual midpoint.
const DIVIDER_MARGIN = (ROW_GAP - StyleSheet.hairlineWidth) / 2;

interface R8Take {
  /** Fix 1: the icon's side, round 7's 16 minus the graded share (px) */
  readonly iconSize: number;
  /** Fix 3: the separator ink's alpha, round 7's 0.12 minus the graded share */
  readonly dividerAlpha: number;
  /** Fix 5: the card's padding, one value on all four sides (px) */
  readonly cardPadding: number;
}

// The ten finalization takes. Fix 1 grades from -20 to -29 percent around
// the ordered -25, fix 3 grades the ordered 50 / 60 / 70 percent reductions
// (take 10 adds the 65 midpoint), fix 5 grades 12 / 14 / 16; the three
// grades pair so the owner reads each fix's ladder against the others.
export const R8_TAKES: readonly R8Take[] = [
  { iconSize: 12.8, dividerAlpha: 0.06, cardPadding: 12 },
  { iconSize: 12.4, dividerAlpha: 0.048, cardPadding: 14 },
  { iconSize: 12.0, dividerAlpha: 0.036, cardPadding: 16 },
  { iconSize: 12.6, dividerAlpha: 0.06, cardPadding: 12 },
  { iconSize: 12.2, dividerAlpha: 0.048, cardPadding: 14 },
  { iconSize: 11.8, dividerAlpha: 0.036, cardPadding: 16 },
  { iconSize: 11.6, dividerAlpha: 0.06, cardPadding: 12 },
  { iconSize: 12.0, dividerAlpha: 0.048, cardPadding: 14 },
  { iconSize: 11.4, dividerAlpha: 0.036, cardPadding: 16 },
  { iconSize: 12.2, dividerAlpha: 0.042, cardPadding: 14 },
];

interface FastingCardR8Props {
  readonly design: R8Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR8({ design, selection, onTap }: FastingCardR8Props) {
  const take = R8_TAKES[design - 1];

  return (
    <View style={[styles.card, { padding: take.cardPadding }]}>
      <Text style={styles.cardTitle}>{R8_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R8_CARD_SUBHEADING}</Text>
      <RowGroup take={take} selection={selection} onTap={onTap} />
      <Note take={take} selection={selection} />
    </View>
  );
}

/** The list group: round-5 take 2's exact background, the margins mirrored */
function RowGroup({
  take,
  selection,
  onTap,
}: {
  readonly take: R8Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}) {
  return (
    <View style={styles.group}>
      {R8_ROWS.map((row, index) => (
        <View key={row.key}>
          {index > 0 && <Divider alpha={take.dividerAlpha} />}
          <FastingRow row={row} selected={rowSelected(selection, row.key)} onTap={onTap} />
        </View>
      ))}
    </View>
  );
}

/** Fix 4's line: hairline ink at the computed halfway margins */
function Divider({ alpha }: { readonly alpha: number }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: rgba(SKY, alpha),
        marginVertical: DIVIDER_MARGIN,
      }}
    />
  );
}

/** The note: centered text in the sky's three-shade treatment, icon flush left */
function Note({ take, selection }: { readonly take: R8Take; readonly selection: R2Selection }) {
  const text = rgba(SKY, NOTE_TEXT_ALPHA);
  const noteStyle = [
    styles.note,
    { backgroundColor: rgba(SKY, NOTE_BG_ALPHA), borderColor: rgba(SKY, NOTE_BORDER_ALPHA) },
  ];

  return (
    <View style={[noteStyle, styles.noteRow]}>
      <InfoGlyph size={take.iconSize} color={text} />
      <Text style={[styles.description, styles.descriptionFlex, { color: text }]}>{r8Description(selection)}</Text>
    </View>
  );
}

/** The small info glyph in the note's own text hue, sized per take */
function InfoGlyph({ size, color }: { readonly size: number; readonly color: string }) {
  return (
    <View style={[styles.infoGlyph, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.infoGlyphText, { fontSize: size * 0.625, lineHeight: size * 0.75, color }]}>
        {R8_INFO_GLYPH}
      </Text>
    </View>
  );
}

/**
 * The four rows top-down. Each row routes its press through the switch's own
 * press (the LabeledToggle pattern), so the flip, the haptic and the write
 * settle identically whichever side was touched.
 */
function FastingRow({
  row,
  selected,
  onTap,
}: {
  readonly row: R8Row;
  readonly selected: boolean;
  readonly onTap: (key: R2Key) => void;
}) {
  const toggleRef = useRef<ToggleHandle>(null);

  const handleRowPress = () => toggleRef.current?.press();
  const handleSwitchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Pressable
      style={[styles.row, { paddingVertical: ROW_PAD_V }]}
      hitSlop={HIT_SLOP.md}
      onPress={handleRowPress}
      accessibilityLabel={row.title}>
      <Text style={styles.rowTitle}>{row.title}</Text>
      <Toggle
        ref={toggleRef}
        value={selected}
        onToggle={() => onTap(row.key)}
        onPress={handleSwitchPress}
        accessibilityLabel={row.title}
      />
    </Pressable>
  );
}

const rowSelected = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // The sheet's real card container (Alert.tsx styles.card); fix 5's one
  // uniform padding rides in per take so all four sides are equal
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    marginBottom: SPACING.md,
  },
  // The sheet's real card title (FastingCard.tsx styles.cardTitle)
  cardTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: '#d8eaf8',
    marginBottom: SPACING.sm - 1,
  },
  cardSubheading: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  rowTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  // The list group: round-5 take 2's exact fill, the vertical padding one
  // value (top equals bottom), the margins mirrored above and below through
  // the one group gap, never a border, never a gradient; fix 2's inset is
  // the horizontal padding the note now shares
  group: {
    marginTop: SPACING.smd,
    paddingHorizontal: ROW_INSET,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.lg,
    backgroundColor: LIST_FILL,
  },
  // The note: disconnected below the list by the same group gap, the list's
  // exact width, fix 2's horizontal padding equal to the rows' inset
  note: {
    marginTop: SPACING.smd,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: NOTE_PAD_H,
    paddingVertical: SPACING.md,
  },
  // The icon rides the row layout flush left at the note's padding edge
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  description: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(20),
    textAlign: 'center',
  },
  descriptionFlex: {
    flex: 1,
  },
  infoGlyph: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyphText: {
    fontFamily: ty.familyMedium,
  },
});
