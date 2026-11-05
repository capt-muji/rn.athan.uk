/**
 * The round-11 Fasting card (T-623): the locked take-3 card EXACTLY as
 * finalized, carrying round 11's settled parts. Every mode row's name carries
 * its identity dot ALWAYS - Muhammad green, Dawood cyan, the white days white
 * - even when the row is disabled (round 10's disabled Dawood lost its dot;
 * fixed); Every day reserves the slot invisibly. The NEXT SUHOOR label line
 * carries no dots and speaks the card subheading's muted bluish tone; the
 * entries keep their round-10 identity dots. The calendar is one row of ten
 * small squares (round-9 design 350's size and style) in the fasting card's
 * subcard fill - no mode-colored fills - each armed cell carrying the same
 * bordered circle cluster at cell scale, today marked by its border. The
 * takes extend the sky-bordered note downward so the calendar sits INSIDE it,
 * or keep the calendar a strip below; everything else stays mirror-even.
 * Dev-only: nothing shipped imports here. Every visible string rides in from
 * the models.
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
import { R10DotCluster } from '../r10/dots';
import { R10_ENTRY_COUNT, type R10CalendarDay, type R10Identity, r10IdentitiesFor, r10Relative } from '../r10/model';
import { R11Cluster, R11ModeDot } from './dots';
import { R11_CELL_RING, R11_OVERLAP_STEP, type R11Take, r11CalendarDays } from './model';

// The locked take: round 8 take 3's graded values, pinned by construction
const LOCKED_TAKE = R8_TAKES[2];

/** The identity each row speaks; Every day never shows one */
const ROW_IDENTITY: Record<Exclude<R2Key, 'every'>, R10Identity> = {
  muhammad: 'green',
  dawood: 'cyan',
  white: 'white',
};

interface FastingCardR11Props {
  readonly take: R11Take;
  readonly selection: R2Selection;
  readonly onTap: (key: R2Key) => void;
}

