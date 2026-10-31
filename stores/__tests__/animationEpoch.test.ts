/**
 * The animation epoch: whether per-second writes stand down while an animation
 * runs, and whether a settle that never comes can freeze the display forever
 */

import {
  type AnimationEpochSlot,
  animationEpochOpen,
  closeAnimationEpoch,
  openAnimationEpoch,
} from '@/stores/animationEpoch';

describe('the animation epoch', () => {
  let opened: AnimationEpochSlot[];

  beforeEach(() => {
    opened = [];
  });

  afterEach(() => {
    for (const slot of opened) closeAnimationEpoch(slot);
    opened = [];
    jest.useRealTimers();
  });

  const open = () => {
    const slot = openAnimationEpoch();
    opened.push(slot);
    return slot;
  };

  it('is closed at rest, so ticks write', () => {
    expect(animationEpochOpen()).toBe(false);
  });

  it('is open between an animation starting and its settle', () => {
    const slot = open();

    expect(animationEpochOpen()).toBe(true);

    closeAnimationEpoch(slot);

    expect(animationEpochOpen()).toBe(false);
  });

  it("holds one owner's window when another owner's animation settles first", () => {
    const first = open();
    const second = open();

    closeAnimationEpoch(second);

    expect(animationEpochOpen()).toBe(true);

    closeAnimationEpoch(first);

    expect(animationEpochOpen()).toBe(false);
  });

  it('releases nothing when a close arrives with no slot, the rest of an owner that never started', () => {
    const slot = open();

    closeAnimationEpoch(null);

    expect(animationEpochOpen()).toBe(true);

    closeAnimationEpoch(slot);

    expect(animationEpochOpen()).toBe(false);
  });

  it('holds the window when a second animation starts beside a first the valve expired', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    open();

    jest.advanceTimersByTime(1000);
    open();

    expect(animationEpochOpen()).toBe(true);
  });

  it('releases an epoch whose settle never came, so a stuck epoch cannot freeze the display', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    open();
    jest.advanceTimersByTime(601);

    expect(animationEpochOpen()).toBe(false);
  });

  it('drops a hold stamped in the future, a clock that moved back', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    open();
    jest.setSystemTime(new Date('2026-01-20T09:59:59.000Z'));

    expect(animationEpochOpen()).toBe(false);
  });

  it('holds an epoch that is still inside the valve window', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-20T10:00:00.000Z'));

    open();
    jest.advanceTimersByTime(600);

    expect(animationEpochOpen()).toBe(true);
  });
});
