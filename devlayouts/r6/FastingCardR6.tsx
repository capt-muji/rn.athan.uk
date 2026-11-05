/**
 * The round-6 Fasting card (T-623): the owner's round-6 refinement of the
 * decided structure - the rows squeezed to HALFWAY between round 5's tight
 * and loose extremes, at take 2's inset padding (the owner called its
 * left/right perfect), the card's top and bottom symmetric, and the closing
 * note dressed in the Athan card's segmented-selection treatment: one hue
 * per take, the note carrying it as a faint background, a slightly stronger
 * border and soft readable text - three shades of one color, the background
 * faintest. The note hangs disconnected below the list with take 2's clear
 * gap, spans the list's exact width, and pads generously (double the rows'
 * inner inset horizontally). The list group never carries a border and never
 * a gradient; its background tints (light on four takes, darker on three,
 * none on three) and very faint hairline separators (the darker-fill takes)
 * ride the same hue, so each take reads as one coherent proposal. The card
 * container, row rhythm and inks mirror the sheet's real card (Alert.tsx /
 * FastingCard.tsx styles); the switch is the app's real Toggle; RTL mirrors
 * the sides through the row's own flex direction and the note's box. Dev
 * only: nothing shipped imports here. Every visible string rides in from the
 * model as a hoisted literal.
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
import { R6_CARD_SUBHEADING, R6_CARD_TITLE, R6_ROWS, type R6Row, r6Description } from './model';

export type R6Design = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Rgb = readonly [number, number, number];

// The ten hues, drawn from the palette's own families (the indigo is the
// app's accent itself), in the owner's order. The note's three shades are
// three alphas of one rgb: background faintest, border stronger, text most
// readable but still soft.
const HUES: readonly Rgb[] = [
  [52, 211, 153], // green
  [253, 224, 71], // soft yellow, not orange
  [99, 102, 241], // indigo, the app's own accent family
  [45, 212, 191], // teal
  [56, 189, 248], // sky blue
  [167, 139, 250], // violet
  [148, 163, 184], // slate, cool gray
  [251, 113, 133], // rose
  [34, 211, 238], // cyan
  [212, 175, 55], // amber-leaning soft gold, still soft
];

const rgba = (rgb: Rgb, alpha: number): string => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

// Fill strengths: the light tint repeats round 5 take 2's whisper, the dark
// tint is the "some dark" half of the owner's spread, three takes go bare
const LIGHT_FILL_ALPHA = 0.05;
const DARK_FILL_ALPHA = 0.09;
const DIVIDER_ALPHA = 0.12;
const NOTE_BG_ALPHA = 0.1;
const NOTE_BORDER_ALPHA = 0.3;
const NOTE_TEXT_ALPHA = 0.85;

// The halfway squeeze: the row gap halfway between xs (4) and sm (8), the row
// padding halfway between xs (4) and round 5 take 1's smd (10)
const ROW_GAP = SPACING.py;
const ROW_PAD_V = 7;

// Take 2's list padding is the base; the note pads double the rows' inner inset
const LIST_INSET = SPACING.mid;
const NOTE_PAD_H = LIST_INSET * 2;

type ListFill = 'none' | 'light' | 'dark';

interface R6Take {
  readonly hue: Rgb;
  readonly fill: ListFill;
  readonly separators: boolean;
}

// The ten takes: the hue order is the owner's list; the list background
// alternates light, bare and dark so every fill shade is proposed; the
// hairline separators ride the darker fills
export const R6_TAKES: readonly R6Take[] = [
  { hue: HUES[0], fill: 'light', separators: false },
  { hue: HUES[1], fill: 'none', separators: false },
  { hue: HUES[2], fill: 'dark', separators: true },
  { hue: HUES[3], fill: 'light', separators: false },
  { hue: HUES[4], fill: 'none', separators: false },
  { hue: HUES[5], fill: 'dark', separators: true },
  { hue: HUES[6], fill: 'light', separators: false },
  { hue: HUES[7], fill: 'none', separators: false },
  { hue: HUES[8], fill: 'dark', separators: true },
  { hue: HUES[9], fill: 'light', separators: false },
];

interface FastingCardR6Props {
  readonly design: R6Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR6({ design, selection, onTap }: FastingCardR6Props) {
  const take = R6_TAKES[design - 1];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{R6_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R6_CARD_SUBHEADING}</Text>
      <RowGroup take={take} selection={selection} onTap={onTap} />
      <Note take={take} selection={selection} />
    </View>
  );
}

/** The borderless list group: the take's hue tint (or none) around the rows */
function RowGroup({
  take,
  selection,
  onTap,
}: {
  readonly take: R6Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}) {
  const fill =
    take.fill === 'light'
      ? rgba(take.hue, LIGHT_FILL_ALPHA)
      : take.fill === 'dark'
        ? rgba(take.hue, DARK_FILL_ALPHA)
        : 'transparent';

  return (
    <View style={[styles.group, { backgroundColor: fill }]}>
      <View style={{ gap: ROW_GAP }}>
        {R6_ROWS.map((row, index) => (
          <FastingRow
            key={row.key}
            row={row}
            divided={take.separators && index > 0}
            dividerColor={rgba(take.hue, DIVIDER_ALPHA)}
            selected={rowSelected(selection, row.key)}
            onTap={onTap}
          />
        ))}
      </View>
    </View>
  );
}

/** The card's closing note, in the take's three-shade segmented treatment */
function Note({ take, selection }: { readonly take: R6Take; readonly selection: R2Selection }) {
  return (
    <View
      style={[
        styles.note,
        { backgroundColor: rgba(take.hue, NOTE_BG_ALPHA), borderColor: rgba(take.hue, NOTE_BORDER_ALPHA) },
      ]}>
      <Text style={[styles.description, { color: rgba(take.hue, NOTE_TEXT_ALPHA) }]}>{r6Description(selection)}</Text>
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
  divided,
  dividerColor,
  selected,
  onTap,
}: {
  readonly row: R6Row;
  readonly divided: boolean;
  readonly dividerColor: string;
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
      style={[
        styles.row,
        { paddingVertical: ROW_PAD_V },
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: dividerColor },
      ]}
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
  // The sheet's real card container (Alert.tsx styles.card)
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    padding: SPACING.lg,
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
  // The list group: inset to take 2's padding, margins mirrored above and
  // below (the card's top and bottom read symmetric), never a border
  group: {
    marginTop: SPACING.smd,
    paddingHorizontal: LIST_INSET,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.lg,
  },
  // The note: disconnected by take 2's clear gap, the list's exact width,
  // generous horizontal padding (double the rows' inner inset)
  note: {
    marginTop: SPACING.smd,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: NOTE_PAD_H,
    paddingVertical: SPACING.md,
  },
  description: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(20),
  },
});
