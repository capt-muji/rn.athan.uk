/**
 * The Ramadan decorations: when they show, when their sprites let the launch splash lift, and that no animation outlives them
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { Platform } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { london } from '@/hooks/__tests__/londonDays';
import { decorationsEnabledAtom, decorationsLoadedAtom } from '@/stores/ui';

import RamadanDecorations from '../RamadanDecorations';

/** Every sprite the decorations draw, by file name and sorted: three clouds, the lantern, the moon and two stars */
const ALL_SPRITES = [
  'cloud-front-1.png',
  'cloud-rear-0.png',
  'cloud-top-2.png',
  'lantern-body.png',
  'lantern-flicker.png',
  'lantern-glow.png',
  'moon-crescent.png',
  'moon-glow.png',
  'star-body.png',
  'star-body.png',
  'star-glow.png',
  'star-glow.png',
];

const store = getDefaultStore();

// Math.random, Reanimated and the platform are spied on or replaced by one test only
afterEach(() => jest.restoreAllMocks());

/**
 * Sets the London clock and pins Math.random, which sizes, places and steers the clouds
 *
 * @param random What every Math.random call returns: above 0.5 the clouds drift right, otherwise left
 */
const setClock = (date: string, time: string, random = 0.5) => {
  jest.useFakeTimers({ now: london(date, time) });
  jest.spyOn(Math, 'random').mockReturnValue(random);
};

/**
 * Watches the loops the decorations arm and the animated values they stop
 *
 * The published Reanimated mock runs no animation, so arming a loop and stopping one are seen only as the calls the
 * component makes into it. The spies call straight through to the mock.
 */
const watchAnimations = () => ({
  armed: jest.spyOn(Reanimated, 'withRepeat'),
  stopped: jest.spyOn(Reanimated, 'cancelAnimation'),
});

/** The sprites on screen: they carry no role or label a person could find them by, so they are the views drawing an image */
const sprites = () => screen.container.queryAll((node) => node.props.source !== undefined);

/** The file names of the sprites on screen, sorted */
const spriteNames = () =>
  sprites()
    .map((sprite) => sprite.props.source[0].testUri.split('/').pop())
    .sort();

/** How many different animated values have been stopped */
const stoppedValueCount = (stopped: jest.SpiedFunction<typeof Reanimated.cancelAnimation>) =>
  new Set(stopped.mock.calls.map(([value]) => value)).size;

describe("the Ramadan decorations at the edges of the 2027 season, 15 Sha'ban to 29 Ramadan", () => {
  it.each([
    // the moment in words, then as a London date and clock reading
    ["Friday 22 January 2027 at 23:59, 14 Sha'ban", '2027-01-22', '23:59'],
    ['Tuesday 9 March 2027 at 00:00, 1 Shawwal', '2027-03-09', '00:00'],
  ])('draws nothing and arms no animation on %s', async (_moment, date, time) => {
    setClock(date, time);
    const { armed } = watchAnimations();

    await render(<RamadanDecorations />);

    expect(screen.toJSON()).toBeNull();
    expect(armed).not.toHaveBeenCalled();
  });

  it.each([
    // the moment in words, then as a London date and clock reading
    ["Saturday 23 January 2027 at 00:00, 15 Sha'ban", '2027-01-23', '00:00'],
    ['Monday 8 March 2027 at 23:59, 29 Ramadan', '2027-03-08', '23:59'],
  ])('draws every sprite and arms its animations on %s', async (_moment, date, time) => {
    setClock(date, time);
    const { armed } = watchAnimations();

    await render(<RamadanDecorations />);

    expect(spriteNames()).toEqual(ALL_SPRITES);
    expect(armed).toHaveBeenCalled();
  });
});

describe('the Ramadan decorations on Monday 15 February 2027 at 20:00, 8 Ramadan', () => {
  it.each([
    // the platform, whose window height decides how far the hangings reach, then Math.random, which steers the clouds
    ['ios', 0.9],
    ['android', 0.1],
  ] as const)('draws the same sprites on %s, whichever way the clouds drift', async (os, random) => {
    setClock('2027-02-15', '20:00', random);
    jest.replaceProperty(Platform, 'OS', os);

    await render(<RamadanDecorations />);

    expect(spriteNames()).toEqual(ALL_SPRITES);
  });

  it('draws nothing and arms no animation with decorations turned off', async () => {
    setClock('2027-02-15', '20:00');
    // The Settings sheet's "Show decorations" toggle writes this atom itself: there is no store setter for it
    store.set(decorationsEnabledAtom, false);
    const { armed } = watchAnimations();

    await render(<RamadanDecorations />);

    expect(screen.toJSON()).toBeNull();
    expect(armed).not.toHaveBeenCalled();
  });

  it('holds the splash while one sprite has not reported its load end', async () => {
    setClock('2027-02-15', '20:00');
    await render(<RamadanDecorations />);

    for (const sprite of sprites().slice(1)) await fireEvent(sprite, 'loadEnd');

    expect(store.get(decorationsLoadedAtom)).toBe(false);
  });

  it.each([
    // how each bitmap's load ended, then the event React Native fires just before that load end
    ['succeeded', 'load'],
    ['failed', 'error'],
  ])('lifts the splash once every sprite has reported its load end, every load having %s', async (_outcome, event) => {
    setClock('2027-02-15', '20:00');
    await render(<RamadanDecorations />);

    for (const sprite of sprites()) {
      await fireEvent(sprite, event);
      await fireEvent(sprite, 'loadEnd');
    }

    expect(store.get(decorationsLoadedAtom)).toBe(true);
  });

  it('stops every animation it armed when it unmounts', async () => {
    setClock('2027-02-15', '20:00');
    const { armed, stopped } = watchAnimations();
    await render(<RamadanDecorations />);

    await screen.unmount();

    expect(armed).toHaveBeenCalled();
    expect(stoppedValueCount(stopped)).toBe(armed.mock.calls.length);
  });

  it('stops every animation it armed when decorations are turned off', async () => {
    setClock('2027-02-15', '20:00');
    const { armed, stopped } = watchAnimations();
    await render(<RamadanDecorations />);

    // The Settings sheet's "Show decorations" toggle writes this atom itself: there is no store setter for it
    await act(() => store.set(decorationsEnabledAtom, false));

    expect(armed).toHaveBeenCalled();
    expect(stoppedValueCount(stopped)).toBe(armed.mock.calls.length);
  });

  it('arms every animation again when decorations are turned off and back on', async () => {
    setClock('2027-02-15', '20:00');
    const { armed } = watchAnimations();
    await render(<RamadanDecorations />);
    const armedWhenShown = armed.mock.calls.length;
    // The Settings sheet's "Show decorations" toggle writes this atom itself: there is no store setter for it
    await act(() => store.set(decorationsEnabledAtom, false));
    armed.mockClear();

    await act(() => store.set(decorationsEnabledAtom, true));

    expect(armed).toHaveBeenCalledTimes(armedWhenShown);
  });
});
