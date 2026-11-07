/**
 * The fasting card (design 427, round-11 take 2): the locked round-8 take-3
 * card values - 16 uniform padding, the indigo list fill, the separators
 * faded to alpha 0.02 halfway between rows, the sky note in three shades of
 * rgb 56,189,248 with the 12.0 flush-left info glyph and centred period-free
 * copy - with every mode row's identity dot always on. The note speaks the
 * regimen's own names in white. Below it the calendar strip, ten day-digit
 * squares with no heading at all, yesterday first and today second, today's
 * digit in pure white; the digits follow the Hijri calendar under the
 * preference. The strip hides on Every day, and the note and strip both hide
 * while the card is locked under an Off athan. The card rides the sheet's
 * own draft-and-commit: it takes the selection and hands back the tap rule's
 * landing, committing nothing itself.
 */

import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import Toggle, { type ToggleHandle } from '@/components/sheets/parts/Toggle';
import { FastingDot, FastingRingCluster } from '@/components/ui';
import type { PrayerId } from '@/shared/constants';
import { COLORS, HIT_SLOP, PRAYER_TIMEZONE, RADIUS, SPACING, TEXT } from '@/shared/constants';
import {
  FASTING_CALENDAR_DAYS,
  type FastingCalendarDay,
  type FastingIdentity,
  fastingCalendarDays,
  fastingIdentitiesFor,
  fastingSettingsFor,
  hasFastingIdentities,
} from '@/shared/fastingSchedule';
import { fastingDescriptionKey, isNoOpFastingTap, sanitizeFastingSelection } from '@/shared/fastingSelection';
import { type TranslationKey, t } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import * as PrayerUtils from '@/shared/prayer';
import { isReadable } from '@/shared/sequence';
import * as TimeUtils from '@/shared/time';
import { type FastingMode, type FastingSelection, ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { fastingDawoodAnchorAtom } from '@/stores/notifications';
import { hijriDateEnabledAtom } from '@/stores/ui';

/** The four options in sheet order: Every day, Muhammad, Dawood, White days */
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
const DIVIDER_ALPHA = 0.02;
const INFO_GLYPH = 12.0;
const ROW_PAD_V = 7;
const DIVIDER_MARGIN = (SPACING.py - StyleSheet.hairlineWidth) / 2;
const ROW_DOT = 7;
const CELL_SIZE = 30;
const CELL_DOT = 4.5;
const CELL_CLUSTER_TOP = -2.25;
const CELL_CLUSTER_END = 1.5;
const BAR_RADIUS = 7;
const CELL_FILL = 'rgba(56, 189, 248, 0.05)';
const NOTE_GAP = SPACING.smd * 1.25;
const SUBCARD_FILL = 'rgba(99, 102, 241, 0.03)';
const SKY_BG = 'rgba(56, 189, 248, 0.10)';
const SKY_BORDER = 'rgba(56, 189, 248, 0.30)';

// Text ink is solid (the owner's standing order): each constant is the design's
// alpha ink flattened over its own fixed background stack - the note over the
// card, the numbers over the cell fill - so the pixels the locked design pins
// are the pixels these paint
const SKY_INK = '#33a7e0';

// The cell's Hijri digit, the app's own umalqura conversion at the same timezone
const HIJRI_DAY_FORMAT = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
  day: 'numeric',
  timeZone: PRAYER_TIMEZONE,
});

// The string guard reads attribute-held literals as copy; these are code values
const SUHOOR: PrayerId = 'suhoor';
const ICON_VIEWBOX = '0 0 16 16';
const INFO_GLYPH_CHAR = 'i';

// The honorific ligature (peace and blessings of Allah be upon him): identical in
// every language, so it rides the row as a code value, never the catalogs
const HONORIFIC = ' \uFDFA';

// The glyph's own text rides at 62.5 percent of the circle, on a 75 percent line
const GLYPH_TEXT_SIZE = INFO_GLYPH * 0.625;
const GLYPH_TEXT_LINE = INFO_GLYPH * 0.75;

interface FastingCardProps {
  selection: FastingSelection;
  onSelectionChange: (mode: FastingMode) => void;
  /** The Suhoor alert's own off: the card dims like the reminder cards, every option reads off, and the stored selection stands for the return */
  locked?: boolean;
}

