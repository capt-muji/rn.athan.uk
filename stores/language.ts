/**
 * The language switch's surface state (D34, D45): the stored preference, the
 * last-armed stamp that marks the surfaces dirty, and the forward-only pass
 * that reconciles notifications, channels and widgets to the active locale.
 * No rollback exists anywhere here: a pass that dies or fails leaves the stamp
 * unwritten, and the next launch or foreground completes it (R3.4).
 */

import * as Updates from 'expo-updates';
import { atom, getDefaultStore } from 'jotai/vanilla';
import { I18nManager } from 'react-native';

import { currentLocaleId, type LocaleId, localeDirection, setActiveLocale } from '@/shared/i18n/locale';
import logger from '@/shared/logger';
import { resetAndroidChannelCaches } from '@/shared/notifications';
import { rescheduleAllForLanguageChange, withSchedulingLock } from '@/stores/notifications';
import { atomWithStorageString } from '@/stores/storage';

const store = getDefaultStore();

/** The D45 dirty flag: '' means never armed, so the first launch converges */
export const lastArmedLanguageAtom = atomWithStorageString('preference_language_last_armed', '');

/** The D33 preference: '' means no choice yet, so the device locale decides (R1.2) */
export const languagePreferenceAtom = atomWithStorageString('preference_language', '');

/** The D51 progress face: true from the moment a pick starts converging until it settles */
export const languageCommitBusyAtom = atom(false);

/**
 * Brings every notification surface to the active locale: reset the channel
 * dedup caches so the frozen ids re-create under the new names, then one locked
 * full pass re-arms copy at schedule time and re-pushes the widgets. The stamp
 * writes only after a real pass — a bail (nothing armed) or a failure keeps it
 * dirty, so the next launch or foreground retries (R4.1, R4.2).
 */
export const reconcileLanguageSurfaces = async (): Promise<void> => {
  if (currentLocaleId() === store.get(lastArmedLanguageAtom)) return;

  try {
    resetAndroidChannelCaches();

    const armed = await withSchedulingLock(() => rescheduleAllForLanguageChange(), 'reconcileLanguageSurfaces');

    if (armed) store.set(lastArmedLanguageAtom, currentLocaleId());
  } catch (error) {
    logger.warn('LANGUAGE: surface convergence failed, retrying at next launch', { error });
  }
};

/**
 * The Settings pick: persist the choice, switch the UI through the remount key
 * before any surface re-arms, then converge. Convergence never rejects to the
 * caller — forward-only means the sheet's dismiss is unconditional (D34, D47).
 * The busy atom brackets the whole run so the sheet's progress face covers it.
 */
export const commitLanguagePreference = async (locale: LocaleId): Promise<void> => {
  const directionBefore = localeDirection(currentLocaleId());
  store.set(languageCommitBusyAtom, true);
  try {
    store.set(languagePreferenceAtom, locale);
    setActiveLocale(locale);
    await reconcileLanguageSurfaces();
    if (localeDirection(locale) !== directionBefore) {
      // Fabric treats direction as launch-time (D59): converge first, then
      // force the new direction and relaunch. The busy face ends here.
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(localeDirection(locale) === 'rtl');
      await Updates.reloadAsync();
    }
  } finally {
    store.set(languageCommitBusyAtom, false);
  }
};
