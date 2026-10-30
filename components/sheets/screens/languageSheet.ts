/**
 * The language sheet's staged commit (T-476), pure so it can be tested without a renderer (the same
 * split as components/sheets/screens/soundSheet.ts).
 *
 * The tap and the settle both stage: the sheet's close is the one commit boundary, and it carries the
 * change exactly once. The loader is revealed on that boundary's own tick, before the commit's first
 * synchronous stretch, which saturates JS and would otherwise freeze the sheet half-closed (D86.8).
 */

import * as Haptics from 'expo-haptics';

import type { LocaleId } from '@/shared/i18n/locale';

import type { LanguageRow } from './languageFilter';
import { stagesLanguageChange } from './languageWheel';

/**
 * The tap's whole effect: the row becomes the staged candidate and the wheel ticks. Nothing commits
 * and nothing closes
 *
 * @param id The row tapped
 * @param tick The tap-stage haptic
 * @returns The value the sheet now holds staged
 */
export const stageLanguage = (id: LocaleId, tick: () => void): LocaleId => {
  tick();
  return id;
};

/**
 * The settle's whole effect: the row the wheel rests on becomes the staged candidate. No tick and no
 * haptic of its own, because the detent's own crossing already ticked that row - a second buzz would
 * double-fire
 *
 * @param rows The rows the wheel is showing
 * @param seat The settled row's index in those rows
 * @returns The value the sheet now holds staged
 */
export const settleStageLanguage = (rows: readonly LanguageRow[], seat: number): LocaleId | null =>
  rows[seat]?.id ?? null;

/**
 * The close: commits the staged row when it is a change, and does nothing otherwise. The caller reads
 * its staged ref synchronously before this runs, so a second close call is a no-op by construction
 *
 * @param staged The candidate a tap or a settle staged, or null
 * @param active The locale already in force
 * @param reveal Stands the loader up for the staged row, before anything heavy runs
 * @param commit Persists the pick, switches the UI, converges the surfaces
 * @returns Whether a change is on its way
 */
export const commitStagedOnClose = (
  staged: LocaleId | null,
  active: LocaleId,
  reveal: (locale: LocaleId) => void,
  commit: (locale: LocaleId) => Promise<void>
): boolean => {
  if (!stagesLanguageChange(staged, active)) return false;

  // The close that carries a change is the one haptic the sheet's unified close impact no longer gives
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  reveal(staged);
  requestAnimationFrame(() => {
    setTimeout(() => {
      commit(staged).catch(() => undefined);
    }, 0);
  });
  return true;
};
