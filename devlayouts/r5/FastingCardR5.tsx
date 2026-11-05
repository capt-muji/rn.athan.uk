/**
 * The round-5 Fasting card (T-623): round 4's take 3 (rows inset from the
 * card edge) merged with take 5 (gap-separated rows, description in a note
 * box) into ten refinement takes. Every take insets the row group and closes
 * with a note; the takes differ only in inset depth, group fill strength
 * (always softer than round 4's take 3), the note's treatment, spacing,
 * radii and separators (at most two takes carry subtle hairlines). The card
 * container, row rhythm and inks mirror the sheet's real card (Alert.tsx /
 * FastingCard.tsx styles); the switch is the app's real Toggle; RTL mirrors
 * the sides through the row's own flex direction and the note's start edge.
 * Dev-only: nothing shipped imports here. Every visible string rides in from
 * the model as a hoisted literal.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Toggle, { type ToggleHandle } from '@/components/sheets/parts/Toggle';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import type { R2Key, R2Selection } from '../r2/model';
import { R5_CARD_SUBHEADING, R5_CARD_TITLE, R5_ROWS, type R5Row, r5Description } from './model';

export type R5Design = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Fill strengths: every one a step under round 4 take 3's 0.10 group fill
const FAINT_FILL = 'rgba(99, 102, 241, 0.03)';
const FAINT_WIDE_FILL = 'rgba(99, 102, 241, 0.04)';
const SOFT_FILL = 'rgba(99, 102, 241, 0.06)';
const NOTE_FILL = 'rgba(99, 102, 241, 0.05)';
const GROUP_BORDER = 'rgba(99, 102, 241, 0.14)';
const DIVIDER = 'rgba(99, 102, 241, 0.10)';
const ACCENT_EDGE = 'rgba(80, 21, 181, 0.6)';

type RowFill = 'none' | 'faint' | 'soft' | 'faintWide' | 'gradientDown' | 'gradientUp' | 'bordered';
type NoteStyle = 'filled' | 'bordered' | 'accent' | 'dim';

interface R5Take {
  readonly rowInset: number;
  readonly rowFill: RowFill;
  readonly rowFillRadius: number;
  readonly rowGap: number;
  readonly rowPadV: number;
  readonly separators: boolean;
  readonly note: NoteStyle;
  readonly noteIndent: boolean;
  readonly noteRadius: number;
}

// The ten takes, one matrix row each (round-5 order: merge take 3 and take 5,
// vary inset depth, fill strength, note treatment, spacing, radii, separators)
export const R5_TAKES: readonly R5Take[] = [
  {
    rowInset: SPACING.md,
    rowFill: 'none',
    rowFillRadius: 0,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: false,
    note: 'filled',
    noteIndent: false,
    noteRadius: RADIUS.lg,
  },
  {
    rowInset: SPACING.mid,
    rowFill: 'faint',
    rowFillRadius: RADIUS.lg,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: false,
    note: 'bordered',
    noteIndent: false,
    noteRadius: RADIUS.lg,
  },
  {
    rowInset: SPACING.xxl,
    rowFill: 'soft',
    rowFillRadius: RADIUS.lg,
    rowGap: SPACING.xs,
    rowPadV: SPACING.smd,
    separators: false,
    note: 'filled',
    noteIndent: true,
    noteRadius: RADIUS.md,
  },
  {
    rowInset: SPACING.lg,
    rowFill: 'gradientDown',
    rowFillRadius: RADIUS.lg,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: false,
    note: 'filled',
    noteIndent: false,
    noteRadius: RADIUS.xl,
  },
  {
    rowInset: SPACING.md,
    rowFill: 'bordered',
    rowFillRadius: RADIUS.lg,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: true,
    note: 'dim',
    noteIndent: true,
    noteRadius: 0,
  },
  {
    rowInset: SPACING.xl,
    rowFill: 'faint',
    rowFillRadius: RADIUS.md,
    rowGap: SPACING.sm,
    rowPadV: SPACING.md,
    separators: false,
    note: 'accent',
    noteIndent: false,
    noteRadius: RADIUS.md,
  },
  {
    rowInset: SPACING.lg,
    rowFill: 'none',
    rowFillRadius: 0,
    rowGap: SPACING.md,
    rowPadV: SPACING.md,
    separators: false,
    note: 'bordered',
    noteIndent: true,
    noteRadius: RADIUS.md,
  },
  {
    rowInset: SPACING.md,
    rowFill: 'soft',
    rowFillRadius: RADIUS.md,
    rowGap: SPACING.xs,
    rowPadV: SPACING.xs,
    separators: false,
    note: 'dim',
    noteIndent: false,
    noteRadius: 0,
  },
  {
    rowInset: SPACING.lg2,
    rowFill: 'gradientUp',
    rowFillRadius: RADIUS.xl,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: true,
    note: 'filled',
    noteIndent: true,
    noteRadius: RADIUS.xl,
  },
  {
    rowInset: SPACING.xxl,
    rowFill: 'faintWide',
    rowFillRadius: RADIUS.xl,
    rowGap: SPACING.sm,
    rowPadV: SPACING.smd,
    separators: false,
    note: 'bordered',
    noteIndent: false,
    noteRadius: RADIUS.xl,
  },
];

interface FastingCardR5Props {
  readonly design: R5Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR5({ design, selection, onTap }: FastingCardR5Props) {
  const take = R5_TAKES[design - 1];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{R5_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R5_CARD_SUBHEADING}</Text>
      <RowGroup take={take} selection={selection} onTap={onTap} />
      <Note take={take} selection={selection} />
    </View>
  );
}

/** The inset row group: the take's fill (or none) wrapped around the rows */
function RowGroup({
  take,
  selection,
  onTap,
}: {
  readonly take: R5Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}) {
  const body = (
    <View style={{ gap: take.rowGap }}>
      {R5_ROWS.map((row, index) => (
        <FastingRow
          key={row.key}
          row={row}
          index={index}
          divided={take.separators}
          padV={take.rowPadV}
          selected={rowSelected(selection, row.key)}
          onTap={onTap}
        />
      ))}
    </View>
  );

  const insetPad = { paddingHorizontal: take.rowInset, paddingVertical: SPACING.smd };

  if (take.rowFill === 'none') {
    return <View style={[styles.group, insetPad]}>{body}</View>;
  }
  if (take.rowFill === 'gradientDown' || take.rowFill === 'gradientUp') {
    return (
      <LinearGradient
        style={[styles.group, insetPad, { borderRadius: take.rowFillRadius }]}
        colors={take.rowFill === 'gradientDown' ? [SOFT_FILL, 'transparent'] : ['transparent', NOTE_FILL]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}>
        {body}
      </LinearGradient>
    );
  }
  const fill =
    take.rowFill === 'faint'
      ? FAINT_FILL
      : take.rowFill === 'faintWide'
        ? FAINT_WIDE_FILL
        : take.rowFill === 'soft'
          ? SOFT_FILL
          : 'transparent';
  return (
    <View
      style={[
        styles.group,
        insetPad,
        { borderRadius: take.rowFillRadius, backgroundColor: fill },
        take.rowFill === 'bordered' && styles.groupBordered,
      ]}>
      {body}
    </View>
  );
}

