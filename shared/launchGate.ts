/**
 * The launch splash decisions app/index.tsx makes, pure so they can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts). They live here rather than beside the screen because expo-router loads every
 * .ts and .tsx file under app/ as a route, a test file included.
 *
 * A wrong answer leaves the splash over a screen that is ready, lifts it onto a frame that has not drawn, or onto
 * a frame whose art is still missing.
 */

/** The states of the sync loadable app/index.tsx reads */
export type SyncState = 'loading' | 'hasData' | 'hasError';

/**
 * Only a launch with no stored days has nothing to show: a warm launch built its lists before the first render, and
 * a finished sync has its own screen, the error screen included.
 *
 * @param sequenceReady Whether the Standard list is built
 * @param syncState The sync loadable's state
 * @returns Whether the spinner is the screen, which on the first render also marks a cold launch
 */
export const isWaitingForData = (sequenceReady: boolean, syncState: SyncState): boolean =>
  !sequenceReady && syncState === 'loading';

export interface RevealInput {
  /** Whether the first render was waiting for data */
  coldLaunch: boolean;
  /** Whether the screen has something other than the spinner to show */
  contentExists: boolean;
  /** Whether the content tree's root has laid out, which on Fabric is its first drawn frame */
  contentDrawn: boolean;
  /** Whether the Ramadan decorations render this session */
  decorationsExpected: boolean;
  decorationsLoaded: boolean;
}

/**
 * A cold launch lifts the splash onto its spinner at the first commit, so it never waits here. A warm launch lifts
 * only on the content's first DRAWN frame, not the commit that scheduled it: onLayout rides the native layout
 * pass, which on Fabric lands past the mount burst that on a slow phone trails the commit by a second or two -
 * revealing at the commit lifts the splash onto the window background (the splash purple) showing through - the
 * app straight from cache, the Masjid icon's bitmap decoding behind the revealed frame rather than holding the
 * splash over a finished screen (owner order 2026-10-30: a near-zero native splash in both launch shapes). Only
 * the Ramadan decorations still hold it: the one art that screen is about to draw full-bleed, and only when it is
 * going to render.
 *
 * @returns Whether a warm launch may hide the splash now
 */
export const isRevealReady = ({
  coldLaunch,
  contentExists,
  contentDrawn,
  decorationsExpected,
  decorationsLoaded,
}: RevealInput): boolean => !coldLaunch && contentExists && contentDrawn && (!decorationsExpected || decorationsLoaded);
