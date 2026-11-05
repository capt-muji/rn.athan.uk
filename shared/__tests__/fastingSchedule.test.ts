/**
 * The fasting schedule walks (design 427): the next Suhoor triggers and the
 * ten-day calendar over the real evaluator, every instant injected. The
 * timetable rows arrive as a seam, so the walk logic runs here on synthetic
 * rows; the card's own suite runs the same walks over installed real days.
 * The 21-day walk pins the white-day combined cell the ten-day window can
 * miss (real white days can fall beyond it any given week).
 */

import {
  armedFastingIdentities,
  FASTING_CALENDAR_DAYS,
  fastingCalendarDays,
  fastingIdentitiesFor,
  fastingRelative,
  fastingSettingsFor,
  fastingWeekdayKey,
  nextFastingTriggers,
} from '@/shared/fastingSchedule';
import type { FastingSelection } from '@/shared/types';

/** Suhoor at 05:30 UTC every day it is asked for; the named days carry no readable row */
const suhoorAt = (unreadable: string[] = []) => {
  const broken = new Set(unreadable);
  return (date: string): { at: Date; time: string } | null =>
    broken.has(date) ? null : { at: new Date(`${date}T05:30:00Z`), time: '05:30' };
};

/** A fixed instant: 1 April 2026 at noon London */
const NOW = new Date('2026-04-01T11:00:00Z');

const sel = (mode: FastingSelection['mode'], whiteDaysAddOn = false): FastingSelection => ({ mode, whiteDaysAddOn });

describe('the settings mapping', () => {
  it('anchors dawood by the stored anchor, or by now when none is stored', () => {
    const nowMs = NOW.getTime();
    expect(fastingSettingsFor(sel('dawood'), nowMs, 1234)).toMatchObject({ dawoodAnchorMs: 1234 });
    expect(fastingSettingsFor(sel('dawood'), nowMs, 0)).toMatchObject({ dawoodAnchorMs: nowMs });
  });

  it('carries no anchor outside dawood', () => {
    expect(fastingSettingsFor(sel('muhammad', true), NOW.getTime(), 1234)).toEqual({
      mode: 'muhammad',
      whiteDaysAddOn: true,
      dawoodAnchorMs: 0,
    });
  });
});

describe('the trigger walk', () => {
  it('names the next two strictly-ahead triggers, soonest first', () => {
    // 1 April 2026 is a Wednesday: muhammad arms Thursday the 2nd and Monday the 6th
    const triggers = nextFastingTriggers(fastingSettingsFor(sel('muhammad'), NOW.getTime(), 0), NOW, 2, suhoorAt());

    expect(triggers.map((trigger) => trigger.date)).toEqual(['2026-04-02', '2026-04-06']);
    expect(triggers[0]).toMatchObject({ time: '05:30', designations: ['muhammad'] });
  });

  it('still counts a trigger on today list while its instant is ahead', () => {
    const morning = new Date('2026-04-02T04:00:00Z');
    const triggers = nextFastingTriggers(
      fastingSettingsFor(sel('muhammad'), morning.getTime(), 0),
      morning,
      2,
      suhoorAt()
    );

    expect(triggers.map((trigger) => trigger.date)).toEqual(['2026-04-02', '2026-04-06']);
  });

  it('passes over days whose row is unreadable', () => {
    const triggers = nextFastingTriggers(
      fastingSettingsFor(sel('muhammad'), NOW.getTime(), 0),
      NOW,
      2,
      suhoorAt(['2026-04-02', '2026-04-06'])
    );

    expect(triggers.map((trigger) => trigger.date)).toEqual(['2026-04-09', '2026-04-13']);
  });

  it('walks every day under everyDay', () => {
    // Today's own trigger is already spent at noon, so tomorrow leads
    const triggers = nextFastingTriggers(fastingSettingsFor(sel('everyDay'), NOW.getTime(), 0), NOW, 2, suhoorAt());

    expect(triggers.map((trigger) => trigger.date)).toEqual(['2026-04-02', '2026-04-03']);
    expect(triggers[0].designations).toEqual([]);
  });
});

