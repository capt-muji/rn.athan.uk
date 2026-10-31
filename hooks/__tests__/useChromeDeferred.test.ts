/**
 * Unit tests for hooks/useChromeDeferred.ts
 *
 * Launch chrome stays out of the first commit and may mount only once a frame has completed with headroom (the idle
 * callback), asked for once per screen, never for a screen gone before its first drawn frame, and never left
 * unmounted by a main thread that never once idles (the timeout backstop). The hook runs under hookHarness; idle
 * frames are painted by hand, so when a device actually goes idle is not shown here.
 */

import { useChromeDeferred } from '../useChromeDeferred';
import { mountHook } from './hookHarness';

jest.mock('react', () => require('./hookHarness').react);

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

const idleCallbacks = new Map<number, (deadline: IdleDeadline) => void>();
const idleOptions: Array<{ timeout?: number } | undefined> = [];
let idleRequests = 0;
let cancelled: Array<number | null | undefined> = [];

const originalRequest = global.requestIdleCallback;
const originalCancel = global.cancelIdleCallback;

/** The first frame that completed its work with budget left: every pending idle callback runs */
const firstIdleFrame = () => {
  const due = [...idleCallbacks.values()];
  idleCallbacks.clear();
  for (const callback of due) callback({ didTimeout: false, timeRemaining: () => 8 });
};

beforeEach(() => {
  jest.useFakeTimers();
  idleCallbacks.clear();
  idleRequests = 0;
  cancelled = [];
  global.requestIdleCallback = (callback, options) => {
    idleRequests += 1;
    idleOptions[idleRequests - 1] = options;
    idleCallbacks.set(idleRequests, callback);
    return idleRequests;
  };
  global.cancelIdleCallback = (handle: number | null | undefined) => {
    cancelled.push(handle);
    if (handle !== null && handle !== undefined) idleCallbacks.delete(handle);
  };
});

afterEach(() => {
  jest.useRealTimers();
  global.requestIdleCallback = originalRequest;
  global.cancelIdleCallback = originalCancel;
});

describe('useChromeDeferred', () => {
  it('leaves chrome out of the first commit, and mounts it on the first frame that completed with headroom', () => {
    const view = mountHook(useChromeDeferred, undefined);
    expect(view.result).toBe(false);

    jest.runOnlyPendingTimers();
    expect(view.result).toBe(false);

    firstIdleFrame();
    expect(view.result).toBe(true);
  });

  it('asks for one idle callback for the life of the screen, however often it re-renders', () => {
    const view = mountHook(useChromeDeferred, undefined);
    view.rerender();
    view.rerender();

    firstIdleFrame();
    view.rerender();

    expect(view.result).toBe(true);
    expect(idleRequests).toBe(1);
  });

  it('gives up its idle callback when the screen unmounts before any idle frame, so chrome never mounts for it', () => {
    const view = mountHook(useChromeDeferred, undefined);

    view.unmount();
    expect(idleCallbacks.size).toBe(0);
    expect(cancelled).toEqual([1]);

    firstIdleFrame();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('asks the platform for its degenerate backstop, and mounts chrome on a timeout delivery, so a never-idle main thread cannot leave the app without its chrome', () => {
    const view = mountHook(useChromeDeferred, undefined);

    expect(idleOptions[0]).toEqual({ timeout: 2000 });

    // The platform's timeout contract: with no idle frame in the window, the callback still fires, flagged
    jest.advanceTimersByTime(2000);
    for (const callback of [...idleCallbacks.values()]) callback({ didTimeout: true, timeRemaining: () => 0 });

    expect(view.result).toBe(true);
  });
});
