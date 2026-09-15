/**
 * Shared set-up for component suites, which render real components with React Native Testing Library
 *
 * A component reads the app's own stores, so a suite puts the app in a state the way the app does: real London days
 * saved through the real database (on the in-memory MMKV mock), the clock set, and both lists built by setSequence.
 * How component tests are written here: __tests__/README.md.
 */

import { type Breakage, london, saveLondonDays } from '@/hooks/__tests__/londonDays';
import { ScheduleType } from '@/shared/types';
import { setSequence } from '@/stores/schedule';

/**
 * Shows 10 to 12 September 2026 as stored London days, with the clock at a London reading and both lists built
 *
 * Fake timers stay on for the rest of the test, so countdown tickers and animations only move when the test moves
 * them. 11 September 2026 is a Friday.
 *
 * @param date The London date, from 2026-09-10 to 2026-09-12
 * @param time The London clock reading, HH:mm
 * @param breakage Times sent unreadably, or days not stored
 * @returns The instant the clock was set to
 */
export const showLondonDay = (date: string, time: string, breakage: Breakage = {}): Date => {
  const now = london(date, time);
  jest.useFakeTimers({ now });

  saveLondonDays(breakage);
  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);

  return now;
};
