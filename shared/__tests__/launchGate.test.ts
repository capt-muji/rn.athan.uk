/**
 * The launch splash has two paths. A cold launch (nothing stored) lifts it onto the spinner straight away instead of
 * holding it through the whole download. A warm launch lifts it on the content's first DRAWN frame, not the commit
 * that scheduled it: onLayout rides the native layout pass, which on Fabric lands past the mount burst that trails
 * the commit on a slow phone - the app straight from cache, the Masjid icon's bitmap decoding behind the revealed
 * frame rather than holding the splash over a finished screen (owner order 2026-10-30: a near-zero native splash in
 * both launch shapes). In Ramadan the reveal still waits for the decoration sprites, the one art that screen is
 * about to draw full-bleed. Either failing leaves the splash over a screen that is ready, or lifts it onto a frame
 * that has not drawn, or onto missing art the screen is built around.
 */

import { isRevealReady, isWaitingForData, type RevealInput, type SyncState } from '../launchGate';

const BOOLEANS = [false, true];

const allRevealInputs = (): RevealInput[] => {
  const inputs: RevealInput[] = [];
  for (const coldLaunch of BOOLEANS) {
    for (const contentExists of BOOLEANS) {
      for (const contentDrawn of BOOLEANS) {
        for (const decorationsExpected of BOOLEANS) {
          for (const decorationsLoaded of BOOLEANS) {
            for (const iconExpected of BOOLEANS) {
              for (const iconLoaded of BOOLEANS) {
                inputs.push({
                  coldLaunch,
                  contentExists,
                  contentDrawn,
                  decorationsExpected,
                  decorationsLoaded,
                  iconExpected,
                  iconLoaded,
                });
              }
            }
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
  it('reveals in exactly nine of the 64 states: a warm launch with content, its first frame drawn, decorations loaded if expected, the icon decoded when it is expected', () => {
    const revealing = allRevealInputs().filter((input) => isRevealReady(input));

    // The three states the old rule revealed (decorations settled), each free to
    // skip the icon wait when no icon-bearing screen shows, plus the same three
    // with the icon decoded: nine of sixty-four
    expect(revealing).toHaveLength(9);
    for (const input of revealing) {
      expect(input.coldLaunch).toBe(false);
      expect(input.contentExists).toBe(true);
      expect(input.contentDrawn).toBe(true);
      expect(input.decorationsExpected && !input.decorationsLoaded).toBe(false);
      expect(input.iconExpected && !input.iconLoaded).toBe(false);
    }
  });

  it('never reveals from this gate on a cold launch, which lifted the splash at its first commit', () => {
    const cold = allRevealInputs().filter((input) => input.coldLaunch);

    expect(cold).toHaveLength(64);
    for (const input of cold) expect(isRevealReady(input)).toBe(false);
  });

  it('holds a warm launch past the content commit: the commit scheduled the frame, it is not the frame drawn', () => {
    expect(
      isRevealReady({
        coldLaunch: false,
        contentExists: true,
        contentDrawn: false,
        decorationsExpected: false,
        decorationsLoaded: false,
        iconExpected: true,
        iconLoaded: true,
      })
    ).toBe(false);
  });

  it('reveals a warm launch outside Ramadan at the first drawn frame once the icon has decoded', () => {
    expect(
      isRevealReady({
        coldLaunch: false,
        contentExists: true,
        contentDrawn: true,
        decorationsExpected: false,
        decorationsLoaded: false,
        iconExpected: true,
        iconLoaded: true,
      })
    ).toBe(true);
  });

  it("holds a warm launch through the mosque icon's decode: the first revealed frame carries the icon, never a snap (T-541)", () => {
    expect(
      isRevealReady({
        coldLaunch: false,
        contentExists: true,
        contentDrawn: true,
        decorationsExpected: false,
        decorationsLoaded: false,
        iconExpected: true,
        iconLoaded: false,
      })
    ).toBe(false);
  });

  it('never holds the error screen behind the icon it also draws: its Refresh must stay reachable', () => {
    expect(
      isRevealReady({
        coldLaunch: false,
        contentExists: true,
        contentDrawn: true,
        decorationsExpected: false,
        decorationsLoaded: false,
        iconExpected: false,
        iconLoaded: false,
      })
    ).toBe(true);
  });

  it('holds a warm launch in Ramadan through the decorations load', () => {
    const timeline = [false, true].map((decorationsLoaded) =>
      isRevealReady({
        coldLaunch: false,
        contentExists: true,
        contentDrawn: true,
        decorationsExpected: true,
        decorationsLoaded,
        iconExpected: true,
        iconLoaded: true,
      })
    );

    expect(timeline).toEqual([false, true]);
  });
});
