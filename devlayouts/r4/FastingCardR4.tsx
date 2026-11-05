/**
 * The round-4 Fasting card (T-623): the owner's decided design - toggle
 * switches in a top-down list - in five presentation takes. The card
 * container, row rhythm and inks mirror the sheet's real card (Alert.tsx /
 * FastingCard.tsx styles); the switch is the app's real Toggle; RTL mirrors
 * the sides through the row's own flex direction. The five takes differ only
 * in the card's internal presentation:
 *   1. hairline dividers between rows, description as the card's footer
 *   2. no dividers, description directly under the list in dim text
 *   3. rows grouped as an inset sub-card, description at the group's bottom
 *   4. description above the list right under the card subheading
 *   5. gap-separated rows, description in a soft-background note box
 * Dev-only: nothing shipped imports here. Every visible string rides in from
 * the model as a hoisted literal.
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
import { R4_CARD_SUBHEADING, R4_CARD_TITLE, R4_ROWS, type R4Row, r4Description } from './model';

export type R4Design = 1 | 2 | 3 | 4 | 5;

const DIVIDER_COLOR = 'rgba(99, 102, 241, 0.12)';
const GROUP_BACKGROUND = 'rgba(99, 102, 241, 0.10)';

interface FastingCardR4Props {
  readonly design: R4Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR4({ design, selection, onTap }: FastingCardR4Props) {
  const description = (
    <Text style={[styles.description, isDimDescription(design) ? null : styles.descriptionInk]}>
      {r4Description(selection)}
    </Text>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{R4_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R4_CARD_SUBHEADING}</Text>
      {design === 4 && <View style={styles.descriptionAbove}>{description}</View>}
      {design === 3 ? (
        <View style={styles.group}>
          <ToggleList design={design} selection={selection} onTap={onTap} />
          <View style={styles.groupFooter}>{description}</View>
        </View>
      ) : (
        <>
          <ToggleList design={design} selection={selection} onTap={onTap} />
          {design === 5 ? (
            <View style={styles.noteBox}>{description}</View>
          ) : (
            design !== 4 && <View style={styles.footer}>{description}</View>
          )}
        </>
      )}
    </View>
  );
}

/** The description sits dim in takes 2 and 5, the sheet's own ink elsewhere */
const isDimDescription = (design: R4Design): boolean => design === 2 || design === 5;

/**
 * The four rows top-down. Each row routes its press through the switch's own
 * press (the LabeledToggle pattern), so the flip, the haptic and the write
 * settle identically whichever side was touched.
 */
function ToggleList({
  design,
  selection,
  onTap,
}: {
  readonly design: R4Design;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}) {
  return (
    <View style={[styles.list, design === 5 && styles.gapList]}>
      {R4_ROWS.map((row, index) => (
        <FastingRow
          key={row.key}
          row={row}
          index={index}
          divided={design === 1}
          selected={rowSelected(selection, row.key)}
          onTap={onTap}
        />
      ))}
    </View>
  );
}

const rowSelected = (selection: R2Selection, key: R2Key): boolean =>
  key === 'white' ? selection.white : selection.mode === key;

function FastingRow({
  row,
  index,
  divided,
  selected,
  onTap,
}: {
  readonly row: R4Row;
  readonly index: number;
  readonly divided: boolean;
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
      style={[styles.row, divided && index > 0 && styles.rowDivided]}
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
  list: {
    marginTop: SPACING.sm,
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
    paddingVertical: SPACING.smd,
  },
  // Take 1's hairline dividers; every other take renders the rows bare
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER_COLOR,
  },
  // Take 5's gap-separated rows
  gapList: {
    gap: SPACING.xs,
  },
  // Take 3's inset sub-card
  group: {
    backgroundColor: GROUP_BACKGROUND,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.smd,
    marginTop: SPACING.md,
  },
  groupFooter: {
    marginTop: SPACING.smd,
  },
  // Take 5's soft-background note box
  noteBox: {
    backgroundColor: GROUP_BACKGROUND,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.smd,
    marginTop: SPACING.md,
  },
  footer: {
    marginTop: SPACING.md,
  },
  descriptionAbove: {
    marginTop: SPACING.smd,
    marginBottom: SPACING.sm,
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
