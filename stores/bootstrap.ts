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
 * Not hydrated (spinner path preserved):
 * - no cached data for today (fresh install, wiped cache, year gap)
 * - a pending upgrade that will WIPE the cache — a version bump AND a moved
 *   cache shape marker. handleAppUpgrade inside sync() owns that wipe+refetch,
 *   and rows read under the old shape are exactly the wrong prayer times, so
 *   the spinner covers it. An ordinary version bump keeps the cache (#34) and
 *   therefore hydrates: refusing to would hand every store update a cold
 *   launch with a valid timetable sitting on disk.
 */

import { perfMark } from '@/shared/perf';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { startCountdowns } from '@/stores/countdown';
import * as Database from '@/stores/database';
import { setSequence } from '@/stores/schedule';
import { cacheSchemaChanged, wasAppUpgraded } from '@/stores/version';

const hydrateFromCache = (): boolean => {
  const now = TimeUtils.createInstant();
  const todayData = Database.getPrayerByDate(now);
  if (!todayData) return false;

  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);
  return true;
};

const bootstrapFromCache = (): boolean => {
  // This module runs at IMPORT time, before app/_layout.tsx reaches
  // initPerfMonitor(), so these marks are buffered by shared/perf.ts and
  // replayed when the monitor comes up (ISSUES #32). No-op in normal builds.
  perfMark('bootstrap_start');

  try {
    // Same pair of questions handleAppUpgrade asks moments later, and it gets
    // the same answers: both markers are written only by handleAppUpgrade,
    // which runs inside sync() on a setTimeout(0) — after this module has
    // already been evaluated. So "the wipe is coming" decided here and the
    // wipe decided there cannot disagree within a launch.
    if (wasAppUpgraded() && cacheSchemaChanged()) return false;
    if (!hydrateFromCache()) return false;

    perfMark('bootstrap_hydrated');

    startCountdowns();
    return true;
  } catch {
    return false;
  } finally {
    // Marked on every path, including the spinner returns above
    perfMark('bootstrap_done');
  }
};

/** Whether the synchronous bootstrap populated the sequences (readable in tests) */
export const didBootstrapFromCache = bootstrapFromCache();
