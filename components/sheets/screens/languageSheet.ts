/**
 * The language sheet's pick flow, pure so it can be tested without a renderer
 * (the same split as components/sheets/screens/soundSheet.ts).
 *
 * Forward-only convergence (D34) leaves the pick no failure face: the UI has
 * already switched by the time the commit runs, so both settle paths end in the
 * dismiss and the sheet never stays open over a converged app.
 */

import type { LocaleId } from '@/shared/i18n/locale';

/**
 * @param id The row tapped
 * @param active The locale already in force: its row only closes the sheet
 * @param commit Persists the pick, switches the UI, converges the surfaces
 * @param dismiss Closes the sheet
 */
export const pickLanguage = (
  id: LocaleId,
  active: LocaleId,
  commit: (locale: LocaleId) => Promise<void>,
  dismiss: () => void
): void => {
  if (id === active) {
    dismiss();
    return;
  }

  commit(id)
    .catch(() => undefined)
    .then(dismiss);
};
