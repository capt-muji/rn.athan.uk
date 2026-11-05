/**
 * The round-7 Fasting card (T-623): the owner's round-7 refinement of the
 * decided structure - unchanged rows, switches, selection model and copy -
 * with every take's list group wearing round-5 take 2's exact background
 * color (the verdict that replaced round 6's per-take fills), hairline
 * separators between the rows in most takes (two takes without, as
 * comparison), and vertical symmetry kept exact: the card's padding mirrors
 * top and bottom, the group's margins mirror, the gaps between the four
 * rows are all equal. The note keeps round 6's three-shade one-hue
 * treatment - faint background, stronger border, soft never-white text -
 * but centers its text horizontally, keeps the generous padding at the
 * list's exact width, hangs disconnected below the list by the same clear
 * gap, and carries a small info icon in its own text hue: left inside the
 * note on most takes, right on one, absent on two. The hues are brighter
 * and softer than round 6's survivors: greens, teals, skies and proper
 * happy yellows, never orange. The card container, row rhythm and inks
 * mirror the sheet's real card (Alert.tsx / FastingCard.tsx styles); the
 * switch is the app's real Toggle. Dev only: nothing shipped imports here.
 * Every visible string rides in from the model as a hoisted literal.
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
import { R7_CARD_SUBHEADING, R7_CARD_TITLE, R7_INFO_GLYPH, R7_ROWS, type R7Row, r7Description } from './model';

export type R7Design = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Rgb = readonly [number, number, number];

// The ten hues, brighter and softer than round 6's survivors and locked to
// their families - two greens, two teals, two skies, three happy yellows
// and the extra teal (the family that read best on the dark sheet). The
// reds never outrun the greens, so none of the yellows reads orange.
const HUES: readonly Rgb[] = [
  [74, 222, 128], // green, bright
  [134, 239, 172], // green, soft
  [45, 212, 191], // teal, bright
  [94, 234, 212], // teal, soft
  [56, 189, 248], // sky, bright
  [125, 211, 252], // sky, soft
  [254, 236, 110], // yellow, happy bright
  [254, 243, 158], // yellow, soft
  [254, 249, 195], // yellow, light
  [153, 246, 228], // teal, light - the extra take in the best-reading family
];

const rgba = (rgb: Rgb, alpha: number): string => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

// The note's three-shade treatment, round 6's strengths unchanged
const LIST_FILL = 'rgba(99, 102, 241, 0.03)';
const DIVIDER_ALPHA = 0.12;
const NOTE_BG_ALPHA = 0.1;
const NOTE_BORDER_ALPHA = 0.3;
const NOTE_TEXT_ALPHA = 0.85;

// The decided row rhythm, round 6's halfway squeeze unchanged
const ROW_GAP = SPACING.py;
const ROW_PAD_V = 7;

// Take 2's list padding is the base; the note pads double the rows' inner inset
const LIST_INSET = SPACING.mid;
const NOTE_PAD_H = LIST_INSET * 2;

type IconSide = 'left' | 'right' | 'none';

interface R7Take {
  readonly hue: Rgb;
  readonly icon: IconSide;
  readonly separators: boolean;
}

// The ten takes: icon left on most, right on one, absent on two; hairline
// separators between rows on most takes, the last two bare as comparison
export const R7_TAKES: readonly R7Take[] = [
  { hue: HUES[0], icon: 'left', separators: true },
  { hue: HUES[1], icon: 'left', separators: true },
  { hue: HUES[2], icon: 'left', separators: true },
  { hue: HUES[3], icon: 'left', separators: true },
  { hue: HUES[4], icon: 'left', separators: true },
  { hue: HUES[5], icon: 'left', separators: true },
  { hue: HUES[6], icon: 'left', separators: true },
  { hue: HUES[7], icon: 'right', separators: true },
  { hue: HUES[8], icon: 'none', separators: false },
  { hue: HUES[9], icon: 'none', separators: false },
];

interface FastingCardR7Props {
  readonly design: R7Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR7({ design, selection, onTap }: FastingCardR7Props) {
  const take = R7_TAKES[design - 1];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{R7_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R7_CARD_SUBHEADING}</Text>
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
  readonly take: R7Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={{ gap: ROW_GAP }}>
        {R7_ROWS.map((row, index) => (
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

/** The note: centered text in the take's three-shade treatment, icon per take */
function Note({ take, selection }: { readonly take: R7Take; readonly selection: R2Selection }) {
  const text = rgba(take.hue, NOTE_TEXT_ALPHA);
  const noteStyle = [
    styles.note,
    { backgroundColor: rgba(take.hue, NOTE_BG_ALPHA), borderColor: rgba(take.hue, NOTE_BORDER_ALPHA) },
  ];

  if (take.icon === 'none') {
    return (
      <View style={noteStyle}>
        <Text style={[styles.description, { color: text }]}>{r7Description(selection)}</Text>
      </View>
    );
  }

  const icon = <InfoGlyph color={text} />;

  return (
    <View style={[noteStyle, styles.noteRow]}>
      {take.icon === 'left' && icon}
      <Text style={[styles.description, styles.descriptionFlex, { color: text }]}>{r7Description(selection)}</Text>
      {take.icon === 'right' && icon}
    </View>
  );
}

/** The small info glyph in the note's own text hue */
function InfoGlyph({ color }: { readonly color: string }) {
  return (
    <View style={[styles.infoGlyph, { borderColor: color }]}>
      <Text style={[styles.infoGlyphText, { color }]}>{R7_INFO_GLYPH}</Text>
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
  readonly row: R7Row;
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
  // The sheet's real card container (Alert.tsx styles.card): the padding is
  // one value, so the card's top and bottom padding are equal by construction
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
  // The list group: round-5 take 2's exact fill on every take, the vertical
  // padding one value (top equals bottom), the margins mirrored above and
  // below through the one GROUP_GAP, never a border, never a gradient
  group: {
    marginTop: SPACING.smd,
    paddingHorizontal: LIST_INSET,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.lg,
    backgroundColor: LIST_FILL,
  },
  // The note: disconnected below the list by the same GROUP_GAP the group
  // carries above it, the list's exact width, generous horizontal padding
  note: {
    marginTop: SPACING.smd,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: NOTE_PAD_H,
    paddingVertical: SPACING.md,
  },
  // The icon takes ride the row layout; the text column's width is the same
  // whether the glyph sits left or right, so the centered text keeps its
  // position across the takes
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyphText: {
    fontSize: 10,
    fontFamily: ty.familyMedium,
    lineHeight: 12,
  },
});
