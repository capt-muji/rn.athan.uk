/**
 * The round-9 trigger sections (T-623, surface B): the small schedule under
 * the locked card's note, full width within the card padding, answering WHEN
 * SAHUR NEXT FIRES for the current selection. Twelve archetypes over the one
 * data walk (r9Triggers: the real fasting evaluator over the real timetable,
 * injected with the render-time instant). Every body is first-frame settled -
 * computed strings, no animation. Dev-only: nothing shipped imports here.
 */

import { type ReactElement, useMemo } from 'react';
import { StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';

import type { R2Selection } from '../r2/model';
import type { R9CatalogRow, R9TriggerKind } from './catalog';
import { type R9Ink, r9Ink } from './hues';
import {
  type R9Trigger,
  RING_LABEL,
  r9CountdownParts,
  r9DayLabel,
  r9Relative,
  r9ShortDayLabel,
  r9TimeLabel,
  r9Triggers,
  STACK_LABEL,
  STRIP_CAPTION,
  TABLE_DAY_HEAD,
  TABLE_TIME_HEAD,
  TIMELINE_LATER,
  TIMELINE_NOW,
  TRIGGER_HEADING,
  TRIGGER_NEXT_WORD,
  TRIGGER_NONE,
  WEEK_CAPTION,
  WEEK_LETTERS,
  WEEKDAY_KEYS,
} from './model';

const BODY_TRIGGER_COUNT = 3;
const STRIP_DAY_COUNT = 10;
const CALENDAR_DAY_COUNT = 14;

export const R9TriggerSection = ({ row, selection }: { row: R9CatalogRow; selection: R2Selection }) => {
  const now = useMemo(() => new Date(), []);
  const triggers = useMemo(() => r9Triggers(selection, now), [selection, now]);
  const ink = r9Ink(row.hue);

  return (
    <View style={s.section}>
      <View style={s.headRow}>
        <View style={dyn.headDot(ink)} />
        <Text style={s.headText}>{TRIGGER_HEADING}</Text>
      </View>
      {triggers.length === 0 ? (
        <Text style={s.noneText}>{TRIGGER_NONE}</Text>
      ) : (
        body(row.trigger as R9TriggerKind, triggers, now, ink)
      )}
    </View>
  );
};

const body = (kind: R9TriggerKind, triggers: R9Trigger[], now: Date, ink: R9Ink): ReactElement => {
  switch (kind) {
    case 'relative-line':
      return <RelativeLine triggers={triggers} now={now} ink={ink} />;
    case 'date-list':
      return <DateList triggers={triggers} now={now} ink={ink} />;
    case 'timeline':
      return <Timeline triggers={triggers} now={now} ink={ink} />;
    case 'dot-strip':
      return <DotStrip triggers={triggers} now={now} ink={ink} />;
    case 'countdown-chip':
      return <CountdownChip triggers={triggers} now={now} ink={ink} />;
    case 'ring':
      return <Ring triggers={triggers} now={now} ink={ink} />;
    case 'table':
      return <Table triggers={triggers} now={now} ink={ink} />;
    case 'calendar-row':
      return <CalendarRow triggers={triggers} now={now} ink={ink} />;
    case 'pulse-text':
      return <PulseText triggers={triggers} now={now} ink={ink} />;
    case 'stacked-cards':
      return <StackedCards triggers={triggers} now={now} ink={ink} />;
    case 'week-bar':
      return <WeekBar triggers={triggers} now={now} ink={ink} />;
    case 'split-digits':
      return <SplitDigits triggers={triggers} now={now} ink={ink} />;
    default:
      return <RelativeLine triggers={triggers} now={now} ink={ink} />;
  }
};

// ---------------------------------------------------------------------------
// The twelve bodies
// ---------------------------------------------------------------------------

const RelativeLine = ({ triggers, now, ink }: BodyProps) => {
  const first = triggers[0];
  return (
    <View style={s.lineRow}>
      <View style={dyn.solidDot(ink, 8)} />
      <Text style={[s.bodyText, dyn.inkText(ink.solid)]}>
        {`${TRIGGER_NEXT_WORD} ${r9Relative(first.at, now)}, ${r9TimeLabel(first.time)}`}
      </Text>
    </View>
  );
};

const DateList = ({ triggers, ink }: BodyProps) => (
  <View style={s.stack}>
    {triggers.slice(0, BODY_TRIGGER_COUNT).map((trigger, index) => (
      <View key={trigger.date} style={[s.listRow, index === 0 ? dyn.listRowFirst(ink) : null]}>
        <Text style={index === 0 ? dyn.inkText(ink.solid) : s.dimText}>{r9DayLabel(trigger.date)}</Text>
        <Text style={index === 0 ? dyn.inkText(ink.solid) : s.dimText}>{r9TimeLabel(trigger.time)}</Text>
      </View>
    ))}
  </View>
);

const Timeline = ({ triggers, now, ink }: BodyProps) => (
  <View style={s.timeline}>
    <View style={s.timelineTrack}>
      <View style={dyn.trackLine(ink)} />
      {triggers.slice(0, 4).map((trigger, index) => (
        <View
          key={trigger.date}
          style={[s.timelineDot, index === 0 ? dyn.timelineDotFirst(ink) : dyn.timelineDotRest(ink)]}
        />
      ))}
    </View>
    <View style={s.timelineLabels}>
      <Text style={dyn.inkText(ink.solid)}>{`${TIMELINE_NOW} - ${r9Relative(triggers[0].at, now)}`}</Text>
      <Text style={s.dimText}>{TIMELINE_LATER}</Text>
    </View>
  </View>
);

const DotStrip = ({ triggers, now, ink }: BodyProps) => {
  const armedDates = new Set(triggers.map((trigger) => trigger.date));
  const days = stripDays(now, STRIP_DAY_COUNT);
  return (
    <View style={s.stack}>
      <View style={s.cellRow}>
        {days.map((day) => (
          <View key={day} style={[s.stripCell, armedDates.has(day) ? dyn.cellArmed(ink) : null]} />
        ))}
      </View>
      <Text style={s.caption}>{`${STRIP_CAPTION} - ${r9Relative(triggers[0].at, now)}`}</Text>
    </View>
  );
};

const CountdownChip = ({ triggers, now, ink }: BodyProps) => {
  const parts = r9CountdownParts(triggers[0].at, now);
  return (
    <View style={s.lineRow}>
      <View style={dyn.chip(ink)}>
        <Text style={dyn.chipText(ink)}>
          {parts.days > 0 ? `${parts.days}d ${parts.hours}h` : `${parts.hours}h ${parts.minutes}m`}
        </Text>
      </View>
      <Text style={s.bodyText}>{`${r9Relative(triggers[0].at, now)}, ${r9TimeLabel(triggers[0].time)}`}</Text>
    </View>
  );
};

const Ring = ({ triggers, now, ink }: BodyProps) => (
  <View style={s.lineRow}>
    <View style={dyn.ring(ink)}>
      <Text style={dyn.ringText(ink)}>{r9TimeLabel(triggers[0].time)}</Text>
    </View>
    <View style={s.stack}>
      <Text style={dyn.inkText(ink.solid)}>{RING_LABEL}</Text>
      <Text style={s.caption}>{r9Relative(triggers[0].at, now)}</Text>
    </View>
  </View>
);

const Table = ({ triggers, ink }: BodyProps) => (
  <View style={s.stack}>
    <View style={s.tableRow}>
      <Text style={s.tableHead}>{TABLE_DAY_HEAD}</Text>
      <Text style={s.tableHead}>{TABLE_TIME_HEAD}</Text>
    </View>
    {triggers.slice(0, BODY_TRIGGER_COUNT).map((trigger, index) => (
      <View key={trigger.date} style={[s.tableRow, s.tableLine, index === 0 ? dyn.listRowFirst(ink) : null]}>
        <Text style={index === 0 ? dyn.inkText(ink.solid) : s.dimText}>{r9ShortDayLabel(trigger.date)}</Text>
        <Text style={index === 0 ? dyn.inkText(ink.solid) : s.dimText}>{r9TimeLabel(trigger.time)}</Text>
      </View>
    ))}
  </View>
);

const CalendarRow = ({ triggers, now, ink }: BodyProps) => {
  const armedDates = new Set(triggers.map((trigger) => trigger.date));
  const days = stripDays(now, CALENDAR_DAY_COUNT);
  return (
    <View style={s.cellRow}>
      {days.map((day, index) => (
        <View
          key={day}
          style={[s.calCell, armedDates.has(day) ? dyn.cellArmed(ink) : null, index === 0 ? s.cellToday : null]}>
          <Text style={armedDates.has(day) ? dyn.cellText(ink) : s.calText}>{dayNumber(day)}</Text>
        </View>
      ))}
    </View>
  );
};

const PulseText = ({ triggers, now, ink }: BodyProps) => (
  <View style={s.lineRow}>
    <View style={dyn.pulseHalo(ink)}>
      <View style={dyn.solidDot(ink, 9)} />
    </View>
    <Text style={[s.bodyText, dyn.inkText(ink.solid)]}>
      {`${r9Relative(triggers[0].at, now)}, ${r9TimeLabel(triggers[0].time)}`}
    </Text>
  </View>
);

const StackedCards = ({ triggers, ink }: BodyProps) => {
  const first = triggers[0];
  const second = triggers[1];
  return (
    <View style={s.stackCards}>
      <View style={dyn.stackCardBack(ink)}>
        <Text style={s.dimText}>{second === undefined ? STACK_LABEL : r9ShortDayLabel(second.date)}</Text>
      </View>
      <View style={dyn.stackCardFront(ink)}>
        <Text style={dyn.inkText(ink.solid)}>{`${r9ShortDayLabel(first.date)} - ${r9TimeLabel(first.time)}`}</Text>
      </View>
    </View>
  );
};

const WeekBar = ({ triggers, now, ink }: BodyProps) => {
  const armedWeekdays = new Set<number>();
  for (const trigger of triggers) armedWeekdays.add(weekdayIndex(trigger.date));
  const withinWeek = triggers.some((trigger) => stripDays(now, 7).includes(trigger.date));
  return (
    <View style={s.stack}>
      <View style={s.cellRow}>
        {WEEK_LETTERS.map((letter, index) => (
          <View
            key={WEEKDAY_KEYS[index]}
            style={[s.weekCell, armedWeekdays.has(index) && withinWeek ? dyn.cellArmed(ink) : null]}>
            <Text style={armedWeekdays.has(index) && withinWeek ? dyn.cellText(ink) : s.calText}>{letter}</Text>
          </View>
        ))}
      </View>
      <Text style={s.caption}>{`${WEEK_CAPTION} - ${r9TimeLabel(triggers[0].time)}`}</Text>
    </View>
  );
};

const SplitDigits = ({ triggers, now, ink }: BodyProps) => {
  const parts = r9CountdownParts(triggers[0].at, now);
  return (
    <View style={s.lineRow}>
      <View style={s.digitRow}>
        <View style={dyn.digitBox(ink)}>
          <Text style={dyn.cellText(ink)}>{String(parts.days)}</Text>
        </View>
        <View style={dyn.digitBox(ink)}>
          <Text style={dyn.cellText(ink)}>{pad2(parts.hours)}</Text>
        </View>
        <View style={dyn.digitBox(ink)}>
          <Text style={dyn.cellText(ink)}>{pad2(parts.minutes)}</Text>
        </View>
      </View>
      <Text style={s.caption}>{`${r9DayLabel(triggers[0].date)} - ${r9TimeLabel(triggers[0].time)}`}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Data helpers and layout
// ---------------------------------------------------------------------------

interface BodyProps {
  readonly triggers: R9Trigger[];
  readonly now: Date;
  readonly ink: R9Ink;
}

const stripDays = (now: Date, count: number): string[] => {
  const anchor = new Date(now.getTime());
  anchor.setUTCHours(12, 0, 0, 0);
  const days: string[] = [];
  for (let step = 0; step < count; step += 1) {
    const day = new Date(anchor.getTime() + step * 86_400_000);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
};

const dayNumber = (date: string): string => String(Number(date.slice(8, 10)));

const weekdayIndex = (date: string): number => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

const pad2 = (value: number): string => String(value).padStart(2, '0');

const COLORS_SUBTLE = 'rgba(216, 234, 248, 0.55)';
const COLORS_PRIMARY = 'rgba(216, 234, 248, 0.92)';
const COLORS_PRIMARY_DIM = 'rgba(216, 234, 248, 0.4)';
const COLORS_HAIRLINE = 'rgba(148, 163, 184, 0.25)';

const s = StyleSheet.create({
  section: {
    marginTop: 10,
    paddingHorizontal: 2,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
  },
  headText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: COLORS_SUBTLE,
  },
  noneText: {
    fontSize: 11,
    color: COLORS_SUBTLE,
  },
  bodyText: {
    fontSize: 11.5,
    color: COLORS_PRIMARY,
    flexShrink: 1,
  },
  dimText: {
    fontSize: 11,
    color: COLORS_SUBTLE,
  },
  caption: {
    fontSize: 10,
    color: COLORS_SUBTLE,
    marginTop: 4,
  },
  stack: {
    gap: 4,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tableHead: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: COLORS_SUBTLE,
  },
  tableLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS_HAIRLINE,
  },
  cellRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  stripCell: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS_HAIRLINE,
  },
  calCell: {
    width: 20,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS_HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    borderColor: COLORS_PRIMARY_DIM,
  },
  calText: {
    fontSize: 9,
    color: COLORS_SUBTLE,
  },
  weekCell: {
    width: 24,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS_HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    gap: 4,
  },
  timelineTrack: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 26,
    paddingLeft: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stackCards: {
    height: 44,
  },
  digitRow: {
    flexDirection: 'row',
    gap: 4,
  },
});

const dyn = {
  headDot: (ink: R9Ink): ViewStyle => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ink.solid,
  }),
  inkText: (color: string): TextStyle => ({
    color,
    fontWeight: '600',
  }),
  solidDot: (ink: R9Ink, size: number): ViewStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: ink.solid,
  }),
  listRowFirst: (ink: R9Ink): ViewStyle => ({
    backgroundColor: ink.fill,
  }),
  chip: (ink: R9Ink): ViewStyle => ({
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ink.solid,
  }),
  chipText: (ink: R9Ink): TextStyle => ({
    fontSize: 11,
    fontWeight: '700',
    color: ink.onFill,
  }),
  ring: (ink: R9Ink): ViewStyle => ({
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: ink.solid,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  ringText: (ink: R9Ink): TextStyle => ({
    fontSize: 9.5,
    fontWeight: '700',
    color: ink.solid,
  }),
  cellArmed: (ink: R9Ink): ViewStyle => ({
    backgroundColor: ink.solid,
    borderColor: ink.solid,
  }),
  cellText: (ink: R9Ink): TextStyle => ({
    fontSize: 9,
    fontWeight: '700',
    color: ink.onFill,
  }),
  pulseHalo: (ink: R9Ink): ViewStyle => ({
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ink.fill,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  trackLine: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    left: 4,
    right: 4,
    top: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: ink.mid,
  }),
  timelineDotFirst: (ink: R9Ink): ViewStyle => ({
    backgroundColor: ink.solid,
    borderColor: ink.solid,
  }),
  timelineDotRest: (ink: R9Ink): ViewStyle => ({
    backgroundColor: ink.fill,
    borderColor: ink.border,
  }),
  stackCardBack: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 10,
    left: 10,
    right: 0,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: ink.fill,
    paddingLeft: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  }),
  stackCardFront: (ink: R9Ink): ViewStyle => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 24,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ink.border,
    backgroundColor: 'rgba(20, 26, 46, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  digitBox: (ink: R9Ink): ViewStyle => ({
    minWidth: 22,
    paddingHorizontal: 5,
    height: 20,
    borderRadius: 5,
    backgroundColor: ink.fill,
    borderWidth: 1,
    borderColor: ink.border,
    alignItems: 'center',
    justifyContent: 'center',
  }),
};