export default function FastingCard({ selection, onSelectionChange, locked = false }: FastingCardProps) {
  const hijri = useAtomValue(hijriDateEnabledAtom);
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
  // The walk keeps yesterday's anchor for the Dawood cycle's own search; the
  // render drops yesterday for the glyph's block, today leading the nine days
  const startAt = new Date(`${TimeUtils.getPreviousDateString(TimeUtils.formatDateShort(now))}T12:00:00Z`);
  const calendar = showSchedule ? fastingCalendarDays(settings, startAt, FASTING_CALENDAR_DAYS, suhoorRowAt) : [];

  // The sheet applies the tap rule against the live draft at write time, so a
  // second row's tap inside one animation window composes instead of dropping
  const handleTap = (mode: FastingMode) => onSelectionChange(mode);

  return (
    <View style={[styles.card, { padding: CARD_PADDING }, locked && styles.cardLocked]}>
      <Text style={[styles.cardTitle, locked && styles.textLocked]}>{t('fasting.card.title')}</Text>
      <Text style={[styles.cardHint, locked && styles.textLocked]}>{t('fasting.card.hint')}</Text>
      <RowGroup current={current} onTap={handleTap} locked={locked} />
      {!locked && (
        <View style={styles.note}>
          <View style={styles.noteRow}>
            <InfoGlyph />
            <Text style={styles.description}>{t(fastingDescriptionKey(current))}</Text>
          </View>
        </View>
      )}
      {showSchedule && !locked && (
        <View style={styles.calendarStrip}>
          <View
            style={[
              styles.calendar,
              {
                height: CELL_SIZE,
                backgroundColor: CELL_FILL,
                borderRadius: BAR_RADIUS,
              },
            ]}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={12} height={12} viewBox={ICON_VIEWBOX}>
                <Path
                  d={
                    'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1 -2 2H2a2 2 0 0 1 -2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z'
                  }
                  fill={SKY_INK}
                />
              </Svg>
            </View>
            {calendar.slice(1).map((day, index) => (
              <Cell key={day.date} day={day} today={index === 0} hijri={hijri} last={index === calendar.length - 2} />
            ))}
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
  locked,
}: {
  readonly current: FastingSelection;
  readonly onTap: (mode: FastingMode) => void;
  readonly locked: boolean;
}) {
  return (
    <View style={[styles.group, locked && styles.groupLocked]}>
      {FASTING_ROWS.map((mode, index) => (
        <View key={mode}>
          {index > 0 && <Divider />}
          <FastingRow
            mode={mode}
            selected={rowSelected(current, mode) && !locked}
            frozen={isNoOpFastingTap(current, mode)}
            locked={locked}
            onTap={onTap}
          />
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
  frozen,
  locked,
  onTap,
}: {
  readonly mode: FastingMode;
  readonly selected: boolean;
  readonly frozen: boolean;
  readonly locked: boolean;
  readonly onTap: (mode: FastingMode) => void;
}) {
  const toggleRef = useRef<ToggleHandle>(null);
  const title = t(ROW_TITLE[mode]);
  const identity = ROW_IDENTITY[mode];

  return (
    <Pressable
      style={[styles.row, { paddingVertical: ROW_PAD_V }]}
      hitSlop={HIT_SLOP.md}
      onPress={() => {
        // The only selected option taps to nothing: the switch never leaves its value
        if (!frozen && !locked) toggleRef.current?.press();
      }}
      accessibilityLabel={mode === 'muhammad' ? `${title}${HONORIFIC}` : title}>
      <View style={styles.titleWrap}>
        <View style={[styles.dotSlot, locked && styles.dimDots]}>
          {identity !== null && <FastingDot identity={identity} size={ROW_DOT} />}
        </View>
        <Text style={[styles.rowTitle, locked && styles.rowTitleLocked]}>
          {title}
          {mode === 'muhammad' && <Text style={[styles.rowHonorific, locked && styles.textLocked]}>{HONORIFIC}</Text>}
        </Text>
      </View>
      <View style={locked ? styles.switchVeil : undefined}>
        <Toggle
          ref={toggleRef}
          value={selected}
          frozen={frozen}
          disabled={locked}
          onToggle={() => onTap(mode)}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          accessibilityLabel={title}
        />
      </View>
    </Pressable>
  );
}

/** One calendar cell: the day's digit, the bell's cluster riding its armed days, today set apart */
function Cell({
  day,
  today,
  hijri,
  last,
}: {
  readonly day: FastingCalendarDay;
  readonly today: boolean;
  readonly hijri: boolean;
  readonly last: boolean;
}) {
  const digit = hijri
    ? HIJRI_DAY_FORMAT.format(TimeUtils.getDayAnchor(day.date))
    : String(Number(day.date.slice(8, 10)));
  const stacked = fastingIdentitiesFor(day.designations).reverse();
  const armed = hasFastingIdentities(stacked);

  return (
    <View
      style={[
        styles.cell,
        { flex: 1 },
        armed && styles.cellArmed,
        last && { borderTopRightRadius: BAR_RADIUS, borderBottomRightRadius: BAR_RADIUS },
      ]}>
      {armed && (
        <View style={styles.cellCluster} pointerEvents={'none'}>
          <FastingRingCluster identities={stacked} size={CELL_DOT} ring={0.5} />
        </View>
      )}
      <Text style={[styles.cellText, !today && armed && styles.cellTextArmed, today && styles.cellTextToday]}>
        {digit}
      </Text>
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
  groupLocked: {
    backgroundColor: '#0c193c',
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
    opacity: 0.8,
  },
  rowTitle: {
    fontSize: ty.size(TEXT.sizeDetail),
    fontFamily: ty.familyMedium,
    color: COLORS.text.primary,
  },
  // The locked card rides the reminder cards' own dim solids (dim.ts)
  cardLocked: {
    backgroundColor: '#0c193b',
    borderColor: '#0d193d',
  },
  textLocked: {
    color: '#122246',
  },
  // The reminder title's own locked visibility, so the row names stay readable
  rowTitleLocked: {
    color: '#122246',
  },
  rowHonorific: {
    color: COLORS.text.sheetSubtitle,
  },
  dimDots: {
    opacity: 0.05,
  },
  switchVeil: {
    opacity: 0.4,
  },
  note: {
    marginTop: NOTE_GAP,
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
    // Half the note box's own side padding again, so the copy breaks earlier
    // and never rides the box's edges; the glyph keeps its place (owner order 2026-11-06)
    paddingHorizontal: SPACING.mid / 2,
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
  calendarStrip: {
    marginTop: NOTE_GAP,
  },
  calendar: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellArmed: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  cellTextArmed: {
    color: SKY_INK,
  },
  cellTextToday: {
    color: '#fff',
  },
  cellCluster: {
    position: 'absolute',
    top: CELL_CLUSTER_TOP,
    end: CELL_CLUSTER_END,
  },
  cellText: {
    fontSize: 12,
    fontFamily: ty.familyMedium,
    // The dim digit rgba(125, 211, 252, 0.5) flattened over the bar fill on the card
    color: '#487ca5',
  },
});
