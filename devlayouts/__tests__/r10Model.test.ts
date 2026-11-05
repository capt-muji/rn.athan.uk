/**
 * The round-10 model's own invariants (T-623): the five takes' structure, the
 * mode identities, the entries' relative copy, and the two-week calendar walk
 * over the real evaluator - all on injected data and an injected instant,
 * never the real clock.
 */

import { describe, expect, it } from '@jest/globals';

import type { R2Selection } from '@/devlayouts/r2/model';
import {
  R10_CALENDAR_COLUMNS,
  R10_CALENDAR_DAYS,
  R10_ENTRY_COUNT,
  R10_TAKES,
  r10ArmedIdentities,
  r10CalendarDays,
  r10IdentitiesFor,
  r10Relative,
  r10TakeFor,
} from '@/devlayouts/r10/model';

const suhoorAt = (date: string): { at: Date; time: string } | null => {
  if (date < '2026-11-01') return null;
  const at = new Date(`${date}T05:00:00Z`);
  return Number.isNaN(at.getTime()) ? null : { at, time: '05:00' };
};

const NOW = new Date('2026-11-05T09:00:00Z');

const EVERY: R2Selection = { mode: 'every', white: false };
const MUHAMMAD: R2Selection = { mode: 'muhammad', white: false };
const COMBINED: R2Selection = { mode: 'muhammad', white: true };

describe('the round-10 takes', () => {
  it('holds exactly five takes numbered 421-425', () => {
    expect(R10_TAKES.length).toBe(5);
    expect(R10_TAKES.map((take) => take.number)).toEqual([421, 422, 423, 424, 425]);
    expect(R10_TAKES.map((take) => take.design)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives every take a unique slug-shaped id and a name', () => {
    const ids = R10_TAKES.map((take) => take.id);
    expect(new Set(ids).size).toBe(R10_TAKES.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const take of R10_TAKES) expect(take.name.length).toBeGreaterThan(0);
  });

  it("covers the owner's compared bell spots, two each side, one judged", () => {
    const spots = R10_TAKES.map((take) => take.spot);
    expect(spots.filter((spot) => spot === 'bell-top-right').length).toBe(2);
    expect(spots.filter((spot) => spot === 'bell-bottom-right').length).toBe(2);
    expect(spots.filter((spot) => spot === 'bell-below').length).toBe(1);
  });

  it('varies the combo treatments and the section emphasis across the round', () => {
    const combos = new Set(R10_TAKES.map((take) => take.combo));
    expect(combos.size).toBeGreaterThanOrEqual(3);
    expect(R10_TAKES.some((take) => take.section === 'both')).toBe(true);
    expect(R10_TAKES.some((take) => take.section === 'calendar')).toBe(true);
    expect(R10_TAKES.some((take) => take.compact)).toBe(true);
    expect(R10_TAKES.some((take) => !take.compact)).toBe(true);
  });

  it('clamps the deep-link number into the round', () => {
    expect(r10TakeFor(1).number).toBe(421);
    expect(r10TakeFor(5).number).toBe(425);
    expect(r10TakeFor(99).number).toBe(425);
    expect(r10TakeFor(0).number).toBe(421);
  });
});

describe('the round-10 identities', () => {
  it("maps the designations onto the owner's colors", () => {
    expect(r10IdentitiesFor(['muhammad'])).toEqual(['green']);
    expect(r10IdentitiesFor(['dawood'])).toEqual(['cyan']);
    expect(r10IdentitiesFor(['whiteDay'])).toEqual(['white']);
    expect(r10IdentitiesFor(['muhammad', 'whiteDay'])).toEqual(['green', 'white']);
    expect(r10IdentitiesFor(['whiteDay', 'muhammad'])).toEqual(['white', 'green']);
  });

  it('drops designations that carry no identity and deduplicates', () => {
    expect(r10IdentitiesFor(['ramadan'])).toEqual([]);
    expect(r10IdentitiesFor([])).toEqual([]);
  });

  it('derives the armed identities in regimen order', () => {
    expect(r10ArmedIdentities(EVERY)).toEqual([]);
    expect(r10ArmedIdentities(MUHAMMAD)).toEqual(['green']);
    expect(r10ArmedIdentities(COMBINED)).toEqual(['green', 'white']);
  });
});

describe('the round-10 relative copy', () => {
  it('speaks hours under a day', () => {
    expect(r10Relative(new Date('2026-11-05T14:00:00Z'), '2026-11-05', NOW)).toBe('in 5 hours');
    expect(r10Relative(new Date('2026-11-05T09:20:00Z'), '2026-11-05', NOW)).toBe('in 1 hour');
  });

  it('speaks days plus the weekday over a day', () => {
    expect(r10Relative(new Date('2026-11-09T05:00:00Z'), '2026-11-09', NOW)).toBe('in 4 days Mon');
    expect(r10Relative(new Date('2026-11-06T15:00:00Z'), '2026-11-06', NOW)).toBe('in 1 day Fri');
  });
});

describe('the round-10 calendar walk', () => {
  it("walks exactly fourteen days from the injected instant's day, today first, two rows of seven", () => {
    const days = r10CalendarDays(NOW, COMBINED, R10_CALENDAR_DAYS, suhoorAt);
    expect(days.length).toBe(R10_CALENDAR_DAYS);
    expect(days[0]?.date).toBe('2026-11-05');
    expect(days.length / R10_CALENDAR_COLUMNS).toBe(2);
    expect(days[7]?.date).toBe('2026-11-12');
  });

  it('arms the Mondays and Thursdays green across the window', () => {
    const days = r10CalendarDays(NOW, COMBINED, R10_CALENDAR_DAYS, suhoorAt);
    const armed = days.filter((day) => day.designations.includes('muhammad')).map((day) => day.date);
    expect(armed).toEqual(['2026-11-05', '2026-11-09', '2026-11-12', '2026-11-16']);
    // a plain Tuesday carries nothing
    expect(days.find((day) => day.date === '2026-11-10')?.arms).toBe(false);
    // the real white days (Hijri 13-15) sit beyond this fortnight
    expect(days.some((day) => day.designations.includes('whiteDay'))).toBe(false);
  });

  it('carries both identities where a Muhammad day coincides with a white day', () => {
    // a longer walk reaches the next white days: Hijri 13-15 of November 2026
    const days = r10CalendarDays(NOW, COMBINED, 21, suhoorAt);
    const byDate = new Map(days.map((day) => [day.date, day]));
    expect(byDate.get('2026-11-23')?.designations).toEqual(['muhammad', 'whiteDay']);
    expect(byDate.get('2026-11-24')?.designations).toEqual(['whiteDay']);
    expect(byDate.get('2026-11-25')?.designations).toEqual(['whiteDay']);
  });

  it('counts the entries the notes show', () => {
    expect(R10_ENTRY_COUNT).toBe(2);
  });
});
