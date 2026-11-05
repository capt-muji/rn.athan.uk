/**
 * The round-10 Fasting card (T-623): the locked take-3 card EXACTLY as
 * finalized, carrying round 10's three parts. Each armed row's name gains
 * its mode identity dot (Muhammad green, Dawood cyan, the white days white);
 * every row reserves the same slot so spacing never shifts, and Every day
 * never shows one. Under the note sits the round-10 section - the NEXT
 * SUHOOR header beside the armed cluster motif, the next two triggers with
 * their identity dots, and the two-week calendar (today first, two rows of
 * seven, mode-colored cells, combos carrying both identities in the take's
 * treatment) - hidden entirely on Every day. Dev-only: nothing shipped
 * imports here. Every visible string rides in from the models.
 */

import * as Haptics from 'expo-haptics';
import { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Toggle, { type ToggleHandle } from '@/components/sheets/parts/Toggle';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

import type { R2Key, R2Selection } from '../r2/model';
import { R8_TAKES } from '../r8/FastingCardR8';
import { R8_CARD_SUBHEADING, R8_CARD_TITLE, R8_INFO_GLYPH, R8_ROWS, r8Description } from '../r8/model';
import { type R9Trigger, r9TimeLabel, r9Triggers, TRIGGER_HEADING } from '../r9/model';
import { R10DotCluster, R10ModeDot } from './dots';
import {
  R10_CALENDAR_COLUMNS,
  R10_ENTRY_COUNT,
  R10_ON_FILL,
  type R10CalendarDay,
  type R10Identity,
  type R10Take,
  r10ArmedIdentities,
  r10CalendarDays,
  r10IdentitiesFor,
  r10IdentityColor,
  r10Relative,
} from './model';

// The locked take: round 8 take 3's graded values, pinned by construction
const LOCKED_TAKE = R8_TAKES[2];

/** The identity each armed row speaks; Every day never shows one */
const ROW_IDENTITY: Record<Exclude<R2Key, 'every'>, R10Identity> = {
  muhammad: 'green',
  dawood: 'cyan',
  white: 'white',
};

/** Whether the row's mode is armed under the selection; Every day never is */
const rowArmed = (key: R2Key, selection: R2Selection): boolean => {
  if (key === 'muhammad') return selection.mode === 'muhammad';
  if (key === 'dawood') return selection.mode === 'dawood';
  if (key === 'white') return selection.white && selection.mode !== 'every';
  return false;
};

interface FastingCardR10Props {
  readonly take: R10Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR10({ take, selection, onTap }: FastingCardR10Props) {
  const armed = r10ArmedIdentities(selection);

  return (
    <View style={[styles.card, { padding: LOCKED_TAKE.cardPadding }]}>
      <Text style={styles.cardTitle}>{R8_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R8_CARD_SUBHEADING}</Text>
      <RowGroup selection={selection} onTap={onTap} />
      <Note take={LOCKED_TAKE} selection={selection} />
      {selection.mode !== 'every' && <R10Section take={take} selection={selection} armedIdentities={armed} />}
    </View>
  );
}

/** The list group: round-5 take 2's exact background, the margins mirrored */
function RowGroup({ selection, onTap }: { readonly selection: R2Selection; readonly onTap: (key: R2Key) => void }) {
  return (
    <View style={styles.group}>
      {R8_ROWS.map((r8Row, index) => (
        <View key={r8Row.key}>
          {index > 0 && <Divider alpha={LOCKED_TAKE.dividerAlpha} />}
          <FastingRow
            row={r8Row}
            selected={rowSelected(selection, r8Row.key)}
            identity={r8Row.key === 'every' ? 'white' : ROW_IDENTITY[r8Row.key]}
            armed={rowArmed(r8Row.key, selection)}
            onTap={onTap}
          />
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
 * The four rows top-down, round 8's pattern unchanged, with round 10's
 * identity dot left of the name: the dot slot renders on every row (visible
 * only when that row's mode is armed) so no title ever shifts.
 */
function FastingRow({
  row,
  selected,
  identity,
  armed,
  onTap,
}: {
  readonly row: { readonly key: R2Key; readonly title: string };
  readonly selected: boolean;
  readonly identity: R10Identity;
  readonly armed: boolean;
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
      <View style={styles.titleWrap}>
        <View style={styles.dotSlot}>{armed && <R10ModeDot identity={identity} size={ROW_DOT} />}</View>
        <Text style={styles.rowTitle}>{row.title}</Text>
      </View>
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

/**
 * The round-10 section: the NEXT SUHOOR header beside the armed cluster
 * motif, then the take's notes - the next two triggers each with its
 * identity dots, the two-week calendar, or the calendar alone. Every day
 * never renders it (the card's own gate above).
 */
function R10Section({
  take,
  selection,
  armedIdentities,
}: {
  readonly take: R10Take;
  readonly selection: R2Selection;
  readonly armedIdentities: R10Identity[];
}) {
  const now = useMemo(() => new Date(), []);
  const triggers = useMemo(() => r9Triggers(selection, now, R10_ENTRY_COUNT), [selection, now]);
  const calendar = useMemo(() => r10CalendarDays(now, selection), [selection, now]);

  return (
    <View style={[styles.section, take.compact ? styles.sectionCompact : null]}>
      <View style={styles.headRow}>
        <R10DotCluster identities={armedIdentities} size={8} />
        <Text style={styles.headText}>{TRIGGER_HEADING}</Text>
      </View>
      {take.section === 'both' &&
        triggers.map((trigger) => <EntryLine key={trigger.date} trigger={trigger} now={now} />)}
      <Calendar take={take} days={calendar} />
    </View>
  );
}

/** One next-Suhoor entry: its identity dots, the relative distance, the time */
function EntryLine({ trigger, now }: { readonly trigger: R9Trigger; readonly now: Date }) {
  const identities = r10IdentitiesFor(trigger.designations);
  return (
    <View style={styles.entryRow}>
      <R10DotCluster identities={identities} size={8} />
      <Text style={styles.entryText}>{r10Relative(trigger.at, trigger.date, now)}</Text>
      <Text style={styles.entryTime}>{r9TimeLabel(trigger.time)}</Text>
    </View>
  );
}

/** The two-week calendar: two rows of seven, today first, centre-aligned */
function Calendar({ take, days }: { readonly take: R10Take; readonly days: R10CalendarDay[] }) {
  const rows: R10CalendarDay[][] = [];
  for (let start = 0; start < days.length; start += R10_CALENDAR_COLUMNS) {
    rows.push(days.slice(start, start + R10_CALENDAR_COLUMNS));
  }

  return (
    <View style={styles.calendar}>
      {rows.map((week, index) => (
        <View key={week[0]?.date ?? index} style={styles.calendarRow}>
          {week.map((day) => (
            <Cell key={day.date} day={day} take={take} today={day === days[0]} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * One calendar cell: unarmed days stay hairline outlines, armed days carry
 * their identities (solid fill per mode, combos through the take's
 * treatment), today wears a ring around whichever cell it lands on.
 */
function Cell({ day, take, today }: { readonly day: R10CalendarDay; readonly take: R10Take; readonly today: boolean }) {
  const identities = r10IdentitiesFor(day.designations);
  const combo = identities.length > 1;
  const body = (
    <View style={[styles.cell, { width: take.compact ? CELL_COMPACT : CELL_ROOMY, height: cellHeight(take) }]}>
      <CellFill identities={identities} combo={combo} take={take} />
      <Text
        style={[
          styles.cellText,
          identities.length > 0 && !(combo && take.combo === 'mini-dots') ? styles.cellTextInk : null,
        ]}>
        {dayNumber(day.date)}
      </Text>
    </View>
  );

  if (!today) return body;
  return <View style={styles.todayRing}>{body}</View>;
}

/** The identities' paint under the day number, per the take's combo treatment */
function CellFill({
  identities,
  combo,
  take,
}: {
  readonly identities: R10Identity[];
  readonly combo: boolean;
  readonly take: R10Take;
}) {
  if (identities.length === 0) return null;

  if (!combo) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: r10IdentityColor(identities[0]!) }]} />;
  }

  if (take.combo === 'split') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.cellSplit]}>
        <View style={[styles.cellSplitHalf, { backgroundColor: r10IdentityColor(identities[0]!) }]} />
        <View style={[styles.cellSplitHalf, { backgroundColor: r10IdentityColor(identities[1]!) }]} />
      </View>
    );
  }

  if (take.combo === 'two-tone') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: r10IdentityColor(identities[0]!) }]}>
        <View style={[styles.cellRingInner, { backgroundColor: r10IdentityColor(identities[1]!) }]}>
          <View style={styles.cellRingCore} />
        </View>
      </View>
    );
  }

  if (take.combo === 'bite') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: r10IdentityColor(identities[0]!) }]}>
        <View style={[styles.cellBiteMoon, { backgroundColor: r10IdentityColor(identities[1]!) }]} />
      </View>
    );
  }

  // mini-dots: a faint first-identity wash and the stacked mini dots above the number
  return (
    <View style={[StyleSheet.absoluteFill, styles.cellMini]}>
      <View style={styles.cellMiniRow}>
        <R10DotCluster identities={identities} size={4} />
      </View>
    </View>
  );
}

