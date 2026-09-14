/**
 * The launch splash decisions app/index.tsx makes, pure so they can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts). They live here rather than beside the screen because expo-router loads every
 * .ts and .tsx file under app/ as a route, a test file included.
 *
 * A wrong answer leaves the splash over a screen that is ready, or lifts it onto a frame whose art is still missing.
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
  masjidIconLoaded: boolean;
  /** Whether the Ramadan decorations render this session */
  decorationsExpected: boolean;
  decorationsLoaded: boolean;
}

/**
 * A cold launch lifts the splash onto its spinner at the first commit, so it never waits here. A warm launch waits
 * for the bitmaps that arrive after its first commit, so the first frame it reveals is complete, but only for
 * decorations it is going to render.
 *
 * @returns Whether a warm launch may hide the splash now
 */
export const isRevealReady = ({
  coldLaunch,
  contentExists,
  masjidIconLoaded,
  decorationsExpected,
  decorationsLoaded,
}: RevealInput): boolean =>
  !coldLaunch && contentExists && masjidIconLoaded && (!decorationsExpected || decorationsLoaded);
