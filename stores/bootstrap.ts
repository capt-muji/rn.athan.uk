/**
 * Synchronous cache bootstrap — first-paint surgery (perf22)
 *
 * Hydrates both prayer sequences from the MMKV cache synchronously at module
 * evaluation, BEFORE React renders, so a warm-cache launch paints real content
 * on its first commit instead of waiting for the async sync() atom to resolve
 * (loading spinner + splash previously covered the whole sync pipeline:
 * upgrade check, mock/data refresh, sequence setup, countdown start).
 *
 * The async sync() still runs on its setTimeout(0) exactly as before — it
 * refreshes data when needed and re-runs setSequence + startCountdowns.
 * setSequence's identity-skip means the warm-cache path performs no atom
 * write at all there (no redundant row re-renders); a real data refresh
 * writes as before.
 *
 * Not hydrated (spinner path preserved, first-launch/upgrade parity with the
 * previous behavior):
 * - no cached data for today (fresh install, wiped cache, year gap)
 * - app upgrade pending (installed version differs — handleAppUpgrade inside
 *   sync() owns the wipe+refetch; rendering the old version's times for a
 *   moment would be a behavior change, so the spinner covers it)
 */

import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { startCountdowns } from '@/stores/countdown';
import * as Database from '@/stores/database';
import { setSequence } from '@/stores/schedule';
import { wasAppUpgraded } from '@/stores/version';

const hydrateFromCache = (): boolean => {
  const now = TimeUtils.createLondonDate();
  const todayData = Database.getPrayerByDate(now);
  if (!todayData) return false;

  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);
  return true;
};

const bootstrapFromCache = (): boolean => {
  try {
    if (wasAppUpgraded()) return false;
    if (!hydrateFromCache()) return false;

    startCountdowns();
    return true;
  } catch {
    return false;
  }
};

/** Whether the synchronous bootstrap populated the sequences (readable in tests) */
export const didBootstrapFromCache = bootstrapFromCache();
