/**
 * The fasting card (design 427, round-11 take 2): the locked round-8 take-3
 * card values - 16 uniform padding, the indigo list fill, the separators
 * faded to alpha 0.036 halfway between rows, the sky note in three shades of
 * rgb 56,189,248 with the 12.0 flush-left info glyph and centred period-free
 * copy - carrying round 11's settled parts: every mode row's identity dot
 * always on, the next-two Suhoor entries with their identity dots, and the
 * ten-day calendar as one strip of small squares below the note, today first
 * and bordered, each armed cell carrying the bordered cluster at cell scale.
 * The whole next-Suhoor section hides on Every day. The card rides the
 * sheet's own draft-and-commit: it takes the selection and hands back the tap
 * rule's landing, committing nothing itself. The trigger schedule computes
 * from the baked timetable at render, so a fresh sheet open reads fresh.
 */

import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Toggle, { type ToggleHandle } from '@/components/sheets/parts/Toggle';
import { FASTING_CELL_RING, FastingBiteCluster, FastingDot, FastingRingCluster } from '@/components/ui';
import type { PrayerId } from '@/shared/constants';
import { COLORS, HIT_SLOP, RADIUS, SPACING, TEXT } from '@/shared/constants';
import {
  FASTING_CALENDAR_DAYS,
  FASTING_ENTRY_COUNT,
  type FastingCalendarDay,
  type FastingIdentity,
  type FastingTrigger,
  fastingCalendarDays,
  fastingIdentitiesFor,
  fastingRelative,
  fastingSettingsFor,
  fastingWeekdayKey,
  hasFastingIdentities,
  nextFastingTriggers,
} from '@/shared/fastingSchedule';
import { fastingDescriptionKey, nextFastingSelection, sanitizeFastingSelection } from '@/shared/fastingSelection';
import { type TranslationKey, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import * as PrayerUtils from '@/shared/prayer';
import { isReadable } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type FastingMode, type FastingSelection, ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { fastingDawoodAnchorAtom } from '@/stores/notifications';
import { show24HourFormatAtom } from '@/stores/ui';

/** The four options in sheet order: Every day, Muhammad, Dawood, Three white days */
const FASTING_ROWS: readonly FastingMode[] = ['everyDay', 'muhammad', 'dawood', 'whiteDays'];

const ROW_TITLE: Record<FastingMode, TranslationKey> = {
  everyDay: 'fasting.mode.everyDay',
  muhammad: 'fasting.mode.muhammad',
  dawood: 'fasting.mode.dawood',
  whiteDays: 'fasting.mode.whiteDays',
};

/** The identity each row's dot speaks; Every day reserves the slot invisibly */
const ROW_IDENTITY: Record<FastingMode, FastingIdentity | null> = {
  everyDay: null,
  muhammad: 'green',
  dawood: 'cyan',
  whiteDays: 'white',
};

// The locked card values (round 8 take 3) and design 427's own numbers
const CARD_PADDING = 16;
const DIVIDER_ALPHA = 0.036;
const INFO_GLYPH = 12.0;
const ROW_PAD_V = 7;
const DIVIDER_MARGIN = (SPACING.py - StyleSheet.hairlineWidth) / 2;
const ROW_DOT = 7;
const ENTRY_DOT = 8;
const CELL_SIZE = 20;
const CELL_GAP = 3;
const CELL_DOT = 6.5;
const CELL_CLUSTER_PAD = 1.5;
const CELL_BORDER = 'rgba(148, 163, 184, 0.25)';
const TODAY_BORDER = 'rgba(216, 234, 248, 0.4)';
const SUBCARD_FILL = 'rgba(99, 102, 241, 0.03)';
const SKY_BG = 'rgba(56, 189, 248, 0.10)';
const SKY_BORDER = 'rgba(56, 189, 248, 0.30)';

// Text ink is solid (the owner's standing order): each constant is the design's
// alpha ink flattened over its own fixed background stack - the note over the
// card, the entries over the card, the numbers over the cell fill - so the
// pixels the locked design pins are the pixels these paint
const SKY_INK = '#33a7e0';
const ENTRY_INK = '#c8daea';
const ENTRY_TIME_INK = '#7e8ea7';
const CELL_INK = '#7f8faa';

// The string guard reads attribute-held literals as copy; these are code values
const SUHOOR: PrayerId = 'suhoor';
const INFO_GLYPH_CHAR = 'i';

// The glyph's own text rides at 62.5 percent of the circle, on a 75 percent line
const GLYPH_TEXT_SIZE = INFO_GLYPH * 0.625;
const GLYPH_TEXT_LINE = INFO_GLYPH * 0.75;

interface FastingCardProps {
  selection: FastingSelection;
  onSelectionChange: (next: FastingSelection) => void;
}

export default function FastingCard({ selection, onSelectionChange }: FastingCardProps) {
  const use24Hour = useAtomValue(show24HourFormatAtom);
  const anchorMs = useAtomValue(fastingDawoodAnchorAtom);

  const current = sanitizeFastingSelection(selection);

  const suhoorRowAt = (date: string) => {
    const prayer = PrayerUtils.getPrayerForDate(ScheduleType.Extra, SUHOOR, date);
    return prayer !== null && isReadable(prayer) && prayer.datetime !== null
      ? { at: prayer.datetime, time: prayer.time }
      : null;
  };

  // The walks read the baked timetable at render: a fresh sheet open reads
  // fresh, and every draft tap recomputes against the tapped selection
  const now = new Date();
  const settings = fastingSettingsFor(current, now.getTime(), anchorMs);
  const showSchedule = current.mode !== 'everyDay';
  const triggers = showSchedule ? nextFastingTriggers(settings, now, FASTING_ENTRY_COUNT, suhoorRowAt) : [];
  const calendar = showSchedule ? fastingCalendarDays(settings, now, FASTING_CALENDAR_DAYS, suhoorRowAt) : [];

  const handleTap = (mode: FastingMode) => onSelectionChange(nextFastingSelection(current, mode));

  return (
    <View style={[styles.card, { padding: CARD_PADDING }]}>
      <Text style={styles.cardTitle}>{t('fasting.card.title')}</Text>
      <Text style={styles.cardHint}>{t('fasting.card.hint')}</Text>
      <RowGroup current={current} onTap={handleTap} />
      <View style={styles.note}>
        <View style={styles.noteRow}>
          <InfoGlyph />
          <Text style={styles.description}>{t(fastingDescriptionKey(current))}</Text>
        </View>
      </View>
      {showSchedule && (
        <View style={styles.section}>
          <Text style={styles.headText}>{t('fasting.next.label')}</Text>
          {triggers.map((trigger) => (
            <EntryLine key={trigger.date} trigger={trigger} now={now} use24Hour={use24Hour} />
          ))}
          <View style={styles.calendarStrip}>
            <View style={[styles.calendar, { gap: CELL_GAP }]}>
              {calendar.map((day, index) => (
                <Cell key={day.date} day={day} today={index === 0} />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const rowSelected = (current: FastingSelection, mode: FastingMode): boolean =>
  mode === 'whiteDays' ? current.mode === 'whiteDays' || current.whiteDaysAddOn : current.mode === mode;

/** The list group: the round-5 fill, the rows top-down, the separators halfway between */
function RowGroup({
  current,
  onTap,
}: {
  readonly current: FastingSelection;
  readonly onTap: (mode: FastingMode) => void;
}) {
  return (
    <View style={styles.group}>
      {FASTING_ROWS.map((mode, index) => (
        <View key={mode}>
          {index > 0 && <Divider />}
          <FastingRow mode={mode} selected={rowSelected(current, mode)} onTap={onTap} />
        </View>
      ))}
    </View>
  );
}

/** The hairline separator, computed to sit exactly halfway between its two rows */
function Divider() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: `rgba(56, 189, 248, ${DIVIDER_ALPHA})`,
        marginVertical: DIVIDER_MARGIN,
      }}
    />
  );
}

/** The small info glyph in the note's own text hue, locked at 12.0 */
function InfoGlyph() {
  return (
    <View style={[styles.infoGlyph, { width: INFO_GLYPH, height: INFO_GLYPH, borderRadius: INFO_GLYPH / 2 }]}>
      <Text style={styles.infoGlyphText}>{INFO_GLYPH_CHAR}</Text>
    </View>
  );
}

/** One option row: its identity dot always on (Every day reserving the slot), the real toggle on the right */
function FastingRow({
  mode,
  selected,
  onTap,
}: {
  readonly mode: FastingMode;
  readonly selected: boolean;
  readonly onTap: (mode: FastingMode) => void;
}) {
  const toggleRef = useRef<ToggleHandle>(null);
  const title = t(ROW_TITLE[mode]);
  const identity = ROW_IDENTITY[mode];

  return (
    <Pressable
      style={[styles.row, { paddingVertical: ROW_PAD_V }]}
      hitSlop={HIT_SLOP.md}
      onPress={() => toggleRef.current?.press()}
      accessibilityLabel={title}>
      <View style={styles.titleWrap}>
        <View style={styles.dotSlot}>{identity !== null && <FastingDot identity={identity} size={ROW_DOT} />}</View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Toggle
        ref={toggleRef}
        value={selected}
        onToggle={() => onTap(mode)}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        accessibilityLabel={title}
      />
    </Pressable>
  );
}

/** One next-Suhoor entry: its identity dots, the spoken distance, the wall time */
function EntryLine({
  trigger,
  now,
  use24Hour,
}: {
  readonly trigger: FastingTrigger;
  readonly now: Date;
  readonly use24Hour: boolean;
}) {
  const identities = fastingIdentitiesFor(trigger.designations);
  const distance = fastingRelative(trigger.at, now);

  const spoken =
    'hours' in distance
      ? t(distance.hours === 1 ? 'fasting.next.hour' : 'fasting.next.hours', { n: distance.hours })
      : t('fasting.next.withWeekday', {
          distance: t(distance.days === 1 ? 'fasting.next.day' : 'fasting.next.days', { n: distance.days }),
          weekday: t(fastingWeekdayKey(trigger.date)),
        });

  return (
    <View style={styles.entryRow}>
      <FastingBiteCluster identities={identities} size={ENTRY_DOT} />
      <Text style={styles.entryText}>{spoken}</Text>
      <Text style={styles.entryTime}>{TimeUtils.formatDisplayTime(trigger.time, use24Hour)}</Text>
    </View>
  );
}

/** One calendar square: the subcard fill, its number, the armed cluster riding its top, today by its border */
function Cell({ day, today }: { readonly day: FastingCalendarDay; readonly today: boolean }) {
  const identities = fastingIdentitiesFor(day.designations);

  return (
    <View
      style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE, borderColor: today ? TODAY_BORDER : CELL_BORDER }]}>
      {hasFastingIdentities(identities) && (
        <View style={styles.cellCluster}>
          <FastingRingCluster identities={identities} size={CELL_DOT} ring={FASTING_CELL_RING} />
        </View>
      )}
      <Text style={styles.cellText}>{String(Number(day.date.slice(8, 10)))}</Text>
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  // The sheet's card container (the Athan and Reminder cards' own)
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
  cardHint: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    color: COLORS.text.sheetSubtitle,
  },
  group: {
    marginTop: SPACING.smd,
    paddingHorizontal: SPACING.mid,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.lg,
    backgroundColor: SUBCARD_FILL,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
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
  note: {
    marginTop: SPACING.smd,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: SKY_BG,
    borderColor: SKY_BORDER,
    paddingHorizontal: SPACING.mid,
    paddingVertical: SPACING.md,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  description: {
    flex: 1,
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyRegular,
    lineHeight: ty.lineHeight(20),
    color: SKY_INK,
    textAlign: 'center',
  },
  infoGlyph: {
    borderWidth: 1,
    borderColor: SKY_INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyphText: {
    fontSize: GLYPH_TEXT_SIZE,
    lineHeight: GLYPH_TEXT_LINE,
    fontFamily: ty.familyMedium,
    color: SKY_INK,
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
    color: ENTRY_INK,
    flexShrink: 1,
  },
  entryTime: {
    fontSize: 11,
    color: ENTRY_TIME_INK,
    marginStart: 'auto',
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
    top: CELL_CLUSTER_PAD,
    start: 0,
    end: 0,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 9,
    fontFamily: ty.familyDigits,
    color: CELL_INK,
    paddingBottom: 1.5,
  },
});