/** The card's closing note, in the take's treatment */
function Note({ take, selection }: { readonly take: R5Take; readonly selection: R2Selection }) {
  const text = (
    <Text style={[styles.description, take.note === 'dim' ? null : styles.descriptionInk]}>
      {r5Description(selection)}
    </Text>
  );

  if (take.note === 'dim') {
    return <View style={[styles.noteDim, take.noteIndent && { paddingHorizontal: take.rowInset }]}>{text}</View>;
  }

  const pad = { paddingHorizontal: SPACING.md, paddingVertical: SPACING.smd };
  const radius = { borderRadius: take.noteRadius };
  const indent = take.noteIndent ? { paddingHorizontal: take.rowInset } : null;

  if (take.note === 'filled') {
    return (
      <View style={[styles.noteIndentWrap, indent]}>
        <View style={[styles.noteBox, pad, radius, { backgroundColor: NOTE_FILL }]}>{text}</View>
      </View>
    );
  }
  if (take.note === 'bordered') {
    return (
      <View style={[styles.noteIndentWrap, indent]}>
        <View style={[styles.noteBox, pad, radius, styles.noteBordered]}>{text}</View>
      </View>
    );
  }
  return (
    <View style={[styles.noteIndentWrap, indent]}>
      <View style={[styles.noteBox, pad, radius, styles.noteAccent]}>{text}</View>
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
  index,
  divided,
  padV,
  selected,
  onTap,
}: {
  readonly row: R5Row;
  readonly index: number;
  readonly divided: boolean;
  readonly padV: number;
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
      style={[styles.row, { paddingVertical: padV }, divided && index > 0 && styles.rowDivided]}
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
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  group: {
    marginTop: SPACING.sm,
  },
  groupBordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GROUP_BORDER,
  },
  noteIndentWrap: {
    marginTop: SPACING.smd,
  },
  noteDim: {
    marginTop: SPACING.smd,
  },
  noteBox: {
    // padding and radius ride the take
  },
  noteBordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GROUP_BORDER,
  },
  noteAccent: {
    backgroundColor: NOTE_FILL,
    borderStartWidth: 3,
    borderColor: ACCENT_EDGE,
  },
  description: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
    lineHeight: ty.lineHeight(20),
  },
  descriptionInk: {
    color: COLORS.text.primary,
  },
});
