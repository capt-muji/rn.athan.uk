/**
 * The animation epoch: whether per-second writes stand down while an animation
 * runs, and whether a settle that never comes can freeze the display forever
 */

import { animationEpochOpen, closeAnimationEpoch, openAnimationEpoch } from '@/stores/animationEpoch';

describe('the animation epoch', () => {
  afterEach(() => {
    closeAnimationEpoch();
    jest.useRealTimers();
  });

  it('is closed at rest, so ticks write', () => {
    expect(animationEpochOpen()).toBe(false);
  });

  it('is open between an animation starting and its settle', () => {
    openAnimationEpoch();

    expect(animationEpochOpen()).toBe(true);

    closeAnimationEpoch();

    expect(animationEpochOpen()).toBe(false);
  });

  it('keeps the earliest opening when a second animation starts before the first settles', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    openAnimationEpoch();

    jest.advanceTimersByTime(1000);
    openAnimationEpoch();

    expect(animationEpochOpen()).toBe(true);
  });

  it('releases an epoch whose settle never came, so a stuck epoch cannot freeze the display', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    openAnimationEpoch();
    jest.advanceTimersByTime(601);

    expect(animationEpochOpen()).toBe(false);
  });

  it('drops a hold stamped in the future, a clock that moved back', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    openAnimationEpoch();
    jest.setSystemTime(new Date('2026-01-20T09:59:59.000Z'));

    expect(animationEpochOpen()).toBe(false);
  });

  it('holds an epoch that is still inside the valve window', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    openAnimationEpoch();
    jest.advanceTimersByTime(600);

    expect(animationEpochOpen()).toBe(true);
  });
});
