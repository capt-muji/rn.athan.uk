/**
 * The idle ladder (T-327 step 24, digest 5101 approach A): post-launch
 * warming staged on requestIdleCallback, so the first actions after the
 * warming window hold the level their second run already holds.
 *
 * Three stages, each in its own idle frame so a four-core phone never pays
 * two in one: the overlay entrance's rehearsal first (the likeliest first
 * action), the likely sheet bodies' content mounts second, the measured
 * geometry seal third. Stage one cannot even arm before the 1500ms init
 * burst (notification init, sync, update check) has started and quieted —
 * warming stacked onto that burst is the one mistake the digest names on
 * this hardware.
 *
 * Every stage rides requestIdleCallback with its own timeout backstop, so a
 * main thread that never idles still completes the ladder, late. The run is
 * once per process: a language remount re-renders the consumers but never
 * re-arms the scheduler, and a rehearsal cut short by a suspend or a resync
 * snap settles early — partial warming, never wrong state.
 */

import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

import logger from '@/shared/logger';
import { perfMark } from '@/shared/perf';
import { bumpSheetSettleTick } from '@/stores/geometry';

const store = getDefaultStore();

/** The ladder's stages, in the order they run */
export const WARMUP_STAGE = {
  NOT_STARTED: 0,
  REHEARSAL: 1,
  SHEET_BODIES: 2,
  COMPLETE: 3,
} as const;

/**
 * The quiet margin before stage one may arm: the init timeout fires at
 * 1500ms past Index mount and its notification init, sync and update check
 * run on past the firing, so the ladder opens ~3s past the chrome-deferred
 * mount — past the burst, still inside the digest's 1-2s-past-content
 * warming sketch.
 */
const INIT_BURST_QUIET_MS = 3000;

/** A stage never waits on an idle frame forever: late warming still warms */
const STAGE_BACKSTOP_MS = 4000;

let ladderArmed = false;
let rehearsalSettled = false;

/** The ladder's current stage; the consumers mount and unmount on it */
export const warmupStageAtom = atom<number>(WARMUP_STAGE.NOT_STARTED);

const mark = (stage: string) => {
  perfMark('idle_ladder', { stage });
  logger.info(`WARMUP: idle ladder ${stage}`);
};

const scheduleIdleStage = (run: () => void) => {
  requestIdleCallback(() => run(), { timeout: STAGE_BACKSTOP_MS });
};

const startRehearsal = () => {
  store.set(warmupStageAtom, WARMUP_STAGE.REHEARSAL);
  mark('rehearsal');
};

const sealMeasuredGeometry = () => {
  // The sheet bodies mounted in the previous stage's commit have laid out
  // and measured by any later idle frame, and the settle tick is the one
  // sanctioned moment a measured geometry may reach its cache — the same
  // write a real sheet's settle makes, paid here at idle instead
  bumpSheetSettleTick();
  store.set(warmupStageAtom, WARMUP_STAGE.COMPLETE);
  mark('complete');
};

const mountSheetBodies = () => {
  store.set(warmupStageAtom, WARMUP_STAGE.SHEET_BODIES);
  mark('sheet bodies');
  scheduleIdleStage(sealMeasuredGeometry);
};

/** Arms the ladder once per process; the stages then ride idle frames */
export const beginIdleLadder = () => {
  if (ladderArmed) return;
  ladderArmed = true;
  setTimeout(() => scheduleIdleStage(startRehearsal), INIT_BURST_QUIET_MS);
};

/**
 * The rehearsal's own completion, from its second leg's settle: the one
 * async boundary the scheduler waits on, because only the rig knows when
 * both legs have truly run.
 */
export const markRehearsalSettled = () => {
  if (rehearsalSettled) return;
  rehearsalSettled = true;
  mark('rehearsal settled');
  scheduleIdleStage(mountSheetBodies);
};

/** Test-only: the process latches and the stage re-arm for the next case */
export const __resetWarmupForTests = () => {
  ladderArmed = false;
  rehearsalSettled = false;
  store.set(warmupStageAtom, WARMUP_STAGE.NOT_STARTED);
};
