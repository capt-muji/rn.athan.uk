/**
 * The round-9 model's own invariants (T-623): the selection-to-settings
 * mapping the trigger walk rides, the armed-mode derivation both surfaces
 * read, and the next-trigger walk itself - all over injected data and an
 * injected instant, never the real clock.
 */

import { describe, expect, it } from '@jest/globals';

import type { R2Selection } from '@/devlayouts/r2/model';
import {
  r9ArmedFor,
  r9Automated,
  r9CountdownParts,
  r9JoinedMark,
  r9Relative,
  r9SettingsFor,
  r9TimeLabel,
  r9TriggersWith,
} from '@/devlayouts/r9/model';

const suhoorAt = (date: string): { at: Date; time: string } | null => {
  if (date < '2026-11-01') return null;
  const at = new Date(`${date}T05:00:00Z`);
  return Number.isNaN(at.getTime()) ? null : { at, time: '05:00' };
};

const NOW = new Date('2026-11-05T09:00:00Z');

const EVERY: R2Selection = { mode: 'every', white: false };
const MUHAMMAD: R2Selection = { mode: 'muhammad', white: false };
const MUHAMMAD_WHITE: R2Selection = { mode: 'muhammad', white: true };
const WHITE: R2Selection = { mode: null, white: true };
const DAWOOD: R2Selection = { mode: 'dawood', white: false };

describe('the round-9 armed modes', () => {
  it('gates the indicator off exactly on Every day', () => {
    expect(r9Automated(EVERY)).toBe(false);
    expect(r9Automated(MUHAMMAD)).toBe(true);
    expect(r9Automated(MUHAMMAD_WHITE)).toBe(true);
    expect(r9Automated(WHITE)).toBe(true);
  });

  it('derives the armed regimens from the selection', () => {
    expect(r9ArmedFor(EVERY)).toEqual({ muhammad: false, dawood: false, white: false });
    expect(r9ArmedFor(MUHAMMAD_WHITE)).toEqual({ muhammad: true, dawood: false, white: true });
    expect(r9ArmedFor(DAWOOD)).toEqual({ muhammad: false, dawood: true, white: false });
  });

  it('joins the marks in regimen order', () => {
    expect(r9JoinedMark(r9ArmedFor(MUHAMMAD_WHITE))).toBe('M+W');
    expect(r9JoinedMark(r9ArmedFor(EVERY))).toBe('');
  });
});

describe('the round-9 settings mapping', () => {
  it('maps the four sets onto the real fasting modes', () => {
    expect(r9SettingsFor(EVERY, 0)).toEqual({ mode: 'everyDay', whiteDaysAddOn: false, dawoodAnchorMs: 0 });
    expect(r9SettingsFor(MUHAMMAD_WHITE, 0)).toEqual({
      mode: 'muhammad',
      whiteDaysAddOn: true,
      dawoodAnchorMs: 0,
    });
    expect(r9SettingsFor(WHITE, 0)).toEqual({ mode: 'whiteDays', whiteDaysAddOn: false, dawoodAnchorMs: 0 });
  });

  it('anchors a Dawood walk at the given instant and nothing else does', () => {
    expect(r9SettingsFor(DAWOOD, 1234).dawoodAnchorMs).toBe(1234);
    expect(r9SettingsFor(MUHAMMAD, 1234).dawoodAnchorMs).toBe(0);
  });
});

describe('the round-9 trigger walk', () => {
  it('returns only future triggers, soonest first', () => {
    const triggers = r9TriggersWith(EVERY, NOW, 3, suhoorAt);
    expect(triggers.length).toBe(3);
    expect(triggers[0]?.date).toBe('2026-11-06');
    for (const trigger of triggers) expect(trigger.at.getTime()).toBeGreaterThan(NOW.getTime());
    for (let index = 1; index < triggers.length; index += 1) {
      expect(triggers[index]!.at.getTime()).toBeGreaterThan(triggers[index - 1]!.at.getTime());
    }
  });

  it('skips a day with no readable row', () => {
    const sparse = (date: string) => (date === '2026-11-06' ? null : suhoorAt(date));
    const triggers = r9TriggersWith(EVERY, NOW, 2, sparse);
    expect(triggers.map((trigger) => trigger.date)).toEqual(['2026-11-07', '2026-11-08']);
  });

  it('stops at the requested count', () => {
    expect(r9TriggersWith(EVERY, NOW, 1, suhoorAt).length).toBe(1);
    expect(r9TriggersWith(EVERY, NOW, 5, suhoorAt).length).toBe(5);
  });

  it('walks an armed-day window the settings drive', () => {
    const mondayOnly = r9TriggersWith(MUHAMMAD, NOW, 2, suhoorAt);
    for (const trigger of mondayOnly) {
      const weekday = new Date(`${trigger.date}T12:00:00Z`).getUTCDay();
      expect([1, 4]).toContain(weekday);
    }
  });
});

describe('the round-9 display formatting', () => {
  it('formats the wall time in the app display format', () => {
    expect(r9TimeLabel('05:04')).toBe('05:04');
    expect(r9TimeLabel('17:15')).toBe('05:15');
  });

  it('speaks the relative distance in ascending buckets', () => {
    expect(r9Relative(new Date('2026-11-05T09:00:30Z'), NOW)).toBe('in a few minutes');
    expect(r9Relative(new Date('2026-11-05T09:30:00Z'), NOW)).toBe('in 30 min');
    expect(r9Relative(new Date('2026-11-05T13:45:00Z'), NOW)).toBe('in 4h 45m');
    expect(r9Relative(new Date('2026-11-06T09:00:00Z'), NOW)).toBe('tomorrow');
    expect(r9Relative(new Date('2026-11-09T09:00:00Z'), NOW)).toBe('in 4 days');
  });

  it('splits the countdown into whole parts', () => {
    expect(r9CountdownParts(new Date('2026-11-08T11:30:00Z'), NOW)).toEqual({ days: 3, hours: 2, minutes: 30 });
    expect(r9CountdownParts(new Date('2026-11-04T00:00:00Z'), NOW)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});
