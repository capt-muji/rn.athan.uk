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
