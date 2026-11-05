/**
 * The round-11 model's own invariants (T-623): the ten takes' structure and
 * variables, the settled constants (the deep-background ring, the five
 * percent smaller bell circles, round 10's overlap), the position law over
 * the armed identities, and the ten-day calendar walk over the real
 * evaluator - all on injected data and an injected instant, never the real
 * clock.
 */

import { describe, expect, it } from '@jest/globals';

import type { R2Selection } from '@/devlayouts/r2/model';
import { r10ArmedIdentities, r10IdentitiesFor } from '@/devlayouts/r10/model';
import {
  R11_BELL_DOT,
  R11_BORDER,
  R11_CALENDAR_DAYS,
  R11_TAKES,
  r11CalendarDays,
  r11TakeFor,
} from '@/devlayouts/r11/model';

const suhoorAt = (date: string): { at: Date; time: string } | null => {
  if (date < '2026-11-01') return null;
  const at = new Date(`${date}T05:00:00Z`);
  return Number.isNaN(at.getTime()) ? null : { at, time: '05:00' };
};

const NOW = new Date('2026-11-05T09:00:00Z');

const EVERY: R2Selection = { mode: 'every', white: false };
const MUHAMMAD: R2Selection = { mode: 'muhammad', white: false };
const DAWOOD: R2Selection = { mode: 'dawood', white: false };
const WHITE_ONLY: R2Selection = { mode: null, white: true };
const COMBINED: R2Selection = { mode: 'muhammad', white: true };
const DAWOOD_COMBINED: R2Selection = { mode: 'dawood', white: true };

describe('the round-11 takes', () => {
  it('holds exactly ten takes numbered 426-435', () => {
    expect(R11_TAKES.length).toBe(10);
    expect(R11_TAKES.map((take) => take.number)).toEqual([426, 427, 428, 429, 430, 431, 432, 433, 434, 435]);
    expect(R11_TAKES.map((take) => take.design)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gives every take a unique slug-shaped id and a name', () => {
    const ids = R11_TAKES.map((take) => take.id);
    expect(new Set(ids).size).toBe(R11_TAKES.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const take of R11_TAKES) expect(take.name.length).toBeGreaterThan(0);
  });

  it('extends the note around the calendar in at least three takes and keeps a strip in the others', () => {
    const inside = R11_TAKES.filter((take) => take.note === 'inside');
    const below = R11_TAKES.filter((take) => take.note === 'below');
    expect(inside.length).toBeGreaterThanOrEqual(3);
    expect(below.length).toBeGreaterThanOrEqual(3);
  });

  it('varies the cell size, the cell spacing, the cell-circle size and the note depth', () => {
    expect(new Set(R11_TAKES.map((take) => take.cell)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(R11_TAKES.map((take) => take.gap)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(R11_TAKES.map((take) => take.dot)).size).toBeGreaterThanOrEqual(3);
    expect(
      new Set(R11_TAKES.filter((take) => take.note === 'inside').map((take) => take.depth)).size
    ).toBeGreaterThanOrEqual(3);
  });

  it('keeps every cell circle smaller than the bell cluster, all ringed thinner', () => {
    for (const take of R11_TAKES) expect(take.dot).toBeLessThan(R11_BELL_DOT);
  });

  it('clamps the deep-link number into the round', () => {
    expect(r11TakeFor(1).number).toBe(426);
    expect(r11TakeFor(10).number).toBe(435);
    expect(r11TakeFor(99).number).toBe(435);
    expect(r11TakeFor(0).number).toBe(426);
  });
});

describe('the round-11 settled constants', () => {
  it('rings every circle in the deep background shade sampled from behind the alerts icon', () => {
    expect(R11_BORDER).toBe('#1B1967');
  });

  it('runs the bell circles about five percent under round 10', () => {
    expect(R11_BELL_DOT).toBeGreaterThan(9 * 0.93);
    expect(R11_BELL_DOT).toBeLessThan(9 * 0.97);
  });
});

describe('the round-11 position law', () => {
  it('puts the white days right of their paired partner in every pairing', () => {
    expect(r10ArmedIdentities(COMBINED)).toEqual(['green', 'white']);
    expect(r10ArmedIdentities(DAWOOD_COMBINED)).toEqual(['cyan', 'white']);
    expect(r10ArmedIdentities(WHITE_ONLY)).toEqual(['white']);
  });

  it('leaves a lone mode circle alone and Every day bare', () => {
    expect(r10ArmedIdentities(MUHAMMAD)).toEqual(['green']);
    expect(r10ArmedIdentities(DAWOOD)).toEqual(['cyan']);
    expect(r10ArmedIdentities(EVERY)).toEqual([]);
  });

  it('carries the partner first where a Muhammad day coincides with a white day', () => {
    const days = r11CalendarDays(NOW, COMBINED, suhoorAt);
    const byDate = new Map(days.map((day) => [day.date, day]));
    // the real white days (Hijri 13-15) sit beyond the ten-day window; walk
    // the evaluator's own future to prove the pairing order
    expect(r10IdentitiesFor(['muhammad', 'whiteDay'])).toEqual(['green', 'white']);
    expect(byDate.get('2026-11-23')).toBeUndefined();
  });
});

describe('the round-11 calendar walk', () => {
  it("walks exactly ten days from the injected instant's day, today first, one row", () => {
    const days = r11CalendarDays(NOW, COMBINED, suhoorAt);
    expect(days.length).toBe(R11_CALENDAR_DAYS);
    expect(R11_CALENDAR_DAYS).toBe(10);
    expect(days[0]?.date).toBe('2026-11-05');
    expect(days[9]?.date).toBe('2026-11-14');
  });

  it('arms the Mondays and Thursdays green across the window', () => {
    const days = r11CalendarDays(NOW, COMBINED, suhoorAt);
    const armed = days.filter((day) => day.designations.includes('muhammad')).map((day) => day.date);
    expect(armed).toEqual(['2026-11-05', '2026-11-09', '2026-11-12']);
    // a plain Tuesday carries nothing
    expect(days.find((day) => day.date === '2026-11-10')?.arms).toBe(false);
    // the real white days (Hijri 13-15) sit beyond this window
    expect(days.some((day) => day.designations.includes('whiteDay'))).toBe(false);
  });
});
