/**
 * The launch splash has two paths. A cold launch (nothing stored) lifts it onto the spinner straight away instead of
 * holding it through the whole download. A warm launch lifts it the moment content exists - the app straight from
 * cache, the Masjid icon's bitmap decoding behind the revealed frame rather than holding the splash over a finished
 * screen (owner order 2026-10-30: a near-zero native splash in both launch shapes). In Ramadan the reveal still
 * waits for the decoration sprites, the one art that screen is about to draw full-bleed. Either failing leaves the
 * splash over a screen that is ready, or lifts it onto missing art the screen is built around.
 */

import { isRevealReady, isWaitingForData, type RevealInput, type SyncState } from '../launchGate';

const BOOLEANS = [false, true];

const allRevealInputs = (): RevealInput[] => {
  const inputs: RevealInput[] = [];
  for (const coldLaunch of BOOLEANS) {
    for (const contentExists of BOOLEANS) {
      for (const decorationsExpected of BOOLEANS) {
        for (const decorationsLoaded of BOOLEANS) {
          inputs.push({ coldLaunch, contentExists, decorationsExpected, decorationsLoaded });
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
  it('reveals in exactly three of the 16 states: a warm launch with content, decorations loaded if expected', () => {
    const revealing = allRevealInputs().filter((input) => isRevealReady(input));

    expect(revealing).toEqual([
      {
        coldLaunch: false,
        contentExists: true,
        decorationsExpected: false,
        decorationsLoaded: false,
      },
      {
        coldLaunch: false,
        contentExists: true,
        decorationsExpected: false,
        decorationsLoaded: true,
      },
      {
        coldLaunch: false,
        contentExists: true,
        decorationsExpected: true,
        decorationsLoaded: true,
      },
    ]);
  });

  it('never reveals from this gate on a cold launch, which lifted the splash at its first commit', () => {
    const cold = allRevealInputs().filter((input) => input.coldLaunch);

    expect(cold).toHaveLength(8);
    for (const input of cold) expect(isRevealReady(input)).toBe(false);
  });

  it('reveals a warm launch outside Ramadan at the content commit, without waiting for any bitmap', () => {
    expect(
      isRevealReady({ coldLaunch: false, contentExists: true, decorationsExpected: false, decorationsLoaded: false })
    ).toBe(true);
  });

  it('holds a warm launch in Ramadan through the decorations load', () => {
    const timeline = [false, true].map((decorationsLoaded) =>
      isRevealReady({ coldLaunch: false, contentExists: true, decorationsExpected: true, decorationsLoaded })
    );

    expect(timeline).toEqual([false, true]);
  });
});
