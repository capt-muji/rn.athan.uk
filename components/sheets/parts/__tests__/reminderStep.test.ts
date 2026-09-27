/**
 * The reminder stepper's arrows. The alert sheet commits whatever interval they leave, so a press that skips, runs
 * off either end or goes the wrong way saves a reminder offset the user did not choose.
 */

import { REMINDER_INTERVALS } from '@/shared/constants';
import type { ReminderInterval } from '@/shared/types';

import { freeReminderInterval, stepReminderInterval } from '../reminderStep';

describe('stepReminderInterval', () => {
  // Written out rather than derived from REMINDER_INTERVALS, so the expectation cannot move with the code
  it.each([
    [5, null, 10],
    [10, 5, 15],
    [15, 10, 20],
    [20, 15, 25],
    [25, 20, 30],
    [30, 25, null],
  ])('from %i minutes, minus gives %s and plus gives %s', (value, down, up) => {
    expect(stepReminderInterval(value, -1)).toBe(down);
    expect(stepReminderInterval(value, 1)).toBe(up);
  });

  it('visits every interval once pressing plus from the first, then stops', () => {
    const visited: number[] = [5];
    let next = stepReminderInterval(5, 1);

    while (next !== null && visited.length <= REMINDER_INTERVALS.length) {
      visited.push(next);
      next = stepReminderInterval(next, 1);
    }

    expect(visited).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('visits every interval once pressing minus from the last, then stops', () => {
    const visited: number[] = [30];
    let next = stepReminderInterval(30, -1);

    while (next !== null && visited.length <= REMINDER_INTERVALS.length) {
      visited.push(next);
      next = stepReminderInterval(next, -1);
    }

    expect(visited).toEqual([30, 25, 20, 15, 10, 5]);
  });

  it('can only step a value that is not on the list back onto it, never further off', () => {
    const offered = new Set<number>(REMINDER_INTERVALS);
    const wrong: string[] = [];

    for (let value = -60; value <= 120; value += 0.5) {
      if (offered.has(value)) continue;
      const down = stepReminderInterval(value, -1);
      const up = stepReminderInterval(value, 1);
      if (down !== null && !offered.has(down)) wrong.push(`${value} minus gave ${down}`);
      if (up === null || !offered.has(up)) wrong.push(`${value} plus gave ${up}`);
    }

    expect(wrong).toEqual([]);
  });
});

describe('stepReminderInterval beside the other reminder', () => {
  // Columns: the value stepped from, the minute the other reminder holds, minus, plus
  it.each([
    [15, 10, 5, 20],
    [15, 20, 10, 25],
    [10, 5, null, 15],
    [25, 30, 20, null],
    [5, 10, null, 15],
    [30, 25, 20, null],
  ])('from %i with %i taken, minus gives %s and plus gives %s', (value, taken, down, up) => {
    expect(stepReminderInterval(value, -1, taken)).toBe(down);
    expect(stepReminderInterval(value, 1, taken)).toBe(up);
  });

  it('never lands on the taken minute from anywhere, in either direction', () => {
    for (const taken of REMINDER_INTERVALS) {
      for (const value of REMINDER_INTERVALS) {
        expect(stepReminderInterval(value, -1, taken)).not.toBe(taken);
        expect(stepReminderInterval(value, 1, taken)).not.toBe(taken);
      }
    }
  });

  it('still reaches every other interval when one is taken', () => {
    const reachable = new Set<number>([5]);
    let next = stepReminderInterval(5, 1, 10);

    while (next !== null) {
      reachable.add(next);
      next = stepReminderInterval(next, 1, 10);
    }

    expect([...reachable]).toEqual([5, 15, 20, 25, 30]);
  });
});

describe('freeReminderInterval', () => {
  it('keeps the interval the reminder already had when nothing holds it', () => {
    expect(freeReminderInterval(15, null)).toBe(15);
    expect(freeReminderInterval(15, 20)).toBe(15);
  });

  // Only reached by switching a reminder on ONTO the other's minute, so it must move rather than clash
  it.each<[ReminderInterval, number, ReminderInterval]>([
    [5, 5, 10],
    [30, 30, 25],
    [15, 15, 10],
  ])('moves %i off the taken %i to %i, the nearest free one', (preferred, taken, expected) => {
    expect(freeReminderInterval(preferred, taken)).toBe(expected);
  });

  it('never answers with the taken minute, whichever one it is', () => {
    for (const taken of REMINDER_INTERVALS) {
      expect(freeReminderInterval(taken, taken)).not.toBe(taken);
      expect(REMINDER_INTERVALS).toContain(freeReminderInterval(taken, taken));
    }
  });
});
