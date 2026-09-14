/**
 * The athan sound sheet's decisions, pure so they can be tested without a renderer (same split as
 * components/countdown/tipGeometry.ts).
 *
 * Athan 1 is index 0, so every check that a choice exists has to tell 0 apart from no choice. A truthiness check
 * drops a pick of Athan 1: the sheet highlights the saved athan again and closing it saves nothing.
 */

/**
 * @param draft The row tapped since the sheet opened, or null when none was
 * @param saved The athan saved before the sheet opened
 * @returns The row the sheet highlights
 */
export const displayedSoundSelection = (draft: number | null, saved: number): number => draft ?? saved;

/**
 * @param draft The row tapped since the sheet opened, or null when none was
 * @returns Whether closing the sheet has a choice to save
 */
export const hasSoundDraft = (draft: number | null): draft is number => draft !== null;

/** The preview player and the last status payload the sheet has for it */
export interface PreviewPlayback {
  /** The row playing, or null when none is */
  playingIndex: number | null;
  playerId: string;
  /** The player the status payload came from, which can be one already released */
  statusId: string;
  playing: boolean;
  currentTime: number;
  duration: number;
}

/**
 * expo's status hook keeps the last payload across a player swap. After a preview runs to its end, that payload
 * reads as finished, so the next row started, the same row included, would take it as its own and stop in the same
 * commit. A preview paused or switched mid-play leaves a payload that does not read as finished. Only a status from
 * the current player may end the preview. The tenth of a second covers a clip that stops a fraction short of the
 * duration it reported.
 *
 * @returns Whether the playing row should be cleared
 */
export const isPreviewFinished = ({
  playingIndex,
  playerId,
  statusId,
  playing,
  currentTime,
  duration,
}: PreviewPlayback): boolean => {
  if (playingIndex === null || statusId !== playerId) return false;
  return !playing && currentTime > 0 && duration > 0 && currentTime >= duration - 0.1;
};

/**
 * The released player's status would show the old clip's leftover seconds, and a new player reports no duration
 * for its first moments, so the clip's tabulated length stands in until the current player reports one. That lets
 * the countdown appear with the pause icon. Rounded rather than floored, because iOS refines a provisional duration
 * and a floor shows one second low as the clip starts.
 *
 * @param tabulatedSeconds Each athan's length in whole seconds, by row
 * @returns Seconds left on the playing row, or 0 when nothing plays
 */
export const previewRemainingSeconds = (
  { playingIndex, playerId, statusId, currentTime, duration }: PreviewPlayback,
  tabulatedSeconds: readonly number[]
): number => {
  if (playingIndex === null) return 0;
  if (statusId === playerId && duration > 0) return Math.max(0, Math.round(duration - currentTime));
  return tabulatedSeconds[playingIndex];
};