const cellHeight = (take: R10Take): number =>
  (take.compact ? CELL_COMPACT : CELL_ROOMY) + (take.combo === 'mini-dots' ? 8 : 3);

const dayNumber = (date: string): string => String(Number(date.slice(8, 10)));

// The locked take: round 8 take 3's graded values, pinned by construction
const ROW_PAD_V = 7;
const DIVIDER_MARGIN = (SPACING.py - StyleSheet.hairlineWidth) / 2;
const ROW_DOT = 7;
const CELL_ROOMY = 23;
const CELL_COMPACT = 21;

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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotSlot: {
    width: ROW_DOT + 7,
    height: ROW_DOT,
    alignItems: 'flex-start',
    justifyContent: 'center',
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
  section: {
    marginTop: 12,
    paddingHorizontal: 2,
  },
  sectionCompact: {
    marginTop: 8,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  headText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(216, 234, 248, 0.55)',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 3,
  },
  entryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(216, 234, 248, 0.92)',
    flexShrink: 1,
  },
  entryTime: {
    fontSize: 11,
    color: 'rgba(216, 234, 248, 0.55)',
    marginLeft: 'auto',
  },
  calendar: {
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cell: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cellText: {
    fontSize: 9,
    color: 'rgba(216, 234, 248, 0.55)',
    paddingBottom: 3,
  },
  cellTextInk: {
    color: R10_ON_FILL,
    fontWeight: '700',
  },
  todayRing: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(216, 234, 248, 0.5)',
    padding: 1,
  },
  cellSplit: {
    flexDirection: 'row',
  },
  cellSplitHalf: {
    flex: 1,
  },
  cellRingInner: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: 5.5,
  },
  cellRingCore: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 26, 46, 0.9)',
  },
  cellBiteMoon: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    right: -13,
    top: 3,
  },
  cellMini: {
    backgroundColor: 'rgba(216, 234, 248, 0.07)',
  },
  cellMiniRow: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
