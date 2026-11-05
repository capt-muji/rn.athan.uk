/**
 * The round-9 Fasting card (T-623): the locked take-3 card EXACTLY as the
 * FINAL DESIGN LOCKED comment specifies - uniform 16 card padding, take-3's
 * list fill, separator alpha 0.036 perfectly centred, the sky note with the
 * 12.0 flush-left info icon and centre-aligned text, the round-2 selection
 * model, period-free copy - carrying round 9's two additions: the motif's
 * echo mark on each armed row (the fasting-list rows), and the trigger
 * section (surface B) under the note, full width within the padding. The
 * card container, row rhythm and inks mirror the sheet's real card
 * (Alert.tsx styles); the switch is the app's real Toggle. Dev-only: nothing
 * shipped imports here. Every visible string rides in from the models.
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
import { R8_TAKES } from '../r8/FastingCardR8';
import { R8_CARD_SUBHEADING, R8_CARD_TITLE, R8_INFO_GLYPH, R8_ROWS, r8Description } from '../r8/model';
import type { R9CatalogRow } from './catalog';
import { R9EchoMark } from './indicators';
import { r9ArmedFor } from './model';
import { R9TriggerSection } from './triggers';

// The locked take: round 8 take 3's graded values, pinned by construction
const LOCKED_TAKE = R8_TAKES[2];

interface FastingCardR9Props {
  readonly row: R9CatalogRow;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR9({ row, selection, onTap }: FastingCardR9Props) {
  const armed = r9ArmedFor(selection);

  return (
    <View style={[styles.card, { padding: LOCKED_TAKE.cardPadding }]}>
      <Text style={styles.cardTitle}>{R8_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R8_CARD_SUBHEADING}</Text>
      <RowGroup row={row} selection={selection} armed={armed} onTap={onTap} />
      <Note take={LOCKED_TAKE} selection={selection} />
      <R9TriggerSection row={row} selection={selection} />
    </View>
  );
}

/** The list group: round-5 take 2's exact background, the margins mirrored */
function RowGroup({
  row,
  selection,
  armed,
  onTap,
}: {
  readonly row: R9CatalogRow;
  readonly selection: R2Selection;
  readonly armed: { readonly muhammad: boolean; readonly dawood: boolean; readonly white: boolean };
  readonly onTap: (key: R2Key) => void;
}) {
  return (
    <View style={styles.group}>
      {R8_ROWS.map((r8Row, index) => (
        <View key={r8Row.key}>
          {index > 0 && <Divider alpha={LOCKED_TAKE.dividerAlpha} />}
          <FastingRow
            row={r8Row}
            selected={rowSelected(selection, r8Row.key)}
            echo={rowEcho(r8Row.key, armed)}
            motif={row}
            onTap={onTap}
          />
        </View>
      ))}
    </View>
  );
}

/** The echo rides the armed rows: Every day never carries a mark */
const rowEcho = (
  key: R2Key,
  armed: { readonly muhammad: boolean; readonly dawood: boolean; readonly white: boolean }
): boolean =>
  (key === 'muhammad' && armed.muhammad) ||
  (key === 'dawood' && armed.dawood) ||
  (key === 'white' && armed.white) ||
  (key === 'every' && selectionIsEvery(armed));

const selectionIsEvery = (armed: {
  readonly muhammad: boolean;
  readonly dawood: boolean;
  readonly white: boolean;
}): boolean => !armed.muhammad && !armed.dawood && !armed.white;

/** Fix 4's line: hairline ink at the computed halfway margins */
function Divider({ alpha }: { readonly alpha: number }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: `rgba(56, 189, 248, ${alpha})`,
        marginVertical: DIVIDER_MARGIN,
      }}
    />
  );
}

/** The note: centred text in the sky's three-shade treatment, icon flush left */
function Note({ take, selection }: { readonly take: (typeof R8_TAKES)[number]; readonly selection: R2Selection }) {
  const text = `rgba(56, 189, 248, 0.85)`;
  const noteStyle = [
    styles.note,
    { backgroundColor: 'rgba(56, 189, 248, 0.10)', borderColor: 'rgba(56, 189, 248, 0.30)' },
  ];

  return (
    <View style={[noteStyle, styles.noteRow]}>
      <InfoGlyph size={take.iconSize} color={text} />
      <Text style={[styles.description, styles.descriptionFlex, { color: text }]}>{r8Description(selection)}</Text>
    </View>
  );
}

/** The small info glyph in the note's own text hue, locked at 12.0 */
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
 * The four rows top-down, round 8's pattern unchanged, with the round-9 echo
 * mark as the row's centre child: space-between keeps the title on the left
 * edge and the toggle on the right edge in both the two- and three-child
 * case, so the locked row pixels cannot move.
 */
function FastingRow({
  row,
  selected,
  echo,
  motif,
  onTap,
}: {
  readonly row: { readonly key: R2Key; readonly title: string };
  readonly selected: boolean;
  readonly echo: boolean;
  readonly motif: R9CatalogRow;
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
      {echo && <R9EchoMark row={motif} />}
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

// The decided row rhythm, round 6's halfway squeeze unchanged
const ROW_GAP = SPACING.py;
const ROW_PAD_V = 7;
const DIVIDER_MARGIN = (ROW_GAP - StyleSheet.hairlineWidth) / 2;

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // The sheet's real card container (Alert.tsx styles.card)
  card: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    marginBottom: SPACING.md,
  },
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
  group: {
    marginTop: SPACING.smd,
    paddingHorizontal: SPACING.mid,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(99, 102, 241, 0.03)',
  },
  note: {
    marginTop: SPACING.smd,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.mid,
    paddingVertical: SPACING.md,
  },
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
