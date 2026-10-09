/**
 * Shared set-up for component suites, which render real components with React Native Testing Library
 *
 * A component reads the app's own stores, so a suite puts the app in a state the way the app does: real London days
 * saved through the real database (on the in-memory MMKV mock), the clock set, and both lists built by setSequence.
 * How component tests are written here: __tests__/README.md.
 */

import { Platform } from 'react-native';

import { type Breakage, london, saveLondonDays } from '@/hooks/__tests__/londonDays';
import { ScheduleType } from '@/shared/types';
import { setSequence } from '@/stores/schedule';

export { type Breakage, london, saveLondonDays };

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

/**
 * Runs the rest of the test as Android or iOS. Jest loads React Native as iOS; from here Platform.OS, Platform.Version
 * and Platform.select answer as the platform given, until jest.components.setup.js undoes the switch after the test. A
 * value a module works out as it loads is not read again: __tests__/README.md says how to test one
 *
 * @param os The platform
 * @param version What `Platform.Version` reads: Android's API level, or iOS's version string
 */
export const onPlatform = (os: 'ios' | 'android', version?: number | string): void => {
  jest.replaceProperty(Platform, 'OS', os);
  if (version !== undefined) jest.spyOn(Platform, 'Version', 'get').mockReturnValue(version);
  // React Native's iOS and Android Platform files each hard-code their own select, so the iOS file Jest loads answers
  // iOS whatever OS says. Both files look for the platform's own key, then native, then default
  jest
    .spyOn(Platform, 'select')
    .mockImplementation(((spec: Record<string, unknown>) =>
      os in spec ? spec[os] : 'native' in spec ? spec.native : spec.default) as typeof Platform.select);
};