export function FastingCardR11({ take, selection, onTap }: FastingCardR11Props) {
  const now = useMemo(() => new Date(), []);
  const triggers = useMemo(() => r9Triggers(selection, now, R10_ENTRY_COUNT), [selection, now]);
  const calendar = useMemo(() => r11CalendarDays(now, selection), [selection, now]);
  const showCalendar = selection.mode !== 'every';

  return (
    <View style={[styles.card, { padding: LOCKED_TAKE.cardPadding }]}>
      <Text style={styles.cardTitle}>{R8_CARD_TITLE}</Text>
      <Text style={styles.cardSubheading}>{R8_CARD_SUBHEADING}</Text>
      <RowGroup selection={selection} onTap={onTap} />
      <Note take={take} selection={selection} calendar={showCalendar ? calendar : null} />
      {showCalendar && (
        <R11Section
          take={take}
          triggers={triggers}
          now={now}
          withCalendar={take.note === 'below'}
          calendar={calendar}
        />
      )}
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

/**
 * The note: centred text in the sky's three-shade treatment, icon flush
 * left. Round 11's extension: the takes with note 'inside' extend the box
 * downward so the calendar sits INSIDE it, at the take's depth; the others
 * keep the note at its locked height.
 */
function Note({
  take,
  selection,
  calendar,
}: {
  readonly take: R11Take;
  readonly selection: R2Selection;
  readonly calendar: R10CalendarDay[] | null;
}) {
  const text = `rgba(56, 189, 248, 0.85)`;
  const noteStyle = [
    styles.note,
    { backgroundColor: 'rgba(56, 189, 248, 0.10)', borderColor: 'rgba(56, 189, 248, 0.30)' },
  ];

  return (
    <View style={noteStyle}>
      <View style={styles.noteRow}>
        <InfoGlyph size={LOCKED_TAKE.iconSize} color={text} />
        <Text style={[styles.description, styles.descriptionFlex, { color: text }]}>{r8Description(selection)}</Text>
      </View>
      {calendar !== null && take.note === 'inside' && (
        <View style={{ marginTop: take.depth }}>
          <CalendarRow take={take} days={calendar} />
        </View>
      )}
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
 * The four rows top-down, round 8's pattern unchanged, with round 11's
 * identity dot left of the name: the dot shows on EVERY mode row, enabled or
 * disabled; only Every day leaves the slot empty (the reservation keeps its
 * spacing).
 */
function FastingRow({
  row,
  selected,
  identity,
  onTap,
}: {
  readonly row: { readonly key: R2Key; readonly title: string };
  readonly selected: boolean;
  readonly identity: R10Identity;
  readonly onTap: (key: R2Key) => void;
}) {
  const toggleRef = useRef<ToggleHandle>(null);

  const handleRowPress = () => toggleRef.current?.press();
  const handleSwitchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const isModeRow = row.key !== 'every';

  return (
    <Pressable
      style={[styles.row, { paddingVertical: ROW_PAD_V }]}
      hitSlop={HIT_SLOP.md}
      onPress={handleRowPress}
      accessibilityLabel={row.title}>
      <View style={styles.titleWrap}>
        <View style={styles.dotSlot}>{isModeRow && <R11ModeDot identity={identity} size={ROW_DOT} />}</View>
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
 * The round-11 section: the NEXT SUHOOR label - no dots, the card
 * subheading's muted bluish tone, small caps kept - then the next two
 * triggers each with their identity dots, and (when the calendar is not
 * already inside the note) the ten-day calendar strip below.
 */
function R11Section({
  take,
  triggers,
  now,
  withCalendar,
  calendar,
}: {
  readonly take: R11Take;
  readonly triggers: R9Trigger[];
  readonly now: Date;
  readonly withCalendar: boolean;
  readonly calendar: R10CalendarDay[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.headText}>{TRIGGER_HEADING}</Text>
      {triggers.map((trigger) => (
        <EntryLine key={trigger.date} trigger={trigger} now={now} />
      ))}
      {withCalendar && (
        <View style={styles.calendarStrip}>
          <CalendarRow take={take} days={calendar} />
        </View>
      )}
    </View>
  );
}

/** One next-Suhoor entry: its round-10 identity dots, the distance, the time */
function EntryLine({ trigger, now }: { readonly trigger: R9Trigger; readonly now: Date }) {
  const identities = r10IdentitiesFor(trigger.designations);
  return (
    <View style={styles.entryRow}>
      <R10DotCluster identities={identities} size={ENTRY_DOT} />
      <Text style={styles.entryText}>{r10Relative(trigger.at, trigger.date, now)}</Text>
      <Text style={styles.entryTime}>{r9TimeLabel(trigger.time)}</Text>
    </View>
  );
}

/**
 * The ten-day calendar: ONE row of ten small squares, today first. Each
 * square's block sits in the fasting card's subcard fill - no mode-colored
 * fills - with its number inside; an armed day carries the same bordered
 * circle cluster at cell scale, riding the square's top; today's square
 * marks itself by its border, design 350's way.
 */
function CalendarRow({ take, days }: { readonly take: R11Take; readonly days: R10CalendarDay[] }) {
  return (
    <View style={[styles.calendar, { gap: take.gap }]}>
      {days.map((day) => (
        <Cell key={day.date} day={day} take={take} today={day === days[0]} />
      ))}
    </View>
  );
}

function Cell({ day, take, today }: { readonly day: R10CalendarDay; readonly take: R11Take; readonly today: boolean }) {
  const identities = r10IdentitiesFor(day.designations);
  const clusterWidth = take.dot + (identities.length - 1) * take.dot * R11_OVERLAP_STEP;

  return (
    <View
      style={[
        styles.cell,
        {
          width: take.cell,
          height: take.cell,
          borderColor: today ? TODAY_BORDER : CELL_BORDER,
        },
      ]}>
      {identities.length > 0 && (
        <View style={[styles.cellCluster, { top: CELL_CLUSTER_PAD, left: (take.cell - clusterWidth) / 2 }]}>
          <R11Cluster identities={identities} size={take.dot} ring={R11_CELL_RING} />
        </View>
      )}
      <Text style={styles.cellText}>{dayNumber(day.date)}</Text>
    </View>
  );
}

const dayNumber = (date: string): string => String(Number(date.slice(8, 10)));

// The locked take: round 8 take 3's graded values, pinned by construction
const ROW_PAD_V = 7;
const DIVIDER_MARGIN = (SPACING.py - StyleSheet.hairlineWidth) / 2;
const ROW_DOT = 7;
const ENTRY_DOT = 8;
const CELL_CLUSTER_PAD = 1.5;
const CELL_BORDER = 'rgba(148, 163, 184, 0.25)';
const TODAY_BORDER = 'rgba(216, 234, 248, 0.4)';
const SUBCARD_FILL = 'rgba(99, 102, 241, 0.03)';

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
    backgroundColor: SUBCARD_FILL,
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
  headText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: COLORS.text.sheetSubtitle,
    marginBottom: 7,
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
  calendarStrip: {
    marginTop: 8,
  },
  calendar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: SUBCARD_FILL,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cellCluster: {
    position: 'absolute',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 9,
    color: 'rgba(216, 234, 248, 0.55)',
    paddingBottom: 1.5,
  },
});
