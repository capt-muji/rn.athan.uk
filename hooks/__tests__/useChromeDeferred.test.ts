/**
 * Unit tests for hooks/useChromeDeferred.ts
 *
 * Launch chrome stays out of the first commit and may mount one frame and one macrotask later, asked for once per
 * screen, and never for a screen gone before its first frame. The hook runs under hookHarness; frames are painted by
 * hand and the macrotask runs on jest's fake timers, so when a device actually paints is not shown here.
 */

import { useChromeDeferred } from '../useChromeDeferred';
import { mountHook } from './hookHarness';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
jest.mock('react', () => require('./hookHarness').react);

const frames = new Map<number, FrameRequestCallback>();
let frameRequests = 0;

const paintFrame = () => {
  const due = [...frames.values()];
  frames.clear();
  for (const callback of due) callback(0);
};

const originalRequest = global.requestAnimationFrame;
const originalCancel = global.cancelAnimationFrame;

beforeEach(() => {
  jest.useFakeTimers();
  frames.clear();
  frameRequests = 0;
  global.requestAnimationFrame = (callback) => {
    frameRequests += 1;
    frames.set(frameRequests, callback);
    return frameRequests;
  };
  global.cancelAnimationFrame = (handle) => {
    if (typeof handle === 'number') frames.delete(handle);
  };
});

afterEach(() => {
  jest.useRealTimers();
  global.requestAnimationFrame = originalRequest;
  global.cancelAnimationFrame = originalCancel;
});

describe('useChromeDeferred', () => {
  it('leaves chrome out of the first commit, and lets it mount after one frame and the macrotask behind it', () => {
    const view = mountHook(useChromeDeferred, undefined);
    expect(view.result).toBe(false);

    jest.runOnlyPendingTimers();
    expect(view.result).toBe(false);

    paintFrame();
    expect(view.result).toBe(false);

    jest.runOnlyPendingTimers();
    expect(view.result).toBe(true);
  });

  it('asks for one frame for the life of the screen, however often it re-renders', () => {
    const view = mountHook(useChromeDeferred, undefined);
    view.rerender();
    view.rerender();

    paintFrame();
    view.rerender();
    jest.runOnlyPendingTimers();

    expect(view.result).toBe(true);
    expect(frameRequests).toBe(1);
  });

  it('gives up its frame when the screen unmounts before it, so chrome never mounts for it', () => {
    const view = mountHook(useChromeDeferred, undefined);

    view.unmount();
    expect(frames.size).toBe(0);

    paintFrame();
    jest.runAllTimers();
    expect(view.result).toBe(false);
  });
});
