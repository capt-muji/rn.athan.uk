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

/** The locale a pick is converging to, while the busy face covers the wait; null when no pick runs */
export const pendingLanguageAtom = atom<LocaleId | null>(null);

/**
 * The D-relaunch handoff (row 80): written before a crossing's reloadAsync and consumed by
 * the next context's launch init, so an in-process relaunch — where no force-stop cancelled
 * any alarm — does not pay the cold-launch refresh-gate reopen (row 78's aggravator).
 * The value is the write's epoch ms: '' means no handoff is held, and a marker too old to
 * be the one this context followed is dead, never consumed.
 */
export const relaunchHandoffAtom = atomWithStorageString('preference_language_relaunch_handoff', '');

/** How long a handoff stays believable: the reload-to-consume span is seconds, not minutes */
const RELAUNCH_HANDOFF_FRESH_MS = 60_000;

/**
 * Reads and clears the marker in one step: the answer is whether this context began as a
 * language relaunch a moment ago. A process death can strand a written marker past the
 * reload it announced, and the cold launch that finds it still needs its gate reopen.
 */
export const consumeRelaunchHandoff = (): boolean => {
  const held = store.get(relaunchHandoffAtom);
  if (held === '') return false;

  store.set(relaunchHandoffAtom, '');
  const writtenAt = Number.parseInt(held, 10);
  if (Number.isNaN(writtenAt)) return false;

  return Date.now() - writtenAt <= RELAUNCH_HANDOFF_FRESH_MS;
};

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
// The direction in force at process start, read before any forceRTL: the
// fallback when no preference is stored (the device decides, then).
const DIRECTIONS = ['ltr', 'rtl'] as const;
const launchDirection = DIRECTIONS[Number(I18nManager.getConstants().isRTL)];

/** The bound on a boundary crossing's convergence wait: the healthy cycle answers in ~1.4 s,
 *  while one silent native call can legally burn 15 s and a starved queue holds the pass for
 *  minutes. Past this the flip applies and forward-only convergence heals next launch. */
const RELOAD_CONVERGENCE_CAP_MS = 10_000;

/**
 * The busy atom brackets the whole run so the sheet's progress face covers it.
 */
export const commitLanguagePreference = async (locale: LocaleId): Promise<void> => {
  // The direction in force comes from the app's own record: the stored
  // preference drives the launch force ('' means the device's launch
  // direction). I18nManager.getConstants() is deliberately not read here: the
  // device proved it stale within a process after a crossing.
  const storedPreference = store.get(languagePreferenceAtom);
  const directionBefore = storedPreference === '' ? launchDirection : localeDirection(storedPreference as LocaleId);
  const crossesBoundary = localeDirection(locale) !== directionBefore;
  store.set(languageCommitBusyAtom, true);
  store.set(pendingLanguageAtom, locale);
  try {
    store.set(languagePreferenceAtom, locale);
    setActiveLocale(locale);
    let passSettled = false;
    if (crossesBoundary) {
      // The cap bounds a starved queue; the losing timer never fires into a settled commit.
      let fireCap!: () => void;
      const capSettled = new Promise<void>((resolve) => {
        fireCap = resolve;
      });
      const settled = reconcileLanguageSurfaces().then(() => {
        passSettled = true;
      });
      const capTimer = setTimeout(() => {
        logger.warn('LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip');
        fireCap();
      }, RELOAD_CONVERGENCE_CAP_MS);
      await Promise.race([settled, capSettled]);
      clearTimeout(capTimer);
    } else {
      await reconcileLanguageSurfaces();
    }
    if (crossesBoundary) {
      // Fabric treats direction as launch-time (D59): converge first, then
      // force the new direction and relaunch. The busy face ends here.
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(localeDirection(locale) === 'rtl');
      try {
        // Only a settled pass earns the handoff: a capped crossing's in-flight work can
        // land beside the relaunch context, and the cold-launch reopen it then keeps is
        // what buys the full pass whose sweep finds what landed
        if (passSettled) store.set(relaunchHandoffAtom, String(Date.now()));
        await Updates.reloadAsync();
      } catch (error) {
        store.set(relaunchHandoffAtom, '');
        // A refused relaunch leaves the forced direction for the next launch
        // to apply; the switch itself completed (Error.tsx's guard shape).
        logger.warn('LANGUAGE: relaunch failed after the RTL flip', { error });
      }
    }
  } finally {
    store.set(languageCommitBusyAtom, false);
    store.set(pendingLanguageAtom, null);
  }
};