describe('the calendar walk', () => {
  it('carries the ten days from today, today first', () => {
    const days = fastingCalendarDays(
      fastingSettingsFor(sel('everyDay'), NOW.getTime(), 0),
      NOW,
      FASTING_CALENDAR_DAYS,
      suhoorAt()
    );

    expect(days).toHaveLength(10);
    expect(days[0]).toMatchObject({ date: '2026-04-01', arms: true, designations: [] });
    expect(days[9].date).toBe('2026-04-10');
  });

  it('marks the white days and only them under the white-only set', () => {
    // 1-3 April 2026 are the 13th-15th of Shawwal 1447
    const days = fastingCalendarDays(fastingSettingsFor(sel('whiteDays'), NOW.getTime(), 0), NOW, 10, suhoorAt());

    expect(days.filter((day) => day.arms).map((day) => day.date)).toEqual(['2026-04-01', '2026-04-02', '2026-04-03']);
    expect(days[1].designations).toEqual(['whiteDay']);
  });

  it('carries the combined white-day cell through a 21-day walk', () => {
    // The combined cell (a regimen's mark beside the white day's) is the one
    // cell the ten-day window can miss: this walk pins that every white day
    // in the window carries both designations under muhammad and the add-on
    const days = fastingCalendarDays(fastingSettingsFor(sel('muhammad', true), NOW.getTime(), 0), NOW, 21, suhoorAt());

    const whiteDays = days.filter((day) => day.designations.includes('whiteDay'));
    expect(whiteDays.map((day) => day.date)).toEqual(['2026-04-01', '2026-04-02', '2026-04-03']);
    // Thursday the 2nd is both a Muhammad day and a white day: the combined cell
    expect(days[1].designations).toEqual(['muhammad', 'whiteDay']);
    expect(fastingIdentitiesFor(days[1].designations)).toEqual(['green', 'white']);
  });

  it('alternates from the anchor day under dawood, passing over a day with no row', () => {
    const settings = fastingSettingsFor(sel('dawood'), NOW.getTime(), 0);
    // The 2nd carries no readable row, so the cycle's search passes over it
    const withBrokenRow = suhoorAt(['2026-04-02']);

    expect(nextFastingTriggers(settings, NOW, 2, withBrokenRow).map((trigger) => trigger.date)).toEqual([
      '2026-04-03',
      '2026-04-05',
    ]);
    expect(
      fastingCalendarDays(settings, NOW, 6, withBrokenRow)
        .filter((day) => day.arms)
        .map((day) => day.date)
    ).toEqual(['2026-04-03', '2026-04-05']);
  });
});

describe('the armed identities', () => {
  it('names the regimen marks in regimen order', () => {
    expect(armedFastingIdentities(sel('everyDay'))).toEqual([]);
    expect(armedFastingIdentities(sel('muhammad'))).toEqual(['green']);
    expect(armedFastingIdentities(sel('dawood'))).toEqual(['cyan']);
    expect(armedFastingIdentities(sel('whiteDays'))).toEqual(['white']);
    expect(armedFastingIdentities(sel('muhammad', true))).toEqual(['green', 'white']);
    expect(armedFastingIdentities(sel('dawood', true))).toEqual(['cyan', 'white']);
  });

  it('dedupes a day designations list into its identities', () => {
    expect(fastingIdentitiesFor(['muhammad', 'whiteDay'])).toEqual(['green', 'white']);
    expect(fastingIdentitiesFor(['ramadan'])).toEqual([]);
  });
});

describe('the entry distance', () => {
  const at = (iso: string): Date => new Date(iso);

  it('speaks hours under a day, never a zero', () => {
    expect(fastingRelative(at('2026-04-01T11:20:00Z'), NOW)).toEqual({ hours: 1 });
    expect(fastingRelative(at('2026-04-01T22:40:00Z'), NOW)).toEqual({ hours: 12 });
  });

  it('speaks days at a day and beyond', () => {
    expect(fastingRelative(at('2026-04-02T11:00:00Z'), NOW)).toEqual({ days: 1 });
    expect(fastingRelative(at('2026-04-05T11:00:00Z'), NOW)).toEqual({ days: 4 });
  });
});

describe('the weekday key', () => {
  it('names the list day weekday, Monday 1 to Sunday 7', () => {
    expect(fastingWeekdayKey('2026-04-01')).toBe('calendar.weekdayShort.3');
    expect(fastingWeekdayKey('2026-04-02')).toBe('calendar.weekdayShort.4');
    expect(fastingWeekdayKey('2026-04-05')).toBe('calendar.weekdayShort.7');
  });
});
