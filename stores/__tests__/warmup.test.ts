/**
 * Unit tests for stores/warmup.ts (the idle ladder)
 *
 * The ladder's contracts: nothing runs before the init burst has quieted, every stage rides its own idle frame with a
 * backstop, the measured-geometry seal lands only after the sheet bodies' stage, and the whole run is once per
 * process. Idle frames are painted by hand, so when a device actually goes idle is not shown here.
 */

import { getDefaultStore } from 'jotai/vanilla';

import { sheetSettleTickAtom } from '@/stores/geometry';

import { __resetWarmupForTests, beginIdleLadder, markRehearsalSettled, WARMUP_STAGE, warmupStageAtom } from '../warmup';

jest.mock('@/shared/perf', () => ({ perfMark: jest.fn() }));
jest.mock('@/shared/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

const idleCallbacks = new Map<number, (deadline: IdleDeadline) => void>();
const idleOptions: Array<{ timeout?: number } | undefined> = [];
let idleRequests = 0;

const originalRequest = global.requestIdleCallback;
const originalCancel = global.cancelIdleCallback;

/** Every pending idle callback runs, as an idle frame that completed with budget left */
const idleFrame = () => {
  const due = [...idleCallbacks.values()];
  idleCallbacks.clear();
  for (const callback of due) callback({ didTimeout: false, timeRemaining: () => 8 });
};

const stage = () => getDefaultStore().get(warmupStageAtom);

beforeEach(() => {
  jest.useFakeTimers();
  __resetWarmupForTests();
  idleCallbacks.clear();
  idleRequests = 0;
  idleOptions.length = 0;
  global.requestIdleCallback = (callback, options) => {
    idleRequests += 1;
    idleOptions[idleRequests - 1] = options;
    idleCallbacks.set(idleRequests, callback);
    return idleRequests;
  };
  global.cancelIdleCallback = () => {};
});

afterEach(() => {
  jest.useRealTimers();
  global.requestIdleCallback = originalRequest;
  global.cancelIdleCallback = originalCancel;
});

describe('the idle ladder', () => {
  it('arms nothing before the init burst has quieted, however idle the thread goes', () => {
    beginIdleLadder();
    expect(stage()).toBe(WARMUP_STAGE.NOT_STARTED);

    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.NOT_STARTED);

    // The quiet gate itself: the burst fires at 1500ms and runs on past it
    jest.advanceTimersByTime(2900);
    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.NOT_STARTED);
  });

  it('starts the rehearsal one idle frame past the quiet gate, never on the gate itself', () => {
    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    expect(stage()).toBe(WARMUP_STAGE.NOT_STARTED);
    expect(idleRequests).toBe(1);

    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.REHEARSAL);
  });

  it('mounts the sheet bodies only after the rehearsal settled, in a later idle frame', () => {
    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.REHEARSAL);

    markRehearsalSettled();
    expect(stage()).toBe(WARMUP_STAGE.REHEARSAL);
    expect(idleRequests).toBe(2);

    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.SHEET_BODIES);
  });

  it('seals the measured geometry in the stage after the bodies mounted, bumping the settle tick once', () => {
    const store = getDefaultStore();
    const tickBefore = store.get(sheetSettleTickAtom);

    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    idleFrame();
    markRehearsalSettled();
    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.SHEET_BODIES);
    expect(store.get(sheetSettleTickAtom)).toBe(tickBefore);

    // The seal rides its own idle frame: the bodies' commit and layout land first
    expect(idleRequests).toBe(3);
    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.COMPLETE);
    expect(store.get(sheetSettleTickAtom)).toBe(tickBefore + 1);
    expect(idleRequests).toBe(3);
  });

  it('carries a backstop on every idle request, so a never-idle thread still completes the ladder', () => {
    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    expect(idleOptions[0]).toEqual({ timeout: 4000 });

    // The platform's timeout contract: the callback fires flagged, with no budget
    jest.advanceTimersByTime(4000);
    for (const callback of [...idleCallbacks.values()]) callback({ didTimeout: true, timeRemaining: () => 0 });
    expect(stage()).toBe(WARMUP_STAGE.REHEARSAL);

    markRehearsalSettled();
    expect(idleOptions[1]).toEqual({ timeout: 4000 });
  });

  it('runs once per process: a second arm neither schedules nor rewinds anything', () => {
    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    idleFrame();
    markRehearsalSettled();
    idleFrame();
    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.COMPLETE);
    const timersAtComplete = jest.getTimerCount();

    beginIdleLadder();
    expect(jest.getTimerCount()).toBe(timersAtComplete);
    expect(idleRequests).toBe(3);
    expect(stage()).toBe(WARMUP_STAGE.COMPLETE);
  });

  it('settles the rehearsal once: a second settle schedules nothing further', () => {
    beginIdleLadder();
    jest.advanceTimersByTime(3000);
    idleFrame();

    markRehearsalSettled();
    markRehearsalSettled();
    expect(idleRequests).toBe(2);

    idleFrame();
    expect(stage()).toBe(WARMUP_STAGE.SHEET_BODIES);
  });
});
