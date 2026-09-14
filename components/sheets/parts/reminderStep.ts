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
 * @returns The interval one press moves to, or null when that arrow is at the end of the list
 */
export const stepReminderInterval = (value: number, step: -1 | 1): ReminderInterval | null => {
  const index = REMINDER_INTERVALS.indexOf(value as ReminderInterval);
  const atEnd = step < 0 ? index <= 0 : index >= REMINDER_INTERVALS.length - 1;
  if (atEnd) return null;

  return REMINDER_INTERVALS[index + step];
};
