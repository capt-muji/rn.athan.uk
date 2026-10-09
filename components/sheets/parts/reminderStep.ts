/**
 * One press of the reminder interval stepper, pure so it can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts).
 *
 * The stepper greys an arrow out from this and the alert sheet moves the value with it, so an arrow that looks live
 * always moves the value and an arrow that looks dead never does.
 */

import { REMINDER_INTERVALS } from '@/shared/constants';
import type { ReminderInterval } from '@/shared/types';

/**
 * @param value The interval the stepper shows
 * @param step -1 for the minus arrow, 1 for the plus arrow
 * @param taken The other reminder's interval while it is on, so the two can never land on one moment. Stepping
 *   passes over it rather than refusing, which is why no clash needs explaining to the user
 * @returns The interval one press moves to, or null when that arrow has nothing left to reach
 */
export const stepReminderInterval = (
  value: number,
  step: -1 | 1,
  taken: number | null = null
): ReminderInterval | null => {
  let index = REMINDER_INTERVALS.indexOf(value as ReminderInterval);

  for (;;) {
    index += step;
    if (index < 0 || index >= REMINDER_INTERVALS.length) return null;
    if (REMINDER_INTERVALS[index] !== taken) return REMINDER_INTERVALS[index];
  }
};

/**
 * The interval a reminder switches on at. Its saved choice is kept unless the other reminder already holds it,
 * in which case the nearest free one stands in: the two are only ever compared at the moment one turns on, so no
 * value the user is looking at can move under them.
 *
 * @param preferred The interval this reminder last had
 * @param taken The other reminder's interval while it is on
 * @returns The interval to switch on at
 */
export const freeReminderInterval = (preferred: ReminderInterval, taken: number | null): ReminderInterval => {
  if (preferred !== taken) return preferred;

  const nearest = REMINDER_INTERVALS.filter((interval) => interval !== taken).sort(
    (a, b) => Math.abs(a - preferred) - Math.abs(b - preferred)
  );

  return nearest[0];
};
