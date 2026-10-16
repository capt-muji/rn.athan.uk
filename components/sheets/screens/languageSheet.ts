/**
 * The language sheet's pick flow, pure so it can be tested without a renderer
 * (the same split as components/sheets/screens/soundSheet.ts).
 *
 * The loader is revealed on the tap itself, before the sheet even begins to close:
 * the commit's first synchronous stretch saturates JS, and a loader that waits for
 * it paints a sheet frozen half-closed instead (owner report, 2026-10-16).
 */

import type { LocaleId } from '@/shared/i18n/locale';

/**
 * @param id The row tapped
 * @param active The locale already in force: its row only closes the sheet
 * @param commit Persists the pick, switches the UI, converges the surfaces
 * @param dismiss Closes the sheet
 * @param reveal Stands the loader up for the pick, before anything heavy runs
 */
export const pickLanguage = (
  id: LocaleId,
  active: LocaleId,
  commit: (locale: LocaleId) => Promise<void>,
  dismiss: () => void,
  reveal: (locale: LocaleId) => void
): void => {
  if (id === active) {
    dismiss();
    return;
  }

  // The loader paints this frame; the dismiss and the commit both wait a paint, so
  // the freeze the commit's first stretch causes lands behind the purple face
  reveal(id);
  requestAnimationFrame(() => {
    setTimeout(() => {
      dismiss();
      commit(id).catch(() => undefined);
    }, 0);
  });
};
