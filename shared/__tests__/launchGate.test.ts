/**
 * The launch splash has two paths. A cold launch (nothing stored) lifts it onto the spinner straight away instead of
 * holding it through the whole download. A warm launch holds it until the first frame is complete, Masjid icon and,
 * in Ramadan, the decorations included. Either failing leaves the splash over a screen, or lifts it onto missing art.
 */

import { isRevealReady, isWaitingForData, type RevealInput, type SyncState } from '../launchGate';

const BOOLEANS = [false, true];

const allRevealInputs = (): RevealInput[] => {
  const inputs: RevealInput[] = [];
  for (const coldLaunch of BOOLEANS) {
    for (const contentExists of BOOLEANS) {
      for (const masjidIconLoaded of BOOLEANS) {
        for (const decorationsExpected of BOOLEANS) {
          for (const decorationsLoaded of BOOLEANS) {
            inputs.push({ coldLaunch, contentExists, masjidIconLoaded, decorationsExpected, decorationsLoaded });
          }
        }
      }
    }
  }
  return inputs;
};

describe('isWaitingForData', () => {
  it.each([
    ['no stored days while sync loads', true, false, 'loading'],
    ['no stored days once sync has data', false, false, 'hasData'],
    ['no stored days once sync has failed, which shows the error screen', false, false, 'hasError'],
    ['a warm launch while sync loads', false, true, 'loading'],
    ['a warm launch once sync has data', false, true, 'hasData'],
    ['a warm launch once sync has failed', false, true, 'hasError'],
  ] as [string, boolean, boolean, SyncState][])('%s: waits %s', (_case, waits, sequenceReady, syncState) => {
    expect(isWaitingForData(sequenceReady, syncState)).toBe(waits);
  });
});

describe('isRevealReady', () => {
  it('reveals in exactly three of the 32 states: a warm launch with content and its icon, and decorations loaded if expected', () => {
    const revealing = allRevealInputs().filter((input) => isRevealReady(input));

    expect(revealing).toEqual([
      {
        coldLaunch: false,
        contentExists: true,
        masjidIconLoaded: true,
        decorationsExpected: false,
        decorationsLoaded: false,
      },
      {
        coldLaunch: false,
        contentExists: true,
        masjidIconLoaded: true,
        decorationsExpected: false,
        decorationsLoaded: true,
      },
      {
        coldLaunch: false,
        contentExists: true,
        masjidIconLoaded: true,
        decorationsExpected: true,
        decorationsLoaded: true,
      },
    ]);
  });

  it('never reveals from this gate on a cold launch, which lifted the splash at its first commit', () => {
    const cold = allRevealInputs().filter((input) => input.coldLaunch);

    expect(cold).toHaveLength(16);
    for (const input of cold) expect(isRevealReady(input)).toBe(false);
  });

  it('reveals a warm launch outside Ramadan when its icon loads, without waiting for decorations it will not render', () => {
    const timeline = [
      { contentExists: true, masjidIconLoaded: false },
      { contentExists: true, masjidIconLoaded: true },
    ].map((step) =>
      isRevealReady({ coldLaunch: false, decorationsExpected: false, decorationsLoaded: false, ...step })
    );

    expect(timeline).toEqual([false, true]);
  });

  it('holds a warm launch in Ramadan through the icon until the decorations load', () => {
    const timeline = [
      { masjidIconLoaded: false, decorationsLoaded: false },
      { masjidIconLoaded: true, decorationsLoaded: false },
      { masjidIconLoaded: true, decorationsLoaded: true },
    ].map((step) => isRevealReady({ coldLaunch: false, contentExists: true, decorationsExpected: true, ...step }));

    expect(timeline).toEqual([false, false, true]);
  });
});
