/**
 * The reminder stepper's arrows. The alert sheet commits whatever interval they leave, so a press that skips, runs
 * off either end or goes the wrong way saves a reminder offset the user did not choose.
 */

import { REMINDER_INTERVALS } from '@/shared/constants';

import { stepReminderInterval } from '../reminderStep';

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
